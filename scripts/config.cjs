// scripts/config.cjs
// Configuração compartilhada entre limpar-firebase.cjs e enviar-relatorio.cjs

const TURMAS = {
  A:   { employees: 'turma a',    registros: 'registrosDSS A' },
  B:   { employees: 'turma b',    registros: 'registrosDSS B' },
  C:   { employees: 'turma c',    registros: 'registrosDSS C' },
  D:   { employees: 'turma d',    registros: 'registrosDSS D' },
  CCG: { employees: 'turma c cg', registros: 'registrosDSS C CG' },
};

const TURMAS_VALIDAS = Object.keys(TURMAS);

// Datas âncora para cálculo da escala 2x2 (Trabalho/Folga)
const ANCHOR_DATES = {
  A:   "2026-01-08",
  B:   "2025-11-07",
  C:   "2026-01-16",
  D:   "2026-01-26",
  CCG: "2026-01-16" // CCG compartilha a escala da Turma C
};

/**
 * Valida o TARGET_TEAM de forma flexível (com opção de lançar erro).
 */
function validateTargetTeam(team, throwError = false) {
  if (!team || !TURMAS_VALIDAS.includes(team)) {
    const msg = `ERRO CRÍTICO: TARGET_TEAM inválido ou não informado ("${team}"). Esperado: ${TURMAS_VALIDAS.join(', ')}.`;
    if (throwError) throw new Error(msg);
    console.error(msg);
    process.exit(1);
  }
  return team;
}

/**
 * Valida e retorna o TARGET_TEAM da variável de ambiente (legado CLI).
 */
function getTargetTeam() {
  return validateTargetTeam(process.env.TARGET_TEAM);
}

/**
 * Retorna os nomes das coleções do Firestore para a turma especificada.
 */
function getCollections(team) {
  return TURMAS[team];
}

/**
 * Inicializa o Firebase Admin com proteção contra JSON inválido (com opção de lançar erro).
 */
function parseServiceAccount(throwError = false) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    const msg = "ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON está vazio ou ausente.";
    if (throwError) throw new Error(msg);
    console.error(msg);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const msg = `ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON contém JSON inválido: ${e.message}`;
    if (throwError) throw new Error(msg);
    console.error(msg);
    process.exit(1);
  }
}

/**
 * Verifica se a automação está pausada no painel administrativo.
 * Checa tanto a chave exata (ex: CCG) quanto a variação "C CG".
 */
async function isAutomacaoPausada(db, team) {
  const sysRef = await db.collection('configuracoes').doc('automacao').get();
  if (!sysRef.exists) return false;

  const data = sysRef.data();
  return data[team] === true || (team === 'CCG' && data['C CG'] === true);
}

/**
 * Lógica de consenso de data a partir de timestamps dos funcionários.
 * Retorna ISO (YYYY-MM-DD) se >= 5 assinaturas na mesma data, ou null.
 */
