const admin = require('firebase-admin');
const {
  getTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  getConsensusDate,
  getDataDoPlantaoFallback,
  BATCH_LIMIT,
} = require('./config.cjs');

// --- INICIALIZAÇÃO SEGURA ---
const serviceAccount = parseServiceAccount();
const TARGET_TEAM = getTargetTeam();
const { employees: colEmployeesName, registros: colRegistrosName } = getCollections(TARGET_TEAM);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

console.log(`>>> INICIANDO LIMPEZA PARA A TURMA: ${TARGET_TEAM} <<<`);
console.log(`Coleções alvo: '${colEmployeesName}', '${colRegistrosName}' e controle de envios.`);

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
    dataISO = getDataDoPlantaoFallback('ISO');
    dataBR = getDataDoPlantaoFallback('DD/MM/YYYY');
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
// Corrigido: divide em lotes de 500 para respeitar o limite do Firestore Batch
async function limparEmployees() {
  console.log(`Verificando coleção "${colEmployeesName}"...`);
  const collectionRef = db.collection(colEmployeesName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em "${colEmployeesName}". Nada a fazer.`);
    return 0;
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
        time: null,
        // Se necessário resetar 'absent' para false todo dia, descomente abaixo:
        // absent: false 
      });
    });
    await batch.commit();
    console.log(`  [Lote ${Math.floor(i / BATCH_LIMIT) + 1}] Reset em ${chunk.length} funcionários.`);
  }
  console.log(`[OK] Reset realizado em ${docs.length} funcionários da "${colEmployeesName}".`);
}

// --- FUNÇÃO 2: Limpar a coleção 'registrosDSS' ---
// Corrigido: divide em lotes de 500 para respeitar o limite do Firestore Batch
async function limparRegistros() {
  console.log(`Verificando coleção "${colRegistrosName}"...`);
  const collectionRef = db.collection(colRegistrosName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum registro encontrado em "${colRegistrosName}". Nada a apagar.`);
    return 0;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_LIMIT);
    chunk.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`  [Lote ${Math.floor(i / BATCH_LIMIT) + 1}] Apagados ${chunk.length} registros.`);
  }
  console.log(`[OK] Apagados ${docs.length} registros antigos de "${colRegistrosName}".`);
}

// --- FUNÇÃO 3: Limpar o controle de envio ---
async function limparControleEnvio() {
  const docId = `status_envio_${TARGET_TEAM}`;
  console.log(`Verificando trava de envio: controle_envios/${docId}...`);

  const docRef = db.collection('controle_envios').doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.log(`[OK] Nenhuma trava de envio encontrada para a Turma ${TARGET_TEAM}. Nada a apagar.`);
    return;
  }

  await docRef.delete();
  console.log(`[OK] Trava de envio removida para a Turma ${TARGET_TEAM}.`);
}

// --- FUNÇÃO PRINCIPAL ---
async function executarLimpezaCompleta() {
  try {
    const isPaused = await isAutomacaoPausada(db, TARGET_TEAM);

    if (isPaused) {
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
