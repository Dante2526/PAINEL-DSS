const admin = require('firebase-admin');

// Pega o JSON de dentro do Secret do GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
// Pega a variável que diz qual turma está rodando hoje (A, B, C ou D)
const TARGET_TEAM = process.env.TARGET_TEAM;

// --- VALIDAÇÃO DE SEGURANÇA ---
if (!TARGET_TEAM || (TARGET_TEAM !== 'A' && TARGET_TEAM !== 'B' && TARGET_TEAM !== 'C' && TARGET_TEAM !== 'D' && TARGET_TEAM !== 'CCG')) {
  console.error("ERRO CRÍTICO: TARGET_TEAM não definido ou inválido (Esperado: A, B, C, D ou CCG).");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- DEFINIÇÃO DOS NOMES DAS COLEÇÕES ---
let colEmployeesName = '';
let colRegistrosName = '';

if (TARGET_TEAM === 'A') {
  colEmployeesName = 'turma a';
  colRegistrosName = 'registrosDSS A';
} else if (TARGET_TEAM === 'B') {
  colEmployeesName = 'turma b';
  colRegistrosName = 'registrosDSS B';
} else if (TARGET_TEAM === 'C') {
  colEmployeesName = 'turma c';
  colRegistrosName = 'registrosDSS C';
} else if (TARGET_TEAM === 'D') {
  colEmployeesName = 'turma d';
  colRegistrosName = 'registrosDSS D';
} else if (TARGET_TEAM === 'CCG') {
  colEmployeesName = 'turma c cg';
  colRegistrosName = 'registrosDSS C CG';
}

console.log(`>>> INICIANDO LIMPEZA PARA A TURMA: ${TARGET_TEAM} <<<`);
console.log(`Coleções alvo: '${colEmployeesName}', '${colRegistrosName}' e controle de envios.`);

// --- GERAÇÃO DA DATA VIRTUAL (Fallback) ---
// Subtrai 6 horas do relógio para garantir que a madrugada pertença ao dia anterior
function getDataDoPlantaoFallback(isoOnly = false) {
  const dataVirtual = new Date(new Date().getTime() - (6 * 60 * 60 * 1000));
  
  if (isoOnly) {
    const ano = dataVirtual.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' });
    const mes = dataVirtual.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: '2-digit' });
    const dia = dataVirtual.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' });
    return `${ano}-${mes}-${dia}`;
  }

  return dataVirtual.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// --- LÓGICA DE CONSENSO DE DATA ---
function getConsensusDate(funcionarios) {
  const counts = {};
  
  funcionarios.forEach(f => {
    if (f.t) {
      let dateObj = null;
      // Trata se for Timestamp do Firebase, String ou objeto Date
      if (typeof f.t.toDate === 'function') {
        dateObj = f.t.toDate();
      } else if (f.t instanceof Date) {
        dateObj = f.t;
      } else if (f.t.seconds) { // Estrutura básica de Timestamp se não for convertida
        dateObj = new Date(f.t.seconds * 1000);
      } else {
        dateObj = new Date(f.t);
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const ano = dateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric' });
        const mes = dateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', month: '2-digit' });
        const dia = dateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' });
        const iso = `${ano}-${mes}-${dia}`;
        counts[iso] = (counts[iso] || 0) + 1;
      }
    }
  });

  let topDate = null;
  let maxCount = 0;
  for (const date in counts) {
    if (counts[date] > maxCount) {
      maxCount = counts[date];
      topDate = date;
    }
  }

  // Se houver uma data com 5 ou mais assinaturas, esse é o nosso dia
  if (topDate && maxCount >= 5) {
    console.log(`[Consenso] Data identificada por assinaturas: ${topDate} (${maxCount} funcionários)`);
    return topDate;
  }

  return null;
}

