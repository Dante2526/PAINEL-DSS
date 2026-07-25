import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Registra um evento de auditoria no Firestore em uma nova coleção auditoria_logs.
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
        const auditCollection = collection(db, 'auditoria_logs');

        const timestampFormatado = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });

        const logEntry = {
            email,
            action,
            details,
            turma: turma || 'N/A',
            timestamp: timestampFormatado,
            timestamp_unix: Date.now()
        };

        await addDoc(auditCollection, logEntry);

    } catch (error) {
        // Log silencioso para não interromper o fluxo do usuário
        console.error('Erro ao registrar auditoria:', error);
    }
};
