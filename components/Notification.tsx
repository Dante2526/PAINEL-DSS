import React, { useEffect, useState } from 'react';

export interface NotificationData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationProps {
  notification: NotificationData;
  onDismiss: (id: number) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    let dismissTimer: NodeJS.Timeout;

    const timer = setTimeout(() => {
      setVisible(false);
      dismissTimer = setTimeout(() => onDismiss(notification.id), 500);
    }, 3000);

    return () => {
      clearTimeout(timer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [notification, onDismiss]);

  const baseClasses = 'font-semibold text-white px-6 py-4 rounded-xl shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] max-w-xs text-center cursor-pointer';
  const typeClasses = notification.type === 'success' 
    ? 'bg-success hover:scale-[1.02] active:scale-[0.98] transition-all' 
    : notification.type === 'info'
    ? 'bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all'
    : 'bg-danger dark:bg-[#3A1414] hover:bg-red-600 dark:hover:bg-[#4A1818] border border-transparent dark:border-[#5A1C1C]/40 hover:scale-[1.02] active:scale-[0.98] transition-all';
  const visibilityClasses = visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full';

  return (
    <div 
      className={`${baseClasses} ${typeClasses} ${visibilityClasses}`}
      onClick={() => onDismiss(notification.id)}
    >
      {notification.message}
    </div>
  );
};

export default Notification;