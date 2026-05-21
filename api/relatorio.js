import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import config from '../scripts/config.cjs';

const {
  validateTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  isDiaDeTrabalho,
  getConsensusDate,
  getDataDoPlantaoFallback,
  isoToDisplay,
} = config;

// --- FUNÇÃO AUXILIAR: Escape de HTML ---
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

// --- FUNÇÃO AUXILIAR: Verificar Envio Duplicado ---
async function verificarEnvioDuplicado(db, team, dataID, forceExecution) {
  if (forceExecution) {
    console.log(`[Envio] Forçando execução. Ignorando verificação de envio duplicado.`);
    return false;
  }

  const docId = `status_envio_${team}`;
  const docRef = db.collection('controle_envios').doc(docId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const dataUltimoEnvio = docSnap.data().ultimo_envio;
    if (dataUltimoEnvio === dataID) {
      console.log(`>>> [Envio] O relatório da Turma ${team} já foi enviado hoje (${dataID}).`);
      return true;
    }
  }
  return false;
}

// --- FUNÇÃO AUXILIAR: Registrar Envio de Sucesso ---
async function registrarEnvioSucesso(db, team, dataID) {
  const docId = `status_envio_${team}`;
  await db.collection('controle_envios').doc(docId).set({
    ultimo_envio: dataID,
    atualizado_em: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`>>> [Envio] Controle de envio atualizado para ${team} / ${dataID}`);
}

// --- FUNÇÃO AUXILIAR: Geração do Corpo do Relatório ---
async function gerarRelatorio(db, team, empSnapshot, dataExibicao, colRegistrosName, mainShiftLabel, shiftLabel) {
  console.log("[Relatório] Gerando corpo do relatório HTML...");
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
  htmlBody += `<h2>RESUMO GERAL - TURMA ${team} - ${dataExibicao}</h2><hr><ul ${ulStyle}>`;
  htmlBody += `<li><strong>Total de Funcionários:</strong> ${totalFuncionarios}</li>`;
  htmlBody += `<li><strong>Presentes (DSS + Bem/Mal):</strong> ${totalPresentes}</li>`;
  htmlBody += `<li><strong>Pendentes:</strong> ${totalPendentes}</li>`;
  htmlBody += `<li><strong>Ausentes:</strong> ${totalAusentesDeclarados}</li></ul>`;

  // SEÇÃO REGISTROS DSS NO TOPO (CONFORME REORGANIZAÇÃO DO NOVO LAYOUT)
  htmlBody += `<br><h2>REGISTROS DSS (TURNO ${mainShiftLabel})</h2><hr>`;
  if (registros7H.length === 0) { 
    htmlBody += `Nenhum registro de assunto encontrado para ${mainShiftLabel}.`; 
  } else { 
    htmlBody += `<ul ${ulStyle}>`; 
    registros7H.forEach(reg => { 
      const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; 
      htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; 
    }); 
    htmlBody += `</ul>`; 
  }

  if (team !== 'CCG') {
    htmlBody += `<br><h2>REGISTROS DSS (TURNO ${shiftLabel})</h2><hr>`;
    if (registrosSH.length === 0) { 
      htmlBody += `Nenhum registro de assunto encontrado para ${shiftLabel}.`; 
    } else { 
      htmlBody += `<ul ${ulStyle}>`; 
      registrosSH.forEach(reg => { 
        const n = reg.name ? limparTexto(reg.name) : "Nome não informado"; 
        htmlBody += `<li style="margin-bottom: 10px;"><strong>${n}</strong> (Matrícula: ${reg.matricula})<br><span style="font-style: italic; color: #000;">Assunto: ${limparTexto(reg.assunto)}</span></li>`; 
      }); 
      htmlBody += `</ul>`; 
    }
  }

  // EQUIPE TURNO PRINCIPAL
  htmlBody += `<br><h2>EQUIPE TURNO ${mainShiftLabel}</h2><hr>`;
  htmlBody += `<h3>STATUS: "ASS.DSS + ESTOU BEM"</h3>`;
  if (cat_7H_EstouBem.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouBem.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  
  htmlBody += `<h3>STATUS "ESTOU MAL"</h3>`;
  if (cat_7H_EstouMal.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_EstouMal.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  
  htmlBody += `<h3>PENDENTES</h3>`;
  if (cat_7H_Pendentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Pendentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }
  
  htmlBody += `<h3>AUSENTES</h3>`;
  if (cat_7H_Ausentes.length === 0) htmlBody += `Nenhum`; else { htmlBody += `<ul ${ulStyle}>`; cat_7H_Ausentes.forEach(e => { htmlBody += `<li>${limparTexto(e.name)} (Matrícula: ${e.matricula})</li>`; }); htmlBody += `</ul>`; }

  // EQUIPE TURNO SECUNDÁRIO
  if (team !== 'CCG') {
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

// --- ENDPOINT SERVERLESS PRINCIPAL ---
export default async function handler(req, res) {
  // 1. Validar Variáveis de Configuração de E-mail
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const EMAIL_TO = process.env.EMAIL_TO;
  const cronSecretToken = process.env.CRON_SECRET_TOKEN;

  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.error("[Erro de Configuração] Variáveis de e-mail ausentes no ambiente da Vercel.");
    return res.status(500).json({ error: 'Configuração de e-mail inválida no servidor.' });
  }

  // 2. Validar Token de Segurança
  const { team, token, force } = req.query;
  const forceExecution = force === 'true';

  if (!cronSecretToken || token !== cronSecretToken) {
    console.warn(`[Acesso Negado] Token inválido ou não informado.`);
    return res.status(401).json({ error: 'Acesso Não Autorizado. Token inválido.' });
  }

  // 3. Validar a Turma (Team)
  let validatedTeam;
  try {
    validatedTeam = validateTargetTeam(team, true);
  } catch (err) {
    console.error(`[Erro de Parâmetro] ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  // 3.5 Verificar Escala de Trabalho (Folga vs Trabalho)
  const worksToday = isDiaDeTrabalho(validatedTeam);
  if (!worksToday && !forceExecution) {
    console.log(`>>> [SERVERLESS] Execução cancelada. Hoje é dia de FOLGA para a Turma ${validatedTeam} <<<`);
    return res.status(200).json({
      status: 'skipped_offday',
      message: `Hoje é dia de FOLGA (fora do ciclo de trabalho 2x2) para a Turma ${validatedTeam}. Relatório de e-mail não enviado.`
    });
  }

  console.log(`>>> [SERVERLESS] Iniciando Envio de Relatório para a Turma: ${validatedTeam} <<<`);

  try {
    // 4. Inicialização Segura do Firebase Admin
    let app;
    if (admin.apps.length === 0) {
      const serviceAccount = parseServiceAccount(true);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      app = admin.app();
    }
    const db = app.firestore();

    // 5. Verificar se a automação está pausada no banco de dados
    const isPaused = await isAutomacaoPausada(db, validatedTeam);
    if (isPaused) {
      console.log(`>>> [SERVERLESS] Execução cancelada. O envio de e-mails para ${validatedTeam} está PAUSADO no painel.`);
      return res.status(200).json({
        status: 'cancelled',
        message: `O envio de relatórios (e-mail) para a Turma ${validatedTeam} está PAUSADO no painel administrativo.`
      });
    }

    const { employees: colEmployeesName, registros: colRegistrosName } = getCollections(validatedTeam);

    // 6. Ler funcionários
    const empSnapshot = await db.collection(colEmployeesName).get();
    if (empSnapshot.empty) {
      console.log(`[Relatório] Nenhum funcionário encontrado em "${colEmployeesName}". Abortando.`);
      return res.status(200).json({
        status: 'no_data',
        message: `Nenhum funcionário cadastrado na coleção "${colEmployeesName}". Relatório não enviado.`
      });
    }

    // 7. Calcular Data por Consenso ou Fallback
    const funcionariosData = [];
    empSnapshot.forEach(doc => funcionariosData.push(doc.data()));
    
    const consensusISO = getConsensusDate(funcionariosData);
    const dataID = consensusISO || getDataDoPlantaoFallback('ISO');
    const dataExibicao = consensusISO ? isoToDisplay(consensusISO) : getDataDoPlantaoFallback('DD/MM/YY');

    console.log(`[Relatório] Data identificada: ${dataExibicao} (ID: ${dataID})`);

    // 8. Verificar Envio Duplicado
    const jaEnviado = await verificarEnvioDuplicado(db, validatedTeam, dataID, forceExecution);
    if (jaEnviado) {
      console.log(`>>> [SERVERLESS] Processo abortado: O relatório já foi enviado hoje (${dataID}). <<<`);
      return res.status(200).json({
        status: 'already_sent',
        message: `O relatório para a Turma ${validatedTeam} no plantão do dia ${dataExibicao} já foi enviado anteriormente hoje.`
      });
    }

    // 9. Configurar Rótulos Dinâmicos de Turnos
    const shiftLabel = (validatedTeam === 'C' || validatedTeam === 'D') ? '18H' : '6H';
    const mainShiftLabel = (validatedTeam === 'C' || validatedTeam === 'D') ? '19H' : '7H';

    // 10. Gerar HTML e Disparar E-mail
    const htmlRelatorio = await gerarRelatorio(db, validatedTeam, empSnapshot, dataExibicao, colRegistrosName, mainShiftLabel, shiftLabel);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    const subject = `Relatório DSS - TURMA ${validatedTeam} (${dataExibicao})`;
    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_TO,
      subject,
      html: htmlRelatorio
    };

    console.log(`[Relatório] Enviando e-mail de ${EMAIL_USER} para ${EMAIL_TO}...`);
    await transporter.sendMail(mailOptions);
    console.log("[Relatório] E-mail enviado com absoluto sucesso!");

    // 11. Registrar Envio no Controle para Evitar Duplicidade
    await registrarEnvioSucesso(db, validatedTeam, dataID);

    return res.status(200).json({
      status: 'success',
      message: `Relatório da Turma ${validatedTeam} para o plantão ${dataExibicao} enviado com sucesso!`
    });

  } catch (error) {
    console.error('[SERVERLESS ERRO FATAL]', error);
    return res.status(500).json({
      error: 'Erro interno ao gerar ou enviar o relatório de e-mail.',
      details: error.message
    });
  }
}
