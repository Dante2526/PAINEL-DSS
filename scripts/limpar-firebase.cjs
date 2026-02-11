const admin = require('firebase-admin');

// Pega o JSON de dentro do Secret do GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
// Pega a variável que diz qual turma está rodando hoje (A, B, C ou D)
const TARGET_TEAM = process.env.TARGET_TEAM;

// --- VALIDAÇÃO DE SEGURANÇA ---
if (!TARGET_TEAM || (TARGET_TEAM !== 'A' && TARGET_TEAM !== 'B' && TARGET_TEAM !== 'C' && TARGET_TEAM !== 'D')) {
  console.error("ERRO CRÍTICO: TARGET_TEAM não definido ou inválido (Esperado: A, B, C ou D).");
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
}

console.log(`>>> INICIANDO LIMPEZA PARA A TURMA: ${TARGET_TEAM} <<<`);
console.log(`Coleções alvo: '${colEmployeesName}', '${colRegistrosName}' e controle de envios.`);

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

// --- FUNÇÃO 3: Limpar o controle de envio (NOVA) ---
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
    await Promise.all([
      limparEmployees(),
      limparRegistros(),
      limparControleEnvio() // Adicionado aqui
    ]);
    console.log(">>> LIMPEZA CONCLUÍDA COM SUCESSO <<<");

  } catch (error) {
    console.error('ERRO FATAL AO EXECUTAR LIMPEZA:', error);
    process.exit(1);
  }
}

executarLimpezaCompleta();
