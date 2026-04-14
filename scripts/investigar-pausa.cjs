const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function investigar() {
  console.log(">>> INVESTIGANDO CONFIGURAÇÕES DE PAUSA <<<");
  
  const configRef = db.collection('configuracoes').doc('automacao');
  const configSnap = await configRef.get();
  
  if (configSnap.exists) {
    console.log("Configurações em 'configuracoes/automacao':");
    console.log(JSON.stringify(configSnap.data(), null, 2));
  } else {
    console.log("Documento 'configuracoes/automacao' NÃO EXISTE!");
  }

  console.log("\n>>> INVESTIGANDO COLEÇÃO 'TURMA C CG' <<<");
  const empRef = db.collection('turma c cg');
  const empSnap = await empRef.get();
  console.log(`Total de documentos na coleção 'turma c cg': ${empSnap.size}`);
  
  if (empSnap.size > 0) {
    const first = empSnap.docs[0].data();
    console.log("Exemplo de documento em 'turma c cg':", JSON.stringify({
        id: empSnap.docs[0].id,
        name: first.name,
        assDss: first.assDss,
        time: first.time
    }, null, 2));
  }

  console.log("\n>>> INVESTIGANDO HISTÓRICO RECENTE <<<");
  const histSnap = await db.collection('historico_dss')
    .orderBy('salvoEm', 'desc')
    .limit(5)
    .get();
    
  histSnap.forEach(doc => {
    const d = doc.data();
    console.log(`ID: ${doc.id} | Turma: ${d.turma} | Salvo Em: ${d.salvoEm ? d.salvoEm.toDate().toLocaleString('pt-BR') : 'N/A'}`);
  });
}

investigar().catch(console.error);
