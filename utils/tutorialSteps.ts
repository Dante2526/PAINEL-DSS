import type { TutorialStep } from '../components/InteractiveTutorial';
import { getShiftLabel, getMainShiftLabel } from './turmaUtils';

export const getTutorialSteps = (turma: string | null, is6HActive: boolean = false): TutorialStep[] => {
    const isCCG = turma === 'C_CG' || turma === 'C_CCP_CG' || turma === 'C_CCP_MINERIO'; // ajustado pra ser genérico se precisar
    const shiftLabel = getShiftLabel(turma);
    const mainShiftLabel = getMainShiftLabel(turma);

    const baseSteps: TutorialStep[] = [
        {
            targetId: 'app-header',
            title: 'Controle de Zoom',
            content: 'O painel se adapta a você! Use o movimento de pinça (dois dedos na tela) para dar zoom e ajustar o tamanho ideal para sua visualização.',
            disableHorizontalScroll: true,
            noHighlight: true
        },
        {
            targetId: 'tutorial-manual-register-bar',
            title: 'Registro Manual',
            content: 'Use esta barra superior para registrar o Assunto do DSS do dia e a matrícula do responsável. O nome aparecerá automaticamente ao lado.'
        },
        {
            targetId: 'tutorial-first-card',
            title: 'Cartão do Colaborador',
            content: 'Este é o cartão individual. O funcionário deve marcar "ASS. DSS" e "ESTOU BEM" ao chegar. Se marcar "ESTOU MAL", um alerta será enviado imediatamente para a gestão.'
        },
        {
            targetId: 'tutorial-card-actions',
            title: 'Botões de Ação',
            content: `Todos iniciam como "PENDENTE". Use "AUSENTE" para marcar quem faltou. Use "DELETAR" para remover um usuário (só ADM).${!isCCG ? ` Use "TURNO ${shiftLabel}" para realocar o colaborador.` : ''}`,
            scrollTargetId: 'tutorial-first-card'
        },
        {
            targetId: 'tutorial-card-time',
            title: 'Registro de Horário',
            content: 'Aqui fica registrado o momento exato em que o colaborador assinou sua DSS',
            scrollTargetId: 'tutorial-first-card'
        }
    ];

    if (!isCCG) {
        baseSteps.push(
            {
                targetId: 'tutorial-special-demo-area',
                title: `Turno Diferenciado (${shiftLabel})`,
                content: `Painel exclusivo para a turma do turno de ${shiftLabel}. Funciona da mesma forma que o painel principal, mas com controle separado.`
            },
            {
                targetId: 'tutorial-return-turn-btn',
                title: `Retornar ao Turno ${mainShiftLabel}`,
                content: `Ao Clicar neste botão na coluna do horário especial, o colaborador é movido de volta para o turno ${mainShiftLabel}.`,
                scrollTargetId: 'tutorial-special-demo-area'
            }
        );
    }

    baseSteps.push(
        {
            targetId: 'tutorial-change-turma-btn',
            title: 'Trocar de Turma',
            content: 'Precisa visualizar a outra turma? Use este botão para voltar à tela de seleção a qualquer momento.'
        },
        {
            targetId: 'tutorial-stats',
            title: 'Estatísticas em Tempo Real',
            content: 'Acompanhe quantos colaboradores estão bem, mal, ausentes ou pendentes instantaneamente.'
        }
    );

    if (is6HActive && turma !== 'ESTAGIO') {
        baseSteps.push({
            targetId: 'tutorial-secondary-stats',
            title: `Estatísticas Turno ${shiftLabel}`,
            content: `Acompanhe quantos colaboradores estão alocados para o turno diferenciado de ${shiftLabel}.`
        });
    }

    baseSteps.push(
        {
            targetId: 'tutorial-dark-mode',
            title: 'Modo Escuro (BB-8)',
            content: 'Clique no pequeno droide BB-8 para alternar entre o modo Claro e Escuro. Ideal para ambientes com pouca luz.'
        },
        {
            targetId: 'tutorial-help-btn',
            title: 'Ajuda e Tutorial',
            content: 'Perdido? Clique neste botão a qualquer momento para rever este tutorial interativo e relembrar as funcionalidades.'
        },
        {
            targetId: 'tutorial-admin-btn',
            title: 'Área Administrativa',
            content: 'Acesso restrito para histórico, limpeza, geração de relatórios e configurações do sistema.'
        }
    );

    return baseSteps;
};

export const adminTutorialSteps: TutorialStep[] = [
    {
        targetId: 'admin-history-btn',
        title: 'Histórico Completo',
        content: 'Consulte o histórico de dias anteriores ou acompanhe o dia atual em tempo real. Você pode exportar relatórios diretamente para a plataforma Lumina ou gerar PDFs.'
    },
    {
        targetId: 'admin-report-btn',
        title: 'Gerar Relatório Rápido',
        content: 'Cria um resumo diário rápido da equipe, separando quem está Bem, Mal ou Ausente, ideal para colar no WhatsApp ou enviar por E-mail.'
    },
    {
        targetId: 'admin-adduser-btn',
        title: 'Novo Usuário',
        content: 'Cadastre novos colaboradores manualmente informando Nome, Sobrenome e Matrícula.'
    },
    {
        targetId: 'admin-import-user-btn',
        title: 'Importar Colaborador',
        content: 'Transfira rapidamente um colaborador de outra turma para a turma atual. Muito útil para realocações e coberturas de falta.'
    },
    {
        targetId: 'admin-reorganize-btn',
        title: 'Reorganizar Painel',
        content: 'O sistema já organiza os cartões automaticamente. Use este botão apenas caso seja realmente necessário forçar a reordenação alfabética de todos os cards.'
    },
    {
        targetId: 'admin-clear-btn',
        title: 'Limpar Status Diário',
        content: 'O sistema realiza a limpeza automática diariamente (Madrugada). Use esta opção apenas caso seja necessário forçar o reset manual (ex: virada de turno emergencial).'
    },
    {
        targetId: 'admin-password-btn',
        title: 'Alterar Senha',
        content: 'Mude a sua própria senha de acesso à Área Administrativa.'
    },
    {
        targetId: 'admin-manage-btn',
        title: 'Gerenciar Administradores',
        content: 'Área exclusiva para Master ADMs. Crie, edite ou exclua outros administradores do sistema.'
    },
    {
        targetId: 'admin-audit-btn',
        title: 'Log de Auditoria',
        content: 'Área exclusiva para Master ADMs. Monitore todas as ações críticas (exclusões, limpezas, criação de usuários) feitas por qualquer administrador.'
    },
    {
        targetId: 'admin-demo-btn',
        title: 'Modo Demonstração',
        content: 'Preenche o sistema com dados fictícios para testes. Recurso destinado ao uso técnico.'
    }
];
