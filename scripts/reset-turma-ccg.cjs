const admin = require('firebase-admin');

// Pega o JSON de dentro do Secret do GitHub ou ambiente local
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountString) {
  console.error("ERRO: FIREBASE_SERVICE_ACCOUNT_JSON não configurado.");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetCCG() {
  console.log(">>> INICIANDO RESET DA TURMA CCG <<<");

  // 1. Apagar o histórico indevido do dia 11
  const historicoId = 'CCG_2026-04-11';
  console.log(`Limpando histórico: historico_dss/${historicoId}...`);
  await db.collection('historico_dss').doc(historicoId).delete();
  console.log("[OK] Histórico do dia 11 removido.");

  // 2. Resetar o status dos funcionários (turma c cg) sem apagar os nomes
  const colEmployeesName = 'turma c cg';
  console.log(`Resetando status na coleção: '${colEmployeesName}'...`);
  const empSnapshot = await db.collection(colEmployeesName).get();
  
  if (!empSnapshot.empty) {
    const batch = db.batch();
    empSnapshot.forEach(doc => {
      // Usamos update para manter os campos 'name' e 'matricula' intactos
      batch.update(doc.ref, {
        assDss: false,
        bem: false,
        mal: false,
        time: null,
        absent: false
      });
    });
    await batch.commit();
    console.log(`[OK] Status de ${empSnapshot.size} funcionários resetados para 'Pendente'.`);
  } else {
    console.log("[AVISO] A coleção de funcionários está vazia.");
  }

  // 3. Esvaziar registros de assunto/responsável
  const colRegistrosName = 'registrosDSS C CG';
  console.log(`Limpando registros de assunto: '${colRegistrosName}'...`);
  const regSnapshot = await db.collection(colRegistrosName).get();
  
  if (!regSnapshot.empty) {
    const batch = db.batch();
    regSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[OK] Removidos ${regSnapshot.size} registros de assunto.`);
  } else {
    console.log("[AVISO] A coleção de registros já estava vazia.");
  }

  console.log("\n>>> RESET CONCLUÍDO COM SUCESSO! <<<");
  console.log("A Turma CCG agora está 100% limpa e zera.");
}

resetCCG().catch(err => {
  console.error("ERRO NO RESET:", err);
  process.exit(1);
});
