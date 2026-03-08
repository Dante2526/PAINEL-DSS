import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Registra um evento de auditoria no Firestore.
 * Ignora silenciosamente se o banco de dados não estiver disponível (modo demo).
 */
export const logAuditEvent = async (
    email: string,
    action: string,
    details: string,
    turma: string | null
): Promise<void> => {
    if (!db) return; // Ignora em modo demo ou sem conexão

    try {
        await addDoc(collection(db, 'registros_auditoria'), {
            email,
            action,
            details,
            turma: turma || 'N/A',
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        // Log silencioso para não interromper o fluxo do usuário
        console.error('Erro ao registrar auditoria:', error);
    }
};
