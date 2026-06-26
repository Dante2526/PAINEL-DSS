import React from 'react';
import Modal from '../Modal';
import { UserIcon, ShiftIcon, AusenteIcon, TrashIcon, InfoIcon, HelpIcon, ExchangeIcon } from '../icons';
import { TurmaType, getShiftLabel, getMainShiftLabel } from '../../utils/turmaUtils';

export const UserExistsWarningModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImportClick: () => void;
    existingUserInfo: { name: string; turma: string } | null;
    scale: number;
}> = ({ isOpen, onClose, onImportClick, existingUserInfo, scale }) => {
    if (!isOpen || !existingUserInfo) return null;
    return (
        <Modal isOpen={true} onClose={onClose} title="Usuário Já Cadastrado" scale={scale}>
            <div className="space-y-6 text-center p-2 flex flex-col items-center">
                <div className="mx-auto w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mb-2 text-orange">
                    <UserIcon className="w-8 h-8" />
                </div>
                <p className="text-lg text-light-text dark:text-dark-text font-medium">
                    O colaborador <strong className="text-primary">{existingUserInfo.name}</strong> já existe.
                </p>
                <p className="text-base text-light-text-secondary dark:text-dark-text-secondary -mt-2">
                    Ele está atualmente cadastrado na <strong className="text-light-text dark:text-dark-text">Turma {existingUserInfo.turma}</strong>.
                </p>
                <div className="w-full pt-4 flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                    >
                        ENTENDI
                    </button>
                    <button
                        onClick={onImportClick}
                        className="w-full py-4 font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600 shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <ExchangeIcon className="w-5 h-5" />
                        <span>IMPORTAR FUNCIONÁRIO</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const InvalidMatriculaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    scale: number;
}> = ({ isOpen, onClose, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">FORMATO DE MATRÍCULA</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-primary">
                        <InfoIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Toda matrícula tem <strong>8 dígitos</strong>.</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl w-full border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-light-text-secondary dark:text-gray-300">
                            <span className="block font-bold mb-2 text-primary dark:text-blue-400 uppercase text-xs tracking-wider">Aviso</span>
                            Se você é da <strong className="text-light-text dark:text-white">Velha Guarda</strong>, adicione <strong className="text-light-text dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">01</strong> na frente dos demais números para completar os 8 dígitos.
                        </p>
                    </div>
                    <div className="w-full">
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            ENTENDI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmMalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">CONFIRMAÇÃO NECESSÁRIA</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                        <span className="text-4xl">🚨</span>
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Você selecionou a opção</span>
                        <span className="text-danger font-bold text-3xl">"ESTOU MAL"</span>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        Isso enviará um alerta imediato para a <strong>gestão</strong>. <br />Deseja realmente confirmar que não está se sentindo bem?
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 font-bold text-white bg-danger dark:bg-[#3A1414] rounded-lg hover:bg-red-700 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            SIM, ESTOU MAL
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmTurnoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName: string;
    targetTurno: string;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, employeeName, targetTurno, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">TROCA DE TURNO</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2 text-primary">
                        <ShiftIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Mover <strong>{employeeName}</strong> para o turno:</span>
                        <span className="text-primary font-bold text-3xl">{targetTurno}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            CONFIRMAR TROCA
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmAusenteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName: string;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, employeeName, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">CONFIRMAR AUSÊNCIA</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-orange/20 rounded-full flex items-center justify-center mb-2 text-orange">
                        <AusenteIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Marcar <strong>{employeeName}</strong> como:</span>
                        <span className="text-orange font-bold text-3xl">AUSENTE</span>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        Isso limpará quaisquer registros de horário ou status de saúde anteriores deste colaborador hoje.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 font-bold text-white bg-orange rounded-lg hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            CONFIRMAR AUSÊNCIA
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmDeleteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName: string;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, employeeName, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold uppercase text-light-text dark:text-dark-text mb-6">EXCLUIR USUÁRIO</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2 text-danger">
                        <TrashIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Tem certeza que deseja excluir <strong>{employeeName}</strong>?</span>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        Esta ação removerá o usuário permanentemente do sistema e não pode ser desfeita.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 font-bold text-white bg-danger dark:bg-[#3A1414] rounded-lg hover:bg-red-700 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            SIM, EXCLUIR
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmDeactivate6HModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedTurma: TurmaType | null;
    scale: number;
}> = ({ isOpen, onClose, onConfirm, selectedTurma, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative mx-4"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl z-10"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-6">DESATIVAR TURNO {getShiftLabel(selectedTurma)}</h2>
                <div className="space-y-6 text-center p-2 flex flex-col items-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2 text-danger">
                        <ShiftIcon className="w-8 h-8" />
                    </div>
                    <div className="text-lg text-light-text dark:text-dark-text font-medium flex flex-col items-center gap-2">
                        <span>Tem certeza que deseja desativar o turno {getShiftLabel(selectedTurma)}?</span>
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                        Esta ação moverá todos os funcionários atualmente no turno {getShiftLabel(selectedTurma)} de volta para o turno {getMainShiftLabel(selectedTurma)}, e a coluna será ocultada do painel.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 font-bold text-white bg-danger dark:bg-[#3A1414] rounded-lg hover:bg-red-700 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            SIM, DESATIVAR
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 font-bold text-light-text dark:text-white bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TutorialChoiceModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelectInteractive: () => void;
    onSelectVideo: () => void;
    scale: number;
}> = ({ isOpen, onClose, onSelectInteractive, onSelectVideo, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
        <div
            className="bg-light-card dark:bg-dark-card rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-10 w-full max-w-sm md:max-w-lg text-center relative mx-4 border border-white/20"
            style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out' }}
            onClick={(e) => e.stopPropagation()}
        >
                <h2 className="text-xl md:text-3xl font-black text-light-text dark:text-white mb-1 md:mb-2 tracking-tight">COMO PODEMOS AJUDAR?</h2>
                <p className="text-sm md:text-base text-light-text-secondary dark:text-dark-text-secondary mb-4 md:mb-8 font-medium">Escolha a melhor forma de aprender a usar o sistema</p>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                    <button
                        onClick={onSelectInteractive}
                        className="group flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-gradient-to-br from-primary to-primary-dark rounded-xl md:rounded-2xl text-white shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-1 text-left"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <HelpIcon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base md:text-xl leading-tight">Tour Interativo</h3>
                            <p className="text-white/70 text-xs md:text-sm mt-1 leading-relaxed">Passo a passo guiado diretamente na tela do sistema.</p>
                        </div>
                    </button>
                    <button
                        onClick={onSelectVideo}
                        className="group flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl md:rounded-2xl text-white shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 text-left"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-base md:text-xl leading-tight">Vídeo Aula</h3>
                            <p className="text-white/70 text-xs md:text-sm mt-1 leading-relaxed">Assista ao treinamento completo em vídeo com áudio explicativo.</p>
                        </div>
                    </button>
                </div>
                <div className="mt-5 md:mt-10 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary font-bold rounded-2xl transition-all flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-sm"
                    >
                        <span className="text-xl leading-none">&times;</span>
                        <span className="uppercase tracking-widest text-xs">FECHAR AJUDA</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TutorialVideoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    scale: number;
}> = ({ isOpen, onClose, scale }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="w-[95vw] max-w-[1280px] bg-black rounded-lg shadow-2xl relative border border-white/10"
                style={{ transform: `scale(${scale})`, animation: 'fade-in-scale 0.3s forwards ease-out', maxHeight: '85vh', aspectRatio: '16/9' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-14 right-0 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold z-10 backdrop-blur-md transition-all shadow-lg border border-white/10"
                >
                    <span className="text-sm">FECHAR VÍDEO</span>
                    <span className="text-xl">&times;</span>
                </button>
                <iframe
                    src="https://drive.google.com/file/d/17echHUSii5HsYV3uqciHzckJnTbw2Pig/preview?hd=1"
                    className="w-full h-full rounded-lg"
                    allow="autoplay; fullscreen"
                    title="Vídeo Tutorial Painel DSS"
                ></iframe>
            </div>
        </div>
    );
};
