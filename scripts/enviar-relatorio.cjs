const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// --- 1. CONFIGURAÇÕES ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

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

// --- 2. FUNÇÃO DE LER OS DADOS ---
async function gerarRelatorio() {
  console.log("Iniciando geração do relatório...");
  
  // Arrays para listas de presença
  const cat_7H_EstouBem = [], cat_7H_EstouMal = [], cat_7H_Ausentes = [];
  const cat_6H_EstouBem = [], cat_6H_EstouMal = [], cat_6H_Ausentes = [];
  
  // Arrays para os registros DSS
  const registros7H = [];
  const registros6H = [];
  
  // MAPA DE NOMES
  const mapaNomes = {}; 

  let totalFuncionarios = 0;

  // A) Ler dados da 'turma b' (Funcionários)
  try {
    const empRef = db.collection('turma b');
    const empSnapshot = await empRef.get();
    totalFuncionarios = empSnapshot.size;
    
    empSnapshot.forEach(doc => {
      const emp = doc.data();
      emp.docId = doc.id; // Guarda o ID para rastreio de erros
      
      // 1. Guardar nome no mapa (Matrícula -> Nome)
      if (emp.matricula && emp.name) {
        mapaNomes[emp.matricula] = limparTexto(emp.name);
      }

      // 2. Classificar nas listas de presença
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
    console.error("Erro ao ler 'turma b':", error);
    return "<h1>Erro ao ler o banco de dados 'turma b'.</h1>";
  }

  // B) Ler dados de 'administrators'
  try {
    const adminRef = db.collection('administrators');
    const adminSnapshot = await adminRef.get();
    adminSnapshot.forEach(doc => {
      const adm = doc.data();
      if (adm.matricula && adm.name) {
        mapaNomes[adm.matricula] = limparTexto(adm.name);
      }
    });
  } catch (error) {
    console.error("Erro ao ler 'administrators':", error);
  }

  // C) Ler dados dos 'registrosDSS'
  try {
    const regRef = db.collection('registrosDSS');
    const regSnapshot = await regRef.get();
    regSnapshot.forEach(doc => {
      const reg = doc.data();
      if (reg.TURNO === "6H") registros6H.push(reg);
      else registros7H.push(reg);
    });
  } catch (error) {
    console.error("Erro ao ler 'registrosDSS':", error);
  }

  // --- FUNÇÃO AUXILIAR PARA FORMATAR LINHA ---
  function formatarLinhaFuncionario(emp) {
    const nome = emp.name ? limparTexto(emp.name) : `<strong style="color:red;">NOME VAZIO (ID: ${emp.docId})</strong>`;
    const matricula = emp.matricula ? emp.matricula : `<strong style="color:red;">MATRÍCULA VAZIA (ID: ${emp.docId})</strong>`;
    return `<li>${nome} (Matrícula: ${matricula})</li>`;
  }

  // --- 3. MONTAR O CORPO DO E-MAIL ---
  // AQUI É O AJUSTE VISUAL: padding-left: 20px em todas as listas <ul>
  let htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">`;
  const totalPresentes = cat_7H_EstouBem.length + cat_7H_EstouMal.length + cat_6H_EstouBem.length + cat_6H_EstouMal.length;
  const totalAusentes = cat_7H_Ausentes.length + cat_6H_Ausentes.length;
  
  htmlBody += `<h2>RESUMO GERAL</h2>`;
  htmlBody += `<hr>`;
  htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
  htmlBody += `<li><strong>Total de Funcionários (Turma B):</strong> ${totalFuncionarios}</li>`;
  htmlBody += `<li><strong>Presentes (DSS + Bem/Mal):</strong> ${totalPresentes}</li>`;
  htmlBody += `<li><strong>Pendentes / Ausentes:</strong> ${totalAusentes}</li>`;
  htmlBody += `</ul>`;

  // --- EQUIPE TURNO 7H ---
  htmlBody += `<h2>EQUIPE TURNO 7H</h2>`;
  htmlBody += `<hr>`;
  
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_7H_EstouBem.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_7H_EstouBem.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }
  
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_7H_EstouMal.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_7H_EstouMal.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }

  htmlBody += `<h3>PENDENTES / AUSENTES</h3>`;
  if (cat_7H_Ausentes.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_7H_Ausentes.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }

  // --- EQUIPE TURNO 6H ---
  htmlBody += `<br><h2>EQUIPE TURNO 6H</h2>`;
  htmlBody += `<hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_6H_EstouBem.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_6H_EstouBem.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }
  
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_6H_EstouMal.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_6H_EstouMal.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }

  htmlBody += `<h3>PENDENTES / AUSENTES</h3>`;
  if (cat_6H_Ausentes.length === 0) htmlBody += `Nenhum`;
  else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    cat_6H_Ausentes.forEach(emp => { htmlBody += formatarLinhaFuncionario(emp); });
    htmlBody += `</ul>`;
  }
  
  // --- REGISTROS DE ASSUNTO DSS ---
  htmlBody += `<br><h2>REGISTROS DSS (TURNO 7H)</h2>`;
  htmlBody += `<hr>`;
  if (registros7H.length === 0) {
    htmlBody += `Nenhum registro de assunto encontrado para 7H.`;
  } else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    registros7H.forEach(reg => {
      const nomeFunc = mapaNomes[reg.matricula] || "Nome não encontrado (Verifique cadastro)";
      htmlBody += `<li><strong>${nomeFunc}</strong> (Matrícula: ${reg.matricula})<br><em>Assunto: ${limparTexto(reg.assunto)}</em></li>`;
    });
    htmlBody += `</ul>`;
  }

  htmlBody += `<br><h2>REGISTROS DSS (TURNO 6H)</h2>`;
  htmlBody += `<hr>`;
  if (registros6H.length === 0) {
    htmlBody += `Nenhum registro de assunto encontrado para 6H.`;
  } else {
    htmlBody += `<ul style="padding-left: 20px;">`; // <--- AQUI
    registros6H.forEach(reg => {
      const nomeFunc = mapaNomes[reg.matricula] || "Nome não encontrado (Verifique cadastro)";
      htmlBody += `<li><strong>${nomeFunc}</strong> (Matrícula: ${reg.matricula})<br><em>Assunto: ${limparTexto(reg.assunto)}</em></li>`;
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
  const novoAssunto = `Relatório DSS - TURMA B (${dataDeHoje})`;

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

// --- 5. FUNÇÃO PRINCIPAL ---
async function main() {
  console.log("Iniciando script de relatório...");
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
