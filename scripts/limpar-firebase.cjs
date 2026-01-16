// scripts/enviar-relatorio.cjs
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// --- 1. CONFIGURAÇÕES ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
const TARGET_TEAM = process.env.TARGET_TEAM;
// 'A', 'B' ou 'C'

// Validação de segurança
if (!TARGET_TEAM || (TARGET_TEAM !== 'A' && TARGET_TEAM !== 'B' && TARGET_TEAM !== 'C')) {
  console.error("ERRO: TARGET_TEAM não definido corretamente (A, B ou C).");
  process.exit(1);
}

// Definição das coleções baseado na Turma
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
}

console.log(`>>> GERANDO RELATÓRIO PARA A TURMA: ${TARGET_TEAM} <<<`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// --- FUNÇÃO DE LIMPEZA DE TEXTO ---
function limparTexto(texto) {
  if (!texto) return '';
  return texto.replace(/\s+/g, ' ').trim();
}

// --- 2. FUNÇÃO DE LER OS DADOS (O Relatório) ---
async function gerarRelatorio() {
  console.log("Iniciando geração do relatório...");
  // Arrays para funcionários
  const cat_7H_EstouBem = [], cat_7H_EstouMal = [], cat_7H_Ausentes = [];
  const cat_6H_EstouBem = [], cat_6H_EstouMal = [], cat_6H_Ausentes = [];
  // Arrays para os registros DSS
  const registros7H = [];
  const registros6H = [];
  
  let totalFuncionarios = 0;
  // A) Ler dados dos 'employees' (agora turma a, b ou c)
  try {
    const empRef = db.collection(colEmployeesName);
    const empSnapshot = await empRef.get();
    totalFuncionarios = empSnapshot.size;
    
    empSnapshot.forEach(doc => {
      const emp = doc.data();

      // Lógica de separação por status
      if (emp.mal === true) {
        if (emp.turno === "6H") cat_6H_EstouMal.push(emp);
        else cat_7H_EstouMal.push(emp);
      } else if (emp.assDss === true && emp.bem === true) {
        if (emp.turno === "6H") cat_6H_EstouBem.push(emp);
        else cat_7H_EstouBem.push(emp);
  
      } else {
        if (emp.turno === "6H") cat_6H_Ausentes.push(emp);
        else cat_7H_Ausentes.push(emp);
      }
    });
  } catch (error) {
    console.error(`Erro ao ler '${colEmployeesName}':`, error);
    return `<h1>Erro ao ler o banco de dados '${colEmployeesName}'.</h1>`;
  }

  // B) Ler dados dos 'registrosDSS' (A, B ou C)
  try {
    const regRef = db.collection(colRegistrosName);
    const regSnapshot = await regRef.get();
    
    regSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.TURNO === "6H") registros6H.push(reg);
      else registros7H.push(reg);
    });
  } catch (error) {
    console.error(`Erro ao ler '${colRegistrosName}':`, error);
  }

  // --- 3. MONTAR O CORPO DO E-MAIL ---
  // Estilo padrão para listas (Alinhamento à esquerda, puxando o ponto para baixo do texto do título)
  const ulStyle = 'style="padding-left: 20px; margin-top: 5px; margin-bottom: 10px;"';

  let htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; text-align: left;">`;
  
  const totalPresentes = cat_7H_EstouBem.length + cat_7H_EstouMal.length + cat_6H_EstouBem.length + cat_6H_EstouMal.length;
  const totalAusentes = cat_7H_Ausentes.length + cat_6H_Ausentes.length;
  
  htmlBody += `<h2>RESUMO GERAL - TURMA ${TARGET_TEAM}</h2>`;
  htmlBody += `<hr>`;
  htmlBody += `<ul ${ulStyle}>`;
  htmlBody += `<li><strong>Total de Funcionários:</strong> ${totalFuncionarios}</li>`;
  htmlBody += `<li><strong>Presentes (DSS + Bem/Mal):</strong> ${totalPresentes}</li>`;
  htmlBody += `<li><strong>Pendentes / Ausentes:</strong> ${totalAusentes}</li>`;
  htmlBody += `</ul>`;
  
  // --- EQUIPE TURNO 7H ---
  htmlBody += `<h2>EQUIPE TURNO 7H</h2>`;
  htmlBody += `<hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_7H_EstouBem.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_7H_EstouBem.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }
  
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_7H_EstouMal.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_7H_EstouMal.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }

  htmlBody += `<h3>PENDENTES / AUSENTES</h3>`;
  if (cat_7H_Ausentes.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_7H_Ausentes.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }

  // --- EQUIPE TURNO 6H ---
  htmlBody += `<br><h2>EQUIPE TURNO 6H</h2>`;
  htmlBody += `<hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_6H_EstouBem.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_6H_EstouBem.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }
  
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_6H_EstouMal.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_6H_EstouMal.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }

  htmlBody += `<h3>PENDENTES / AUSENTES</h3>`;
  if (cat_6H_Ausentes.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul ${ulStyle}>`;
    cat_6H_Ausentes.forEach(emp => { htmlBody += `<li>${limparTexto(emp.name)} (Matrícula: ${emp.matricula})</li>`; });
    htmlBody += `</ul>`;
  }
  
  // --- REGISTROS DE ASSUNTO DSS (SEPARADOS) ---
  
  htmlBody += `<br><h2>REGISTROS DSS (TURNO 7H)</h2>`;
  htmlBody += `<hr>`;
  if (registros7H.length === 0) {
    htmlBody += `Nenhum registro de assunto encontrado para 7H.`;
  } else {
    htmlBody += `<ul ${ulStyle}>`;
    registros7H.forEach(reg => {
      const nomeFunc = reg.name ? limparTexto(reg.name) : "Nome não informado";
      htmlBody += `<li style="margin-bottom: 10px;">
        <strong>${nomeFunc}</strong> (Matrícula: ${reg.matricula})<br>
        <span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span>
      </li>`;
    });
    htmlBody += `</ul>`;
  }

  htmlBody += `<br><h2>REGISTROS DSS (TURNO 6H)</h2>`;
  htmlBody += `<hr>`;
  if (registros6H.length === 0) {
    htmlBody += `Nenhum registro de assunto encontrado para 6H.`;
  } else {
    htmlBody += `<ul ${ulStyle}>`;
    registros6H.forEach(reg => {
      const nomeFunc = reg.name ? limparTexto(reg.name) : "Nome não informado";
      htmlBody += `<li style="margin-bottom: 10px;">
        <strong>${nomeFunc}</strong> (Matrícula: ${reg.matricula})<br>
        <span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span>
      </li>`;
    });
    htmlBody += `</ul>`;
  }

  htmlBody += `</div>`;
  return htmlBody;
}

// --- 4. FUNÇÃO DE ENVIAR O E-MAIL ---
async function enviarEmail(htmlRelatorio) {
  console.log(`Enviando e-mail para ${EMAIL_TO}...`);
  const dataDeHoje = new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  // Assunto dinâmico (TURMA A, B ou C)
  const novoAssunto = `Relatório DSS - TURMA ${TARGET_TEAM} (${dataDeHoje})`;
  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_TO,
    subject: novoAssunto, 
    html: htmlRelatorio,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    process.exit(1);
  }
}

// --- 5. FUNÇÃO PRINCIPAL (Ler e Enviar) ---
async function main() {
  console.log(`Iniciando script de relatório para TURMA ${TARGET_TEAM}...`);
  try {
    const htmlRelatorio = await gerarRelatorio();
    await enviarEmail(htmlRelatorio);
    console.log("Script de relatório concluído.");
  } catch (error) {
    console.error('ERRO GERAL NO SCRIPT DE RELATÓRIO:', error);
    process.exit(1);
  }
}

main();