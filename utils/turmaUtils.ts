// --- CONFIGURAÇÃO EMAILJS ---
export const EMAILJS_SERVICE_ID = "service_adjw0cj";
export const EMAILJS_TEMPLATE_ID = "template_owo0dmm";
export const EMAILJS_PUBLIC_KEY = "Ef-7IoF9U9NQ_iV8X";
// ----------------------------

// --- TIPO E HELPERS DE TURMA ---
export type TurmaType = 'A' | 'B' | 'C' | 'D' | 'CCG' | 'B_CG' | 'ESTAGIO';
export const ALL_TURMAS: TurmaType[] = ['A', 'B', 'C', 'D', 'CCG', 'B_CG', 'ESTAGIO'];

export const TURMA_DISPLAY_NAMES: Record<TurmaType, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    CCG: 'C CG',
    B_CG: 'B CG',
    ESTAGIO: 'Estágio',
};

export function getTurmaCollectionName(turma: TurmaType): string {
    if (turma === 'ESTAGIO') return 'estagio';
    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `turma ${displayName.toLowerCase()}`;
}

export function getTurmaRegistrationName(turma: TurmaType): string {
    if (turma === 'ESTAGIO') return 'registrosDSS Estágio';
    const displayName = TURMA_DISPLAY_NAMES[turma];
    return `registrosDSS ${displayName}`;
}

export function isValidTurma(value: string): value is TurmaType {
    return ALL_TURMAS.includes(value as TurmaType);
}

export function getShiftLabel(turma: string | null): string {
    return (turma === 'C' || turma === 'D') ? '18H' : '6H';
}

export function getMainShiftLabel(turma: string | null): string {
    return (turma === 'C' || turma === 'D') ? '19H' : '7H';
}
// --------------------------------
