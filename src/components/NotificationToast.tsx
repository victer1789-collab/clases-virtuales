import React, { useEffect, useState } from 'react';
import { Bell, ExternalLink, Video, X } from 'lucide-react';
import { subscribeToPushEvents } from '../services/onesignal';

interface PushNotificationItem {
  id: string;
  titulo: string;
  mensaje: string;
  curso: string;
  url?: string;
  fecha: string;
}

export const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToPushEvents((data) => {
      const item: PushNotificationItem = {
        ...data,
        id: `notif-${Date.now()}-${Math.random()}`,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 3));

      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      }, 7000);
    });

    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-2.5 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-slate-900/95 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-300 transform translate-y-0"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              {notif.url ? <Video className="w-5 h-5 text-emerald-400" /> : <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                  Notificación Push OneSignal • {notif.curso}
                </span>
                <span className="text-[10px] text-slate-400">{notif.fecha}</span>
              </div>
              <h4 className="text-sm font-semibold text-white truncate mt-0.5">{notif.titulo}</h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {notif.mensaje}
              </p>

              {notif.url && (
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href={notif.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Unirse a Meet
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
              className="text-slate-400 hover:text-white p-1 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
