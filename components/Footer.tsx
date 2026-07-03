import React, { useState } from 'react';
import PrivacyModal from './modals/PrivacyModal';

const Footer: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2 mt-4 md:mt-8 pb-4">
      <footer className="w-fit bg-light-card dark:bg-dark-card rounded-full px-4 py-2 shadow-lg text-center text-xs text-light-text-secondary dark:text-dark-text-secondary transition-colors">
        <div className="flex items-center justify-center gap-4">
          <span className="font-bold opacity-70 tracking-wider">DESENVOLVIDO POR NEAR</span>
        </div>
      </footer>
      
      <button 
        onClick={() => setShowPrivacy(true)}
        className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary opacity-40 hover:opacity-100 hover:underline transition-opacity"
      >
        Política de Privacidade e Uso de Dados
      </button>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default React.memo(Footer);
