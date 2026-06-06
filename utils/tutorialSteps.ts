import { TutorialStep } from '../components/InteractiveTutorial';
import { getShiftLabel, getMainShiftLabel } from './turmaUtils';

export const getTutorialSteps = (turma: string | null): TutorialStep[] => {
    const isCCG = turma === 'CCG';
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
            content: `Use "AUSENTE" para marcar que o colaborador faltou. Use "DELETAR" para remover permanentemente o usuário (Aparece somente para ADM).${!isCCG ? ` Use "TURNO ${shiftLabel}" para mover o colaborador para uma coluna somente para esse turno.` : ''}`,
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
            content: 'Acompanhe quantos colaboradores estão bem, mal ou ausentes instantaneamente.'
        },
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
            content: 'Acesso restrito para limpar os dados diários, gerar relatórios em PDF/Texto e cadastrar novos usuários.'
        }
    );

    return baseSteps;
};

export const adminTutorialSteps: TutorialStep[] = [
    {
        targetId: 'admin-clear-btn',
        title: 'Limpar Status Diário',
        content: 'O sistema realiza a limpeza automática diariamente. Use esta opção apenas caso seja realmente necessário forçar o reset de todos os status manualmente.'
    },
    {
        targetId: 'admin-report-btn',
        title: 'Gerar Relatório',
        content: 'Cria um resumo completo da equipe, separando quem está Bem, Mal ou Pendente. Você pode copiar o texto ou baixar um arquivo.'
    },
    {
        targetId: 'admin-reorganize-btn',
        title: 'Reorganizar Painel',
        content: 'O sistema já organiza os cartões automaticamente. Use este botão apenas caso seja realmente necessário forçar a reordenação alfabética.'
    },
    {
        targetId: 'admin-adduser-btn',
        title: 'Novo Usuário',
        content: 'Cadastre novos colaboradores manualmente no sistema.'
    },
    {
        targetId: 'admin-import-user-btn',
        title: 'Importar Colaborador',
        content: 'Transfira rapidamente um colaborador de outra turma para a turma atual. Muito útil para realocações e coberturas de falta.'
    },
    {
        targetId: 'admin-demo-btn',
        title: 'Modo Demonstração',
        content: 'Preenche o sistema com dados fictícios para testes. Recurso destinado ao uso técnico do Desenvolvedor Near.'
    }
];
