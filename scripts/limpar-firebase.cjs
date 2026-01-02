const admin = require('firebase-admin');

// Pega o JSON de dentro do Secret do GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- FUNÇÃO 1: Limpar a coleção 'turma b' ---
async function limparEmployees() {
  console.log('Iniciando limpeza da coleção "turma b"...');
  
  // ATENÇÃO: Aponta para "turma b"
  const collectionRef = db.collection('turma b');
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log('Nenhum documento encontrado em "turma b".');
    return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    // ATENÇÃO: Atualiza dentro de "turma b"
    const docRef = db.collection('turma b').doc(doc.id);
    batch.update(docRef, {
      assDss: false,
      bem: false,
      mal: false,
      time: null
    });
  });
  
  await batch.commit();
  console.log(`Sucesso! ${snapshot.size} documentos de "turma b" foram atualizados.`);
}

// --- FUNÇÃO 2: Limpar a coleção 'registrosDSS' ---
async function limparColecaoDeRegistros(nomeColecao) {
  console.log(`Iniciando limpeza da coleção "${nomeColecao}"...`);
  const collectionRef = db.collection(nomeColecao);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado em "${nomeColecao}".`);
    return 0;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Sucesso! ${snapshot.size} documentos de "${nomeColecao}" foram APAGADOS.`);
}

// --- FUNÇÃO PRINCIPAL (Roda as DUAS limpezas) ---
async function executarLimpezaCompleta() {
  console.log("INICIANDO LIMPEZA COMPLETA AGENDADA...");
  try {
    // Roda as duas funções ao mesmo tempo
    await Promise.all([
      limparEmployees(),
      limparColecaoDeRegistros('registrosDSS')
    ]);
    console.log("Limpeza completa de ambas as coleções concluída.");

  } catch (error) {
    console.error('ERRO GERAL AO EXECUTAR LIMPEZA:', error);
    process.exit(1);
  }
}

// Roda a função principal
executarLimpezaCompleta();