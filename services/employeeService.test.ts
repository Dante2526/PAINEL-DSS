import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './employeeService';

describe('employeeService', () => {
    describe('formatTimestamp', () => {
        it('deve retornar "--:--" se a data for null ou undefined', () => {
            expect(formatTimestamp(null)).toBe('--:--');
            expect(formatTimestamp(undefined as any)).toBe('--:--');
        });

        it('deve retornar a string original se for passada uma string', () => {
            expect(formatTimestamp('14:30')).toBe('14:30');
            expect(formatTimestamp('Texto qualquer')).toBe('Texto qualquer');
        });

        it('deve formatar corretamente um mock de Timestamp do Firebase (duck-typing)', () => {
            // Simulando um objeto Timestamp do Firebase
            const mockDate = new Date('2026-06-06T14:30:00Z');
            const mockTimestamp = {
                toDate: () => mockDate
            };
            
            // O resultado depende do timezone de onde roda o teste (pt-BR local time)
            const result = formatTimestamp(mockTimestamp as any);
            
            // Verifica o formato DD/MM/YYYY HH:mm usando RegExp
            expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
            // Verifica que a string contém o ano 2026
            expect(result).toContain('2026');
        });
    });
});
