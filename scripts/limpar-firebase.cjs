const admin = require('firebase-admin');

// Pega o JSON de dentro do Secret do GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Pega a variável que diz qual turma está rodando hoje (A ou B)
// Se não for definida, paramos o script por segurança.
const TARGET_TEAM = process.env.TARGET_TEAM; 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- DEFINIÇÃO DOS NOMES DAS COLEÇÕES ---
let colEmployeesName = '';
let colRegistrosName = '';

if (TARGET_TEAM === 'A') {
  colEmployeesName = 'turma a';       // Conforme print
  colRegistrosName = 'registrosDSS A'; // Conforme print
} else if (TARGET_TEAM === 'B') {
  colEmployeesName = 'turma b';       // Conforme print
  colRegistrosName = 'registrosDSS B'; // Conforme print
} else {
  console.error("ERRO: A variável TARGET_TEAM não foi definida ou é inválida (Deve ser 'A' ou 'B').");
  process.exit(1);
}

console.log(`>>> CONFIGURADO PARA LIMPEZA DA TURMA: ${TARGET_TEAM} <<<`);

// --- FUNÇÃO 1: Limpar a coleção de funcionários (turma a ou b) ---
async function limparEmployees() {
  console.log(`Iniciando limpeza da coleção "${colEmployeesName}"...`);
const collectionRef = db.collection(colEmployeesName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em "${colEmployeesName}".`);
return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    const docRef = db.collection(colEmployeesName).doc(doc.id);
    batch.update(docRef, {
      assDss: false,
      bem: false,
      mal: false,
      time: null
    });
  });
await batch.commit();
  console.log(`Sucesso! ${snapshot.size} documentos de "${colEmployeesName}" foram atualizados.`);
}

// --- FUNÇÃO 2: Limpar a coleção 'registrosDSS' (A ou B) ---
async function limparRegistros() {
  console.log(`Iniciando limpeza da coleção "${colRegistrosName}"...`);
const collectionRef = db.collection(colRegistrosName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em "${colRegistrosName}".`);
return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
console.log(`Sucesso! ${snapshot.size} documentos de "${colRegistrosName}" foram APAGADOS.`);
}

// --- FUNÇÃO PRINCIPAL ---
async function executarLimpezaCompleta() {
  console.log("INICIANDO LIMPEZA COMPLETA AGENDADA...");
try {
    // Roda as duas funções ao mesmo tempo
    await Promise.all([
      limparEmployees(),
      limparRegistros()
    ]);
console.log("Limpeza completa de ambas as coleções concluída.");

  } catch (error) {
    console.error('ERRO GERAL AO EXECUTAR LIMPEZA:', error);
process.exit(1); // Faz o GitHub Action falhar
  }
}

// Roda a função principal
executarLimpezaCompleta();