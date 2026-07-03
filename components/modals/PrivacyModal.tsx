import React from 'react';
import Modal from '../Modal';

interface PrivacyModalProps {
    onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title="Política de Privacidade e Uso de Dados"
            size="md"
            showScrollbar={true}
        >
            <div className="space-y-5 text-sm leading-relaxed text-left text-light-text-secondary dark:text-dark-text-secondary mt-2">
                <p>
                    O <strong>Painel DSS</strong> é uma ferramenta interna focada na visualização e gestão de status de equipes.
                </p>
                
                <div>
                    <h3 className="font-semibold text-base mb-1 text-light-text dark:text-dark-text">Coleta de Dados</h3>
                    <p>Não realizamos nenhum tipo de coleta oculta de dados pessoais, rastreamento de comportamento em outros sites (cookies de rastreamento cruzado), e não acessamos arquivos pessoais do seu dispositivo.</p>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-1 text-light-text dark:text-dark-text">Uso das Informações</h3>
                    <p>Os únicos dados processados são aqueles ativamente registrados pelos administradores do sistema referentes ao status de presença e histórico da equipe na operação, que são armazenados de forma segura em banco de dados isolado.</p>
                </div>

                <div>
                    <h3 className="font-semibold text-base mb-1 text-light-text dark:text-dark-text">Compartilhamento</h3>
                    <p>Não comercializamos, doamos ou repassamos nenhuma informação registrada neste sistema para empresas terceiras, anunciantes ou plataformas de marketing.</p>
                </div>

                <div className="pt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PrivacyModal;
