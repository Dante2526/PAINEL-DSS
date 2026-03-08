import { db } from '../firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

/**
 * Registra um evento de auditoria no Firestore agrupado pelo e-mail do administrador.
 * Ignora silenciosamente se o banco de dados não estiver disponível (modo demo).
 */
export const logAuditEvent = async (
    email: string,
    action: string,
    details: string,
    turma: string | null
): Promise<void> => {
    if (!db) return; // Ignora em modo demo ou sem conexão
    if (!email) return;

    try {
        const adminAuditRef = doc(db, 'registros_auditoria', email);

        const logEntry = {
            action,
            details,
            turma: turma || 'N/A',
            timestamp: new Date().toISOString()
        };

        await setDoc(adminAuditRef, {
            acoes: arrayUnion(logEntry),
            ultimo_acesso: new Date().toISOString()
        }, { merge: true });

    } catch (error) {
        // Log silencioso para não interromper o fluxo do usuário
        console.error('Erro ao registrar auditoria:', error);
    }
};
