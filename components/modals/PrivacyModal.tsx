import React from 'react';
import Modal from '../Modal';

interface PrivacyModalProps {
    onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
    return (
        <Modal onClose={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg w-full max-w-md shadow-xl text-light-text-primary dark:text-dark-text-primary">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Política de Privacidade
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Fechar modal"
                    >
                        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-4 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <p>
                        O <strong>Painel DSS</strong> é uma ferramenta interna focada na visualização e gestão de status de equipes.
                    </p>
                    
                    <div>
                        <h3 className="font-semibold text-base mb-1">Coleta de Dados</h3>
                        <p>Não realizamos nenhum tipo de coleta oculta de dados pessoais, rastreamento de comportamento em outros sites (cookies de rastreamento cruzado), e não acessamos arquivos pessoais do seu dispositivo.</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-base mb-1">Uso das Informações</h3>
                        <p>Os únicos dados processados são aqueles ativamente registrados pelos administradores do sistema referentes ao status de presença e histórico da equipe na operação, que são armazenados de forma segura em banco de dados isolado.</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-base mb-1">Compartilhamento</h3>
                        <p>Não comercializamos, doamos ou repassamos nenhuma informação registrada neste sistema para empresas terceiras, anunciantes ou plataformas de marketing.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PrivacyModal;
