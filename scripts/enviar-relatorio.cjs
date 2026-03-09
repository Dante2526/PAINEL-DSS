// scripts/enviar-relatorio.cjs
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// --- 1. CONFIGURAÇÕES ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
const TARGET_TEAM = process.env.TARGET_TEAM;
const GITHUB_EVENT_NAME = process.env.GITHUB_EVENT_NAME || 'manual';

// Validação de segurança
if (!TARGET_TEAM || (TARGET_TEAM !== 'A' && TARGET_TEAM !== 'B' && TARGET_TEAM !== 'C' && TARGET_TEAM !== 'D' && TARGET_TEAM !== 'CCG')) {
  console.error("ERRO: TARGET_TEAM não definido corretamente (A, B, C, D ou CCG).");
  process.exit(1);
}

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

console.log(`>>> GERANDO RELATÓRIO PARA A TURMA: ${TARGET_TEAM} <<<`);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

function limparTexto(texto) {
  if (!texto) return '';
  return texto.replace(/\s+/g, ' ').trim();
}

// --- GERAÇÃO DA DATA VIRTUAL ---
// Subtrai 6 horas do relógio para garantir que a madrugada pertença ao dia anterior
function getDataDoPlantao() {
  const dataVirtual = new Date(new Date().getTime() - (6 * 60 * 60 * 1000));
  return dataVirtual.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// --- FUNÇÃO PARA VERIFICAR SE JÁ FOI ENVIADO HOJE ---
async function verificarEnvioDuplicado() {
  const dataPlantao = getDataDoPlantao();
  const docId = `status_envio_${TARGET_TEAM}`;
  const docRef = db.collection('controle_envios').doc(docId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const dataUltimoEnvio = docSnap.data().ultimo_envio;
    if (dataUltimoEnvio === dataPlantao && GITHUB_EVENT_NAME === 'schedule') {
      console.log(`>>> AVISO: O relatório da Turma ${TARGET_TEAM} já foi enviado hoje (${dataPlantao}).`);
      return true;
    }
  }
  return false;
}

// --- FUNÇÃO PARA REGISTRAR QUE FOI ENVIADO ---
async function registrarEnvioSucesso() {
  const dataPlantao = getDataDoPlantao();
  const docId = `status_envio_${TARGET_TEAM}`;
  await db.collection('controle_envios').doc(docId).set({
    ultimo_envio: dataPlantao,
    atualizado_em: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`>>> Controle de envio atualizado: Turma ${TARGET_TEAM} / ${dataPlantao}`);
}

// --- 2. LER DADOS (Resumido para o relatorio) ---
async function gerarRelatorio() {
  console.log("Iniciando geração do relatório...");
  const cat_7H_EstouBem = [], cat_7H_EstouMal = [], cat_7H_Ausentes = [], cat_7H_Pendentes = [];
  const cat_6H_EstouBem = [], cat_6H_EstouMal = [], cat_6H_Ausentes = [], cat_6H_Pendentes = [];
  const registros7H = [], registros6H = [];
  let totalFuncionarios = 0;

  try {
    const empRef = db.collection(colEmployeesName);
    const empSnapshot = await empRef.get();
    totalFuncionarios = empSnapshot.size;

    empSnapshot.forEach(doc => {
      const emp = doc.data();
      if (emp.absent === true || emp.ausente === true) {
        if (emp.turno === "6H") cat_6H_Ausentes.push(emp);
        else cat_7H_Ausentes.push(emp);
      } else if (emp.mal === true) {
        if (emp.turno === "6H") cat_6H_EstouMal.push(emp);
        else cat_7H_EstouMal.push(emp);
      } else if (emp.assDss === true && emp.bem === true) {
        if (emp.turno === "6H") cat_6H_EstouBem.push(emp);
        else cat_7H_EstouBem.push(emp);
      } else {
        if (emp.turno === "6H") cat_6H_Pendentes.push(emp);
        else cat_7H_Pendentes.push(emp);
      }
    });
  } catch (error) { return `<h1>Erro.</h1>`; }

  try {
    const regRef = db.collection(colRegistrosName);
    const regSnapshot = await regRef.get();
    regSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.TURNO === "6H") registros6H.push(reg);
      else registros7H.push(reg);
    });
  } catch (error) { }

  const ulStyle = 'style="padding-left: 20px; margin-top: 5px; margin-bottom: 10px;"';
  let htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; text-align: left;">`;

  const totalPresentes = cat_7H_EstouBem.length + cat_7H_EstouMal.length + cat_6H_EstouBem.length + cat_6H_EstouMal.length;
  const totalAusentesDeclarados = cat_7H_Ausentes.length + cat_6H_Ausentes.length;
  const totalPendentes = cat_7H_Pendentes.length + cat_6H_Pendentes.length;

  htmlBody += `<h2>RESUMO GERAL - TURMA ${TARGET_TEAM}</h2><hr><ul ${ulStyle}>`;
  htmlBody += `<li><strong>Total de Funcionários:</strong> ${totalFuncionarios}</li>`;
  htmlBody += `<li><strong>Presentes (DSS + Bem/Mal):</strong> ${totalPresentes}</li>`;
  htmlBody += `<li><strong>Pendentes:</strong> ${totalPendentes}</li>`;
  htmlBody += `<li><strong>Ausentes:</strong> ${totalAusentesDeclarados}</li></ul>`;

  // EQUIPE TURNO 7H
  htmlBody += `<h2>EQUIPE TURNO 7H</h2><hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_7H_EstouBem.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouBem.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_7H_EstouMal.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouMal.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>PENDENTES</h3>`;
  if (cat_7H_Pendentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Pendentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>AUSENTES</h3>`;
  if (cat_7H_Ausentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Ausentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }

  // EQUIPE TURNO 6H
  htmlBody += `<br><h2>EQUIPE TURNO 6H</h2><hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_6H_EstouBem.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_6H_EstouBem.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_6H_EstouMal.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_6H_EstouMal.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>PENDENTES</h3>`;
  if (cat_6H_Pendentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_6H_Pendentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  htmlBody += `<h3>AUSENTES</h3>`;
  if (cat_6H_Ausentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_6H_Ausentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }

  // REGISTROS DSS
  htmlBody += `<br><h2>REGISTROS DSS (TURNO 7H)</h2><hr>`;
  if (registros7H.length === 0) { htmlBody += `Nenhum registro de assunto encontrado para 7H.`; } else { htmlBody += `<ul ${ulStyle}>`; registros7H.forEach(reg => { const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; }); htmlBody += `</ul>`; }

  htmlBody += `<br><h2>REGISTROS DSS (TURNO 6H)</h2><hr>`;
  if (registros6H.length === 0) { htmlBody += `Nenhum registro de assunto encontrado para 6H.`; } else { htmlBody += `<ul ${ulStyle}>`; registros6H.forEach(reg => { const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; }); htmlBody += `</ul>`; }

  htmlBody += `</div>`;
  return htmlBody;
}

// --- 4. FUNÇÃO DE ENVIAR O E-MAIL ---
async function enviarEmail(htmlRelatorio) {
  console.log(`Enviando e-mail para ${EMAIL_TO}...`);
  const dataPlantao = getDataDoPlantao();

  // --- ASSUNTO DO EMAIL CORRIGIDO (Removido o "Plantão") ---
  const novoAssunto = `Relatório DSS - TURMA ${TARGET_TEAM} (${dataPlantao})`;

  const mailOptions = { from: EMAIL_USER, to: EMAIL_TO, subject: novoAssunto, html: htmlRelatorio };
  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso!");
    await registrarEnvioSucesso();
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    process.exit(1);
  }
}

// --- 5. FUNÇÃO PRINCIPAL ---
async function main() {
  console.log(`Iniciando script de relatório para TURMA ${TARGET_TEAM}...`);
  try {
    const jaEnviado = await verificarEnvioDuplicado();
    if (jaEnviado) {
      console.log("Processo abortado com sucesso.");
      process.exit(0);
    }
    const htmlRelatorio = await gerarRelatorio();
    await enviarEmail(htmlRelatorio);
    console.log("Script de relatório concluído.");
  } catch (error) {
    console.error('ERRO GERAL NO SCRIPT DE RELATÓRIO:', error);
    process.exit(1);
  }
}

main();