function getConsensusDate(funcionarios) {
  const counts = {};

  funcionarios.forEach(f => {
    const timestamp = f.time || f.t;
    if (!timestamp) return;

    let dateObj = null;
    if (typeof timestamp.toDate === 'function') dateObj = timestamp.toDate();
    else if (timestamp instanceof Date) dateObj = timestamp;
    else if (timestamp.seconds) dateObj = new Date(timestamp.seconds * 1000);
    else dateObj = new Date(timestamp);

    if (dateObj && !isNaN(dateObj.getTime())) {
      const options = { timeZone: 'America/Sao_Paulo' };
      const y = dateObj.toLocaleString('pt-BR', { ...options, year: 'numeric' });
      const m = dateObj.toLocaleString('pt-BR', { ...options, month: '2-digit' });
      const d = dateObj.toLocaleString('pt-BR', { ...options, day: '2-digit' });
      const iso = `${y}-${m}-${d}`;
      counts[iso] = (counts[iso] || 0) + 1;
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

  if (topDate && maxCount >= 5) {
    console.log(`[Consenso] Data identificada por assinaturas: ${topDate} (${maxCount} funcionários)`);
    return topDate;
  }

  return null;
}

/**
 * Data virtual (fallback) — subtrai 6h para que a madrugada pertença ao dia anterior.
 * @param {string} format - 'ISO' para YYYY-MM-DD, 'DD/MM/YY' ou 'DD/MM/YYYY'
 */
function getDataDoPlantaoFallback(format = 'DD/MM/YYYY') {
  const dataVirtual = new Date(new Date().getTime() - (6 * 60 * 60 * 1000));
  const options = { timeZone: 'America/Sao_Paulo' };

  const d = dataVirtual.toLocaleString('pt-BR', { ...options, day: '2-digit' });
  const m = dataVirtual.toLocaleString('pt-BR', { ...options, month: '2-digit' });

  if (format === 'ISO' || format === true) {
    const y = dataVirtual.toLocaleString('pt-BR', { ...options, year: 'numeric' });
    return `${y}-${m}-${d}`;
  }

  const y = dataVirtual.toLocaleString('pt-BR', { ...options, year: format === 'DD/MM/YY' ? '2-digit' : 'numeric' });
  return `${d}/${m}/${y}`;
}

/**
 * Converte ISO (YYYY-MM-DD) para exibição humana (DD/MM/YY).
 */
function isoToDisplay(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.substring(2)}`;
}

/**
 * Limite máximo do Firestore Batch.
 */
const BATCH_LIMIT = 500;

/**
 * Verifica se hoje é dia de trabalho para uma determinada turma com base na escala 2x2.
 * Aplica recuo de 12 horas (Efeito Cinderela) se a chamada ocorrer de madrugada (entre 00h e 06h BRT).
 */
function isDiaDeTrabalho(team) {
  const anchorStr = ANCHOR_DATES[team];
  if (!anchorStr) {
    console.log(`[Escala] Nenhuma escala cadastrada para a Turma ${team}. Processando por padrão.`);
    return true; 
  }
  
  const now = new Date();
  
  // 1. Obter a data local no fuso de Brasília em formato YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  let localDateStr = formatter.format(now);
  
  // 2. Obter a hora atual de Brasília (0-23) para o Efeito Cinderela (recuo de madrugada)
  const hourFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  });
  const brHour = parseInt(hourFormatter.format(now), 10);
  
  // Se for madrugada em Brasília (entre 00h e 06h), aplicamos o Efeito Cinderela recuando 12h
  if (brHour >= 0 && brHour < 6) {
    const prevDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    localDateStr = formatter.format(prevDate);
    console.log(`[Escala] Madrugada detectada (${brHour}h BRT). Aplicando Efeito Cinderela. Data local recuada para: ${localDateStr}`);
  }
  
  // 3. Converter ambas as datas para meia-noite UTC para calcular a diferença absoluta em dias calendários
  const localMidnight = new Date(`${localDateStr}T00:00:00Z`);
  const anchorMidnight = new Date(`${anchorStr}T00:00:00Z`);
  
  const diffDays = Math.round((localMidnight.getTime() - anchorMidnight.getTime()) / (24 * 60 * 60 * 1000));
  
  // Cálculo do dia do ciclo (módulo 4 positivo)
  const cycleDay = ((diffDays % 4) + 4) % 4;
  
  const worksToday = (cycleDay === 0 || cycleDay === 1);
  console.log(`[Escala] Turma ${team}: Diferença = ${diffDays} dias (Data: ${localDateStr}), Dia do ciclo = ${cycleDay} (Trabalho: ${worksToday ? 'Sim' : 'Folga/Não'})`);
  
  return worksToday;
}

module.exports = {
  TURMAS,
  TURMAS_VALIDAS,
  BATCH_LIMIT,
  ANCHOR_DATES,
  isDiaDeTrabalho,
  validateTargetTeam,
  getTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  getConsensusDate,
  getDataDoPlantaoFallback,
  isoToDisplay,
};
