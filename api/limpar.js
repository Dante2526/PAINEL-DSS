import admin from 'firebase-admin';
import config from '../scripts/config.cjs';

const {
  validateTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  isDiaDeTrabalho,
  getConsensusDate,
  getDataDoPlantaoFallback,
  BATCH_LIMIT,
} = config;

// --- FUNÇÃO AUXILIAR: Salvar Histórico ---
async function salvarHistorico(db, team, colEmployees, colRegistros) {
  console.log(`[Histórico] Iniciando salvamento para Turma ${team}...`);

  const empSnapshot = await db.collection(colEmployees).get();
  if (empSnapshot.empty) {
    console.log(`[Histórico] Nenhum funcionário encontrado. Histórico não será salvo.`);
    return;
  }

  const regSnapshot = await db.collection(colRegistros).get();
  const registros7H = [];
  const registros6H = [];
  regSnapshot.forEach(doc => {
    const reg = doc.data();
    const entry = {
      assunto: reg.assunto || '',
      matricula: reg.matricula || '',
      name: reg.name || ''
    };
    if (reg.TURNO === '6H') registros6H.push(entry);
    else registros7H.push(entry);
  });

  const funcionarios = [];
  empSnapshot.forEach(doc => {
    const emp = doc.data();
    let status = 'PEN';
    if (emp.absent === true || emp.ausente === true) status = 'AUS';
    else if (emp.mal === true) status = 'MAL';
    else if (emp.bem === true || emp.assDss === true) status = 'BEM';

    funcionarios.push({
      m: emp.matricula || '',
      n: (emp.name || '').replace(/\s+/g, ' ').trim(),
      s: status,
      t: emp.time || null,
      turno: emp.turno || '7H'
    });
  });

  let dataISO = getConsensusDate(funcionarios);
  let dataBR = '';
  let hasConsensus = !!dataISO;

  if (dataISO) {
    const [y, m, d] = dataISO.split('-');
    dataBR = `${d}/${m}/${y}`;
  } else {
    console.log(`[Histórico] Consenso não atingido. Usando data de execução.`);
    dataISO = getDataDoPlantaoFallback('ISO');
    dataBR = getDataDoPlantaoFallback('DD/MM/YYYY');
  }

  const docId = `${team}_${dataISO}`;
  
  // Proteção contra sobrescrita acidental (ex: cron rodando duas vezes)
  const docRef = db.collection('historico_dss').doc(docId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists && !hasConsensus) {
    console.log(`[Histórico] Histórico para ${docId} já existe e o painel atual parece estar vazio (sem consenso). Ignorando para não sobrescrever com pendentes.`);
    return;
  }

  const historicoDoc = {
    data: dataBR,
    dataISO: dataISO,
    turma: team,
    registros7H: registros7H,
    registros6H: registros6H,
    r: funcionarios,
    totalFuncionarios: funcionarios.length,
    totalPresentes: funcionarios.filter(f => f.s === 'BEM' || f.s === 'MAL').length,
    totalAusentes: funcionarios.filter(f => f.s === 'AUS').length,
    totalMal: funcionarios.filter(f => f.s === 'MAL').length,
    totalPendentes: funcionarios.filter(f => f.s === 'PEN').length,
    salvoEm: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(historicoDoc);
  console.log(`[Histórico] Salvo com sucesso: historico_dss/${docId}`);
}

// --- FUNÇÃO AUXILIAR: Limpar Funcionários ---
async function limparEmployees(db, colEmployees) {
  console.log(`[Limpeza] Verificando funcionários em "${colEmployees}"...`);
  const snapshot = await db.collection(colEmployees).get();

  if (snapshot.empty) {
    console.log(`[Limpeza] Nenhum funcionário encontrado. Nada a resetar.`);
    return;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    chunk.forEach(doc => {
      batch.update(doc.ref, {
        assDss: false,
        bem: false,
        mal: false,
        time: null
      });
    });
    await batch.commit();
  }
  console.log(`[Limpeza] Reset em ${docs.length} funcionários concluído.`);
}

// --- FUNÇÃO AUXILIAR: Limpar Registros DSS ---
async function limparRegistros(db, colRegistros) {
  console.log(`[Limpeza] Verificando registros antigos em "${colRegistros}"...`);
  const snapshot = await db.collection(colRegistros).get();

  if (snapshot.empty) {
    console.log(`[Limpeza] Nenhum registro encontrado. Nada a apagar.`);
    return;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    chunk.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
  console.log(`[Limpeza] Remoção de ${docs.length} registros DSS concluída.`);
}

// --- FUNÇÃO AUXILIAR: Limpar Trava de Envio ---
async function limparControleEnvio(db, team) {
  const docId = `status_envio_${team}`;
  console.log(`[Limpeza] Verificando trava de envio: controle_envios/${docId}...`);

  const docRef = db.collection('controle_envios').doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log(`[Limpeza] Nenhuma trava encontrada. Nada a remover.`);
    return;
  }

  await docRef.delete();
  console.log(`[Limpeza] Trava de envio removida para a Turma ${team}.`);
}

// --- ENDPOINT SERVERLESS PRINCIPAL ---
export default async function handler(req, res) {
  // 1. Validar Token de Segurança
  const { team, token, force } = req.query;
  const cronSecretToken = process.env.CRON_SECRET_TOKEN;
  const forceExecution = force === 'true';

  if (!cronSecretToken || token !== cronSecretToken) {
    console.warn(`[Acesso Negado] Token inválido ou não informado.`);
    return res.status(401).json({ error: 'Acesso Não Autorizado. Token inválido.' });
  }

  // 2. Validar a Turma (Team)
  let validatedTeam;
  try {
    validatedTeam = validateTargetTeam(team, true);
  } catch (err) {
    console.error(`[Erro de Parâmetro] ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  // 2.5 Verificar Escala de Trabalho (Folga vs Trabalho)
  const worksToday = isDiaDeTrabalho(validatedTeam);
  if (!worksToday && !forceExecution) {
    console.log(`>>> [SERVERLESS] Execução cancelada. Hoje é dia de FOLGA para a Turma ${validatedTeam} <<<`);
    return res.status(200).json({
      status: 'skipped_offday',
      message: `Hoje é dia de FOLGA (fora do ciclo de trabalho 2x2) para a Turma ${validatedTeam}. Nenhuma limpeza foi necessária.`
    });
  }

  console.log(`>>> [SERVERLESS] Iniciando Limpeza & Histórico para a Turma: ${validatedTeam} <<<`);

  try {
    // 3. Inicialização Segura do Firebase Admin
    let app;
    if (admin.apps.length === 0) {
      const serviceAccount = parseServiceAccount(true);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      app = admin.app();
    }
    const db = app.firestore();

    // 4. Verificar se a automação está pausada no banco de dados
    const isPaused = await isAutomacaoPausada(db, validatedTeam);
    if (isPaused) {
      console.log(`>>> [SERVERLESS] Execução cancelada. A automação da Turma ${validatedTeam} está PAUSADA no painel.`);
      return res.status(200).json({
        status: 'cancelled',
        message: `A automação (Limpeza) para a Turma ${validatedTeam} está PAUSADA no painel administrativo.`
      });
    }

    const { employees: colEmployeesName, registros: colRegistrosName } = getCollections(validatedTeam);

    // 5. Salvar o Histórico do Dia
    await salvarHistorico(db, validatedTeam, colEmployeesName, colRegistrosName);

    // 6. Executar Limpezas em Paralelo
    await Promise.all([
      limparEmployees(db, colEmployeesName),
      limparRegistros(db, colRegistrosName),
      limparControleEnvio(db, validatedTeam)
    ]);

    console.log(`>>> [SERVERLESS] Limpeza e histórico concluídos com sucesso para ${validatedTeam} <<<`);
    return res.status(200).json({
      status: 'success',
      message: `Limpeza e histórico concluídos com sucesso para a Turma ${validatedTeam}.`
    });

  } catch (error) {
    console.error('[SERVERLESS ERRO FATAL]', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a limpeza do Firebase.',
      details: error.message
    });
  }
}
