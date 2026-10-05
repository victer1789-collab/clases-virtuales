import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center justify-between gap-3 rounded-2xl bg-amber-500/95 text-white px-4 py-2.5 shadow-xl backdrop-blur-xs text-xs font-semibold animate-bounce">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <span>Sin conexión a Internet — Modo sin conexión activo (PWA)</span>
      </div>
    </div>
  );
};
