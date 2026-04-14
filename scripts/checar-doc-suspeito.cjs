const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDoc() {
  const docId = 'CCG_2026-04-11';
  console.log(`Buscando documento: historico_dss/${docId}`);
  
  const docRef = db.collection('historico_dss').doc(docId);
  const snap = await docRef.get();
  
  if (!snap.exists) {
    console.log("Documento não encontrado.");
    return;
  }
  
  const data = snap.data();
  console.log("------------------------------------------");
  console.log("ID:", snap.id);
  console.log("Turma:", data.turma);
  console.log("Data campo 'data':", data.data);
  console.log("Salvo Em (Timestamp):", data.salvoEm ? data.salvoEm.toDate().toLocaleString('pt-BR') : "Nulo");
  console.log("------------------------------------------");
}

checkDoc().catch(console.error);
