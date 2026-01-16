import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-light-card dark:bg-dark-card rounded-full px-6 py-3 shadow-lg text-xs text-light-text-secondary dark:text-dark-text-secondary transition-colors flex items-center gap-4">
      <span className="font-bold opacity-70 tracking-wider">DESENVOLVIDO POR NEAR</span>
    </footer>
  );
};

export default Footer;
