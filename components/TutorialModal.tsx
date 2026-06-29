

import React from 'react';
import Modal from './Modal';
import { SubjectIcon, UserIcon, MousePointerIcon, AdminIcon, InfoIcon, ZoomIcon } from './icons';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    scale?: number;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, scale }) => {
    // Mobile check based on screen width since scale is normalized
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxWidthClass = isMobile ? 'max-w-[95vw]' : 'max-w-5xl';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Como usar o Sistema" scale={scale}>
            <div className={`text-left bg-light-bg dark:bg-dark-bg-secondary p-6 rounded-lg overflow-y-auto ${isMobile ? 'max-h-[60vh]' : 'max-h-[70vh]'} ${maxWidthClass} w-full`}>
                
                {/* Section 1: Daily Use */}
                <div className="mb-8">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-primary mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">
                        <MousePointerIcon className="w-6 h-6" />
                        <span>1. Registro Diário (Cartões)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-success mb-2 flex items-center gap-2">
                                <span className="text-xl">🙂</span> ESTOU BEM
                            </h4>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                Ao chegar, o colaborador clica aqui. Isso confirma automaticamente:
                                <ul className="list-disc pl-5 mt-1">
                                    <li>Presença no local.</li>
                                    <li>Leitura/Compreensão do tema da DSS.</li>
                                    <li>Bom estado de saúde.</li>
                                </ul>
                            </p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-danger mb-2 flex items-center gap-2">
                                <span className="text-xl">😟</span> ESTOU MAL
                            </h4>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                Se o colaborador não estiver se sentindo bem.
                                <br/>
                                <strong>Atenção:</strong> Isso gera um alerta visual no cartão e envia um e-mail imediato para a gestão responsável.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Manual Register */}
                <div className="mb-8">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-orange mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">
                        <SubjectIcon className="w-6 h-6" />
                        <span>2. Registro Manual (Topo do Painel)</span>
                    </h3>
                    <p className="text-sm text-light-text dark:text-dark-text mb-4">
                        Use esta barra (localizada acima dos cartões) para registrar o <strong>Tema da DSS</strong> do dia e a matrícula do instrutor ou responsável.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-100 dark:bg-gray-800 p-3 rounded-lg opacity-80 pointer-events-none">
                        <div className="w-full md:w-2/3 border-2 border-gray-300 rounded p-2 bg-white dark:bg-gray-700 text-xs">ASSUNTO DO DSS</div>
                        <div className="w-full md:w-1/3 border-2 border-gray-300 rounded p-2 bg-white dark:bg-gray-700 text-xs">MATRÍCULA</div>
                        <div className="bg-primary text-white px-4 py-2 rounded text-xs font-bold">REGISTRAR</div>
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 italic">
                        * Existem barras separadas para o Turno 7H (esquerda) e Turno 6H (direita/painel lateral).
                    </p>
                </div>

                {/* Section 3: Admin */}
                <div className="mb-8">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-purple-600 mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">
                        <AdminIcon className="w-6 h-6" />
                        <span>3. Área Administrativa</span>
                    </h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="bg-orange text-white p-1 rounded"><AdminIcon className="w-4 h-4"/></div>
                            <div>
                                <strong className="text-light-text dark:text-dark-text">Limpar Status Diário:</strong>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Reseta todas as marcações de "Bem/Mal" para o dia seguinte. (Geralmente feito automaticamente ou no início do turno).</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-blue-500 text-white p-1 rounded"><InfoIcon className="w-4 h-4"/></div>
                            <div>
                                <strong className="text-light-text dark:text-dark-text">Gerar Relatório:</strong>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Cria um resumo completo de presentes, ausentes e pessoas que relataram mal-estar, pronto para copiar ou baixar.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-green-500 text-white p-1 rounded"><UserIcon className="w-4 h-4"/></div>
                            <div>
                                <strong className="text-light-text dark:text-dark-text">Novo Usuário:</strong>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Adiciona um novo cartão de colaborador ao painel.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                 {/* Section 4: Navigation */}
                 <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-neutral mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">
                        <ZoomIcon className="w-6 h-6" />
                        <span>4. Navegação e Dicas</span>
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-light-text dark:text-dark-text space-y-2">
                        <li>
                            <strong>Zoom:</strong> Em telas sensíveis ao toque, use o movimento de pinça. Em computadores, segure <code>Ctrl</code> + <code>Roda do Mouse</code>.
                        </li>
                        <li>
                            <strong>Arrastar:</strong> Clique e segure em qualquer lugar vazio para mover o painel (Pan).
                        </li>
                         <li>
                            <strong>Modo Escuro:</strong> Use o botão do robô (BB-8) no topo para alternar entre tema claro e escuro para conforto visual.
                        </li>
                    </ul>
                </div>

            </div>
            <div className="mt-6">
                <button onClick={onClose} className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition shadow-lg">
                    ENTENDI
                </button>
            </div>
        </Modal>
    );
};

export default TutorialModal;
