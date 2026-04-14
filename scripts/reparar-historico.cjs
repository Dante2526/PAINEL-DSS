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

// --- LÓGICA DE CONSENSO DE DATA ---
function getConsensusDate(funcionarios) {
  const counts = {};
  
  if (!funcionarios || !Array.isArray(funcionarios)) return null;

  funcionarios.forEach(f => {
    // No histórico salvo, o campo 't' pode ser um Timestamp, String ou Date
    if (f.t) {
      let dateObj = null;
      if (f.t && typeof f.t.toDate === 'function') {
        dateObj = f.t.toDate();
      } else if (f.t instanceof Date) {
        dateObj = f.t;
      } else if (f.t && f.t._seconds) { // Firebase Timestamp em formato JSON bruto
        dateObj = new Date(f.t._seconds * 1000);
      } else if (f.t && f.t.seconds) { // Outra variação de Timestamp
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
    return { date: topDate, count: maxCount };
  }

  return null;
}

// --- FUNÇÃO PRINCIPAL DE REPARO ---
async function executarReparo() {
  console.log(">>> INICIANDO REPARO DO HISTÓRICO... <<<");
  
  const historyRef = db.collection('historico_dss');
  const snapshot = await historyRef.get();

  if (snapshot.empty) {
    console.log("Nenhum histórico encontrado para analisar.");
    return;
  }

  console.log(`Analisando ${snapshot.size} documentos...`);

  let corrigidos = 0;
  let ignorados = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentId = doc.id; // Ex: B_2026-04-11
    const turma = data.turma || currentId.split('_')[0];
    
    // O array de funcionários no histórico é 'r'
    const consensus = getConsensusDate(data.r);

    if (consensus) {
      const correctId = `${turma}_${consensus.date}`;

      if (currentId !== correctId) {
        console.log(`[DIVERGÊNCIA] Documento ${currentId} -> Deveria ser ${correctId} (${consensus.count} assinaturas no dia ${consensus.date})`);
        
        // Verifica se o alvo já existe
        const targetDoc = await historyRef.doc(correctId).get();
        
        if (targetDoc.exists) {
          console.log(`[AVISO] O documento ${correctId} já existe. Ignorando para evitar sobreposição manual.`);
          ignorados++;
          continue;
        }

        // Criar o novo documento
        // Atualiza os campos data e dataISO internos para ficarem consistentes também
        const [y, m, d] = consensus.date.split('-');
        const dataBR = `${d}/${m}/${y}`;
        
        const newData = {
          ...data,
          data: dataBR,
          dataISO: consensus.date,
          reparadoEm: admin.firestore.FieldValue.serverTimestamp(),
          originalId: currentId
        };

        await historyRef.doc(correctId).set(newData);
        console.log(`[OK] Novo documento criado: ${correctId}`);

        // Deletar o antigo
        await historyRef.doc(currentId).delete();
        console.log(`[OK] Antigo deletado: ${currentId}`);
        
        corrigidos++;
      }
    }
  }

  console.log("------------------------------------------");
  console.log(`REPARO CONCLUÍDO.`);
  console.log(`Total Analisado: ${snapshot.size}`);
  console.log(`Total Corrigido: ${corrigidos}`);
  console.log(`Total Ignorado (Conflitos): ${ignorados}`);
  console.log("------------------------------------------");
}

executarReparo().catch(err => {
  console.error("ERRO FATAL NO REPARO:", err);
  process.exit(1);
});