// --- FUNÇÃO 0: Salvar Histórico (ANTES da limpeza) ---
async function salvarHistorico() {
  console.log(`>>> Salvando histórico da Turma ${TARGET_TEAM} antes da limpeza...`);

  // 1. Ler todos os funcionários
  const empSnapshot = await db.collection(colEmployeesName).get();
  if (empSnapshot.empty) {
    console.log(`Nenhum funcionário encontrado. Histórico não será salvo.`);
    return;
  }

  // 2. Ler registros DSS (assunto/responsável)
  const regSnapshot = await db.collection(colRegistrosName).get();
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

  // 3. Compactar funcionários no formato minificado
  const funcionarios = [];
  empSnapshot.forEach(doc => {
    const emp = doc.data();

    // Determinar status compacto
    let status = 'PEN'; // Pendente (default)
    if (emp.absent === true) status = 'AUS';
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

  // 4. Determinar a data correta (Consenso vs Fallback)
  let dataISO = getConsensusDate(funcionarios);
  let dataBR = '';

  if (dataISO) {
    // Converte YYYY-MM-DD para DD/MM/YYYY para o campo 'data'
    const [y, m, d] = dataISO.split('-');
    dataBR = `${d}/${m}/${y}`;
  } else {
    console.log(`[Aviso] Consenso não atingido. Usando data de execução.`);
    dataISO = getDataDoPlantaoFallback(true);
    dataBR = getDataDoPlantaoFallback(false);
  }

  const docId = `${TARGET_TEAM}_${dataISO}`;

  const historicoDoc = {
    data: dataBR,
    dataISO: dataISO,
    turma: TARGET_TEAM,
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

  // 5. Salvar na coleção historico_dss
  await db.collection('historico_dss').doc(docId).set(historicoDoc);
  console.log(`[OK] Histórico salvo: historico_dss/${docId} (${funcionarios.length} funcionários)`);
}

// --- FUNÇÃO 1: Limpar a coleção de funcionários ---
async function limparEmployees() {
  console.log(`Verificando coleção "${colEmployeesName}"...`);
  const collectionRef = db.collection(colEmployeesName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em "${colEmployeesName}". Nada a fazer.`);
    return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    const docRef = db.collection(colEmployeesName).doc(doc.id);
    batch.update(docRef, {
      assDss: false,
      bem: false,
      mal: false,
      time: null,
      // Se necessário resetar 'absent' para false todo dia, descomente abaixo:
      // absent: false 
    });
  });
  await batch.commit();
  console.log(`[OK] Reset realizado em ${snapshot.size} funcionários da "${colEmployeesName}".`);
}

// --- FUNÇÃO 2: Limpar a coleção 'registrosDSS' ---
async function limparRegistros() {
  console.log(`Verificando coleção "${colRegistrosName}"...`);
  const collectionRef = db.collection(colRegistrosName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum registro encontrado em "${colRegistrosName}". Nada a apagar.`);
    return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`[OK] Apagados ${snapshot.size} registros antigos de "${colRegistrosName}".`);
}

// --- FUNÇÃO 3: Limpar o controle de envio ---
async function limparControleEnvio() {
  const docId = `status_envio_${TARGET_TEAM}`;
  console.log(`Apagando trava de envio: controle_envios/${docId}...`);

  const docRef = db.collection('controle_envios').doc(docId);
  await docRef.delete();

  console.log(`[OK] Trava de envio removida para a Turma ${TARGET_TEAM}.`);
}

// --- FUNÇÃO PRINCIPAL ---
async function executarLimpezaCompleta() {
  try {
    const sysRef = await db.collection('configuracoes').doc('automacao').get();
    
    // Lógica Robusta: Checa a chave exata (ex: CCG) e a variação com espaço (ex: C CG) caso exista no banco
    const isPausedInDb = sysRef.exists && (
      sysRef.data()[TARGET_TEAM] === true || 
      (TARGET_TEAM === 'CCG' && sysRef.data()['C CG'] === true)
    );

    if (isPausedInDb) {
      console.log(`>>> Ação Cancelada. A automação (Limpeza) da Turma ${TARGET_TEAM} está PAUSADA pelo painel administrativo.`);
      process.exit(0);
    }

    // PASSO 1: Salvar o histórico ANTES de limpar
    await salvarHistorico();

    // PASSO 2: Executar a limpeza em paralelo
    await Promise.all([
      limparEmployees(),
      limparRegistros(),
      limparControleEnvio()
    ]);
    console.log(">>> LIMPEZA CONCLUÍDA COM SUCESSO <<<");

  } catch (error) {
    console.error('ERRO FATAL AO EXECUTAR LIMPEZA:', error);
    process.exit(1);
  }
}

executarLimpezaCompleta();
