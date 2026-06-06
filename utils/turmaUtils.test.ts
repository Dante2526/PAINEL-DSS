import { describe, it, expect } from 'vitest';
import { 
    getTurmaCollectionName, 
    getTurmaRegistrationName, 
    isValidTurma, 
    getShiftLabel, 
    getMainShiftLabel 
} from './turmaUtils';

describe('turmaUtils', () => {
    describe('getTurmaCollectionName', () => {
        it('deve retornar "turma a" para a Turma A', () => {
            expect(getTurmaCollectionName('A')).toBe('turma a');
        });

        it('deve retornar "turma c cg" para a Turma CCG', () => {
            expect(getTurmaCollectionName('CCG')).toBe('turma c cg');
        });
    });

    describe('getTurmaRegistrationName', () => {
        it('deve retornar "registrosDSS B" para a Turma B', () => {
            expect(getTurmaRegistrationName('B')).toBe('registrosDSS B');
        });

        it('deve retornar "registrosDSS C CG" para a Turma CCG', () => {
            expect(getTurmaRegistrationName('CCG')).toBe('registrosDSS C CG');
        });
    });

    describe('isValidTurma', () => {
        it('deve retornar true para turmas válidas', () => {
            expect(isValidTurma('A')).toBe(true);
            expect(isValidTurma('CCG')).toBe(true);
        });

        it('deve retornar false para turmas inválidas', () => {
            expect(isValidTurma('X')).toBe(false);
            expect(isValidTurma('a')).toBe(false); // Case sensitive
            expect(isValidTurma('')).toBe(false);
        });
    });

    describe('Lógica de Turnos Especiais', () => {
        it('getShiftLabel deve retornar "18H" para turmas noturnas (C e D)', () => {
            expect(getShiftLabel('C')).toBe('18H');
            expect(getShiftLabel('D')).toBe('18H');
        });

        it('getShiftLabel deve retornar "6H" para turmas diurnas (A, B, CCG)', () => {
            expect(getShiftLabel('A')).toBe('6H');
            expect(getShiftLabel('B')).toBe('6H');
            expect(getShiftLabel('CCG')).toBe('6H');
            expect(getShiftLabel(null)).toBe('6H');
        });

        it('getMainShiftLabel deve retornar "19H" para turmas noturnas (C e D)', () => {
            expect(getMainShiftLabel('C')).toBe('19H');
            expect(getMainShiftLabel('D')).toBe('19H');
        });

        it('getMainShiftLabel deve retornar "7H" para turmas diurnas (A, B, CCG)', () => {
            expect(getMainShiftLabel('A')).toBe('7H');
            expect(getMainShiftLabel('B')).toBe('7H');
            expect(getMainShiftLabel('CCG')).toBe('7H');
            expect(getMainShiftLabel(null)).toBe('7H');
        });
    });
});
