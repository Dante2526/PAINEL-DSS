import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-fit mx-auto bg-light-card dark:bg-dark-card rounded-full px-4 py-2 mt-4 shadow-lg text-center text-xs text-light-text-secondary dark:text-dark-text-secondary transition-colors">
      <div className="flex items-center justify-center gap-4">
        <span className="font-bold opacity-70 tracking-wider">DESENVOLVIDO POR NEAR</span>
      </div>
    </footer>
  );
};

export default Footer;