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

/**
 * Valida e retorna o TARGET_TEAM da variável de ambiente.
 * Encerra o processo com erro se inválido.
 */
function getTargetTeam() {
  const team = process.env.TARGET_TEAM;
  if (!team || !TURMAS_VALIDAS.includes(team)) {
    console.error(`ERRO CRÍTICO: TARGET_TEAM não definido ou inválido ("${team}"). Esperado: ${TURMAS_VALIDAS.join(', ')}.`);
    process.exit(1);
  }
  return team;
}

/**
 * Retorna os nomes das coleções do Firestore para a turma especificada.
 */
function getCollections(team) {
  return TURMAS[team];
}

/**
 * Inicializa o Firebase Admin com proteção contra JSON inválido.
 */
function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error("ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON está vazio ou ausente.");
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("ERRO CRÍTICO: FIREBASE_SERVICE_ACCOUNT_JSON contém JSON inválido.", e.message);
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

module.exports = {
  TURMAS,
  TURMAS_VALIDAS,
  BATCH_LIMIT,
  getTargetTeam,
  getCollections,
  parseServiceAccount,
  isAutomacaoPausada,
  getConsensusDate,
  getDataDoPlantaoFallback,
  isoToDisplay,
};
