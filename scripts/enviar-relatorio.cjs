// scripts/enviar-relatorio.cjs
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const {
  getTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  getConsensusDate,
  getDataDoPlantaoFallback,
  isoToDisplay,
} = require('./config.cjs');

// --- 1. CONFIGURAÇÕES ---
const serviceAccount = parseServiceAccount();
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
const TARGET_TEAM = getTargetTeam();
const GITHUB_EVENT_NAME = process.env.GITHUB_EVENT_NAME || 'manual';

// Validação de variáveis de e-mail
if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
  console.error("ERRO CRÍTICO: Variáveis de e-mail ausentes (EMAIL_USER, EMAIL_PASS ou EMAIL_TO).");
  process.exit(1);
}

const { employees: colEmployeesName, registros: colRegistrosName } = getCollections(TARGET_TEAM);

console.log(`>>> GERANDO RELATÓRIO PARA A TURMA: ${TARGET_TEAM} <<<`);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

const shiftLabel = (TARGET_TEAM === 'C' || TARGET_TEAM === 'D') ? '18H' : '6H';
const mainShiftLabel = (TARGET_TEAM === 'C' || TARGET_TEAM === 'D') ? '19H' : '7H';

function limparTexto(texto) {
  if (!texto) return '';
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return limpo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- FUNÇÃO PARA VERIFICAR SE JÁ FOI ENVIADO HOJE ---
async function verificarEnvioDuplicado(dataID) {
  const docId = `status_envio_${TARGET_TEAM}`;
  const docRef = db.collection('controle_envios').doc(docId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const dataUltimoEnvio = docSnap.data().ultimo_envio;
    // dataID é YYYY-MM-DD
    if (dataUltimoEnvio === dataID && GITHUB_EVENT_NAME === 'schedule') {
      console.log(`>>> AVISO: O relatório da Turma ${TARGET_TEAM} já foi enviado hoje (${dataID}).`);
      return true;
    }
  }
  return false;
}

// --- FUNÇÃO PARA REGISTRAR QUE FOI ENVIADO ---
async function registrarEnvioSucesso(dataID) {
  const docId = `status_envio_${TARGET_TEAM}`;
  await db.collection('controle_envios').doc(docId).set({
    ultimo_envio: dataID,
    atualizado_em: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`>>> Controle de envio atualizado: Turma ${TARGET_TEAM} / ${dataID}`);
}

// --- 2. LER DADOS ---
async function gerarRelatorio(empSnapshot, dataExibicao) {
  console.log("Iniciando geração do corpo do relatório...");
  const cat_7H_EstouBem = [], cat_7H_EstouMal = [], cat_7H_Ausentes = [], cat_7H_Pendentes = [];
  const cat_SH_EstouBem = [], cat_SH_EstouMal = [], cat_SH_Ausentes = [], cat_SH_Pendentes = [];
  const registros7H = [], registrosSH = [];
  const totalFuncionarios = empSnapshot.size;

  empSnapshot.forEach(doc => {
    const emp = doc.data();
    if (emp.absent === true || emp.ausente === true) {
      if (emp.turno === "6H") cat_SH_Ausentes.push(emp);
      else cat_7H_Ausentes.push(emp);
    } else if (emp.mal === true) {
      if (emp.turno === "6H") cat_SH_EstouMal.push(emp);
      else cat_7H_EstouMal.push(emp);
    } else if (emp.assDss === true && emp.bem === true) {
      if (emp.turno === "6H") cat_SH_EstouBem.push(emp);
      else cat_7H_EstouBem.push(emp);
    } else {
      if (emp.turno === "6H") cat_SH_Pendentes.push(emp);
      else cat_7H_Pendentes.push(emp);
    }
  });

  try {
    const regRef = db.collection(colRegistrosName);
    const regSnapshot = await regRef.get();
    regSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.TURNO === "6H") registrosSH.push(reg);
      else registros7H.push(reg);
    });
  } catch (error) {
    console.error("[AVISO] Falha ao ler registros DSS:", error.message);
  }

  const ulStyle = 'style="padding-left: 20px; margin-top: 5px; margin-bottom: 10px;"';
  let htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; text-align: left;">`;

  const totalPresentes = cat_7H_EstouBem.length + cat_7H_EstouMal.length + cat_SH_EstouBem.length + cat_SH_EstouMal.length;
  const totalAusentesDeclarados = cat_7H_Ausentes.length + cat_SH_Ausentes.length;
  const totalPendentes = cat_7H_Pendentes.length + cat_SH_Pendentes.length;

  // CABEÇALHO COM DATA
  htmlBody += `<h2>RESUMO GERAL - TURMA ${TARGET_TEAM} - ${dataExibicao}</h2><hr><ul ${ulStyle}>`;
  htmlBody += `<li><strong>Total de Funcionários:</strong> ${totalFuncionarios}</li>`;
  htmlBody += `<li><strong>Presentes (DSS + Bem/Mal):</strong> ${totalPresentes}</li>`;
  htmlBody += `<li><strong>Pendentes:</strong> ${totalPendentes}</li>`;
  htmlBody += `<li><strong>Ausentes:</strong> ${totalAusentesDeclarados}</li></ul>`;

  htmlBody += `<br><h2>REGISTROS DSS (TURNO ${mainShiftLabel})</h2><hr>`;
  if (registros7H.length === 0) { htmlBody += `Nenhum registro de assunto encontrado para ${mainShiftLabel}.`; } else { htmlBody += `<ul ${ulStyle}>`; registros7H.forEach(reg => { const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; }); htmlBody += `</ul>`; }

  if (TARGET_TEAM !== 'CCG') {
    htmlBody += `<br><h2>REGISTROS DSS (TURNO ${shiftLabel})</h2><hr>`;
    if (registrosSH.length === 0) { htmlBody += `Nenhum registro de assunto encontrado para ${shiftLabel}.`; } else { htmlBody += `<ul ${ulStyle}>`; registrosSH.forEach(reg => { const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; }); htmlBody += `</ul>`; }
  }

  // EQUIPE TURNO 7H
  htmlBody += `<br><h2>EQUIPE TURNO ${mainShiftLabel}</h2><hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_7H_EstouBem.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouBem.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_7H_EstouMal.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouMal.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>PENDENTES</h3>`;
  if (cat_7H_Pendentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Pendentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>AUSENTES</h3>`;
  if (cat_7H_Ausentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Ausentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }

  if (TARGET_TEAM !== 'CCG') {
    htmlBody += `<br><h2>EQUIPE TURNO ${shiftLabel}</h2><hr>`;
    htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
    if (cat_SH_EstouBem.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_SH_EstouBem.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
    htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
    if (cat_SH_EstouMal.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_SH_EstouMal.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
    htmlBody += `<h3>PENDENTES</h3>`;
    if (cat_SH_Pendentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_SH_Pendentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
    htmlBody += `<h3>AUSENTES</h3>`;
    if (cat_SH_Ausentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_SH_Ausentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  }

  htmlBody += `</div>`;
  return htmlBody;
}

// --- 4. FUNÇÃO DE ENVIAR O E-MAIL ---
async function enviarEmail(htmlRelatorio, dataExibicao, dataID) {
  console.log(`Enviando e-mail para ${EMAIL_TO}...`);
  const subject = `Relatório DSS - TURMA ${TARGET_TEAM} (${dataExibicao})`;
  const mailOptions = { from: EMAIL_USER, to: EMAIL_TO, subject, html: htmlRelatorio };
  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso!");
    await registrarEnvioSucesso(dataID);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    process.exit(1);
  }
}

// --- 5. FUNÇÃO PRINCIPAL ---
async function main() {
  console.log(`Iniciando script de relatório para TURMA ${TARGET_TEAM}...`);
  try {
    const isPaused = await isAutomacaoPausada(db, TARGET_TEAM);
    if (isPaused) {
      console.log(`>>> Ação Cancelada. O envio de e-mails da Turma ${TARGET_TEAM} está PAUSADO pelo painel administrativo.`);
      process.exit(0);
    }

    const empSnapshot = await db.collection(colEmployeesName).get();
    if (empSnapshot.empty) {
      console.log("Nenhum funcionário encontrado. Abortando relatório.");
      process.exit(0);
    }

    // Calcular Data Inteligente
    const funcionariosData = [];
    empSnapshot.forEach(doc => funcionariosData.push(doc.data()));
    
    const consensusISO = getConsensusDate(funcionariosData);
    const dataID = consensusISO || getDataDoPlantaoFallback('ISO');
    const dataExibicao = consensusISO ? isoToDisplay(consensusISO) : getDataDoPlantaoFallback('DD/MM/YY');

    console.log(`Data Identificada: ${dataExibicao} (ID: ${dataID})`);

    const jaEnviado = await verificarEnvioDuplicado(dataID);
    if (jaEnviado) {
      console.log("Processo abortado: Relatório já enviado hoje.");
      process.exit(0);
    }

    const htmlRelatorio = await gerarRelatorio(empSnapshot, dataExibicao);
    await enviarEmail(htmlRelatorio, dataExibicao, dataID);
    console.log("Script de relatório concluído.");
  } catch (error) {
    console.error('ERRO GERAL NO SCRIPT DE RELATÓRIO:', error);
    process.exit(1);
  }
}

main();
