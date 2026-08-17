// --- CONFIGURAÇÃO EMAILJS ---
export const EMAILJS_SERVICE_ID = "service_adjw0cj";
export const EMAILJS_TEMPLATE_ID = "template_owo0dmm";
export const EMAILJS_PUBLIC_KEY = "Ef-7IoF9U9NQ_iV8X";
// ----------------------------

// --- TIPO E HELPERS DE TURMA ---
export type TurmaType = 'A' | 'B' | 'C' | 'D' | 'A_CG' | 'B_CG' | 'C_CG' | 'D_CG' | 'ESTAGIO' | 'A_CCP_CG' | 'B_CCP_CG' | 'C_CCP_CG' | 'D_CCP_CG' | 'A_CCP_MINERIO' | 'B_CCP_MINERIO' | 'C_CCP_MINERIO' | 'D_CCP_MINERIO';
export const ALL_TURMAS: TurmaType[] = ['A', 'B', 'C', 'D', 'A_CG', 'B_CG', 'C_CG', 'D_CG', 'ESTAGIO', 'A_CCP_CG', 'B_CCP_CG', 'C_CCP_CG', 'D_CCP_CG', 'A_CCP_MINERIO', 'B_CCP_MINERIO', 'C_CCP_MINERIO', 'D_CCP_MINERIO'];

export const TURMA_DISPLAY_NAMES: Record<TurmaType, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    A_CG: 'A CG',
    B_CG: 'B CG',
    C_CG: 'C CG',
    D_CG: 'D CG',
    ESTAGIO: 'Estágio',
    A_CCP_CG: 'A CCP Carga Geral',
    B_CCP_CG: 'B CCP Carga Geral',
    C_CCP_CG: 'C CCP Carga Geral',
    D_CCP_CG: 'D CCP Carga Geral',
    A_CCP_MINERIO: 'A CCP Minério',
    B_CCP_MINERIO: 'B CCP Minério',
    C_CCP_MINERIO: 'C CCP Minério',
    D_CCP_MINERIO: 'D CCP Minério',
};

// Coleções CCP com nome fixo para não depender do displayName
const CCP_COLLECTIONS: Partial<Record<TurmaType, string>> = {
    A_CCP_CG: 'turma a ccp_cg',
    B_CCP_CG: 'turma b ccp_cg',
    C_CCP_CG: 'turma c ccp_cg',
    D_CCP_CG: 'turma d ccp_cg',
    A_CCP_MINERIO: 'turma a ccp_minerio',
    B_CCP_MINERIO: 'turma b ccp_minerio',
    C_CCP_MINERIO: 'turma c ccp_minerio',
    D_CCP_MINERIO: 'turma d ccp_minerio',
};

// Registros CCP com nome fixo para não depender do displayName
const CCP_REGISTRATIONS: Partial<Record<TurmaType, string>> = {
    A_CCP_CG: 'registrosDSS A CCP_CG',
    B_CCP_CG: 'registrosDSS B CCP_CG',
    C_CCP_CG: 'registrosDSS C CCP_CG',
    D_CCP_CG: 'registrosDSS D CCP_CG',
    A_CCP_MINERIO: 'registrosDSS A CCP_MINERIO',
    B_CCP_MINERIO: 'registrosDSS B CCP_MINERIO',
    C_CCP_MINERIO: 'registrosDSS C CCP_MINERIO',
    D_CCP_MINERIO: 'registrosDSS D CCP_MINERIO',
};

export function getTurmaCollectionName(turma: TurmaType): string {
    if (turma === 'ESTAGIO') return 'estagio';
    
    if (CCP_COLLECTIONS[turma]) return CCP_COLLECTIONS[turma]!;

    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `turma ${displayName.toLowerCase()}`;
}

export function getTurmaRegistrationName(turma: TurmaType): string {
    if (turma === 'ESTAGIO') return 'registrosDSS Estágio';

    if (CCP_REGISTRATIONS[turma]) return CCP_REGISTRATIONS[turma]!;

    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `registrosDSS ${displayName}`;
}

export function isValidTurma(value: string): value is TurmaType {
    return ALL_TURMAS.includes(value as TurmaType);
}

export function getShiftLabel(turma: string | null): string {
    return (turma === 'C' || turma === 'D' || turma === 'D_CG' || turma === 'C_CG' || turma === 'C_CCP_CG' || turma === 'D_CCP_CG' || turma === 'C_CCP_MINERIO' || turma === 'D_CCP_MINERIO') ? '18H' : '6H';
}

export function getMainShiftLabel(turma: string | null): string {
    return (turma === 'C' || turma === 'D' || turma === 'D_CG' || turma === 'C_CG' || turma === 'C_CCP_CG' || turma === 'D_CCP_CG' || turma === 'C_CCP_MINERIO' || turma === 'D_CCP_MINERIO') ? '19H' : '7H';
}
// --------------------------------

export type DisplayMode = 'NORMAL' | 'CG' | 'MINERIO';

/** Retorna o modo de exibição baseado na URL atual. */
export function getDisplayModeFromPath(): DisplayMode {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/ccp-carga-geral') return 'CG';
    if (path === '/ccp-minerio') return 'MINERIO';
    return 'NORMAL';
}

/** Função utilitária para verificar se a turma é da rota Carga Geral (CCP) */
export function isCargaGeralTurma(turma: TurmaType): boolean {
    return turma.includes('_CCP_CG');
}

/** Função utilitária para verificar se a turma é da rota Minério (CCP) */
export function isMinerioTurma(turma: TurmaType): boolean {
    return turma.includes('_CCP_MINERIO');
}
