import React, { useEffect, useRef, useState } from 'react';
import { Check, Info, Key, LogIn, Sparkles, User, X } from 'lucide-react';
import {
  decodeGoogleJwt,
  GOOGLE_CLIENT_ID,
  GoogleUserProfile,
  renderGoogleButton,
  saveGoogleProfile,
} from '../services/googleAuth';

interface Props {
  onSuccess: (profile: GoogleUserProfile) => void;
  onError?: (error: any) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<Props> = ({
  onSuccess,
  onError,
  className = '',
}) => {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const hasClientId = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== '');

  useEffect(() => {
    let checkInterval: any;

    if (hasClientId && buttonContainerRef.current) {
      const tryRender = () => {
        if (buttonContainerRef.current && window.google?.accounts?.id) {
          const ok = renderGoogleButton(
            buttonContainerRef.current,
            (profile) => {
              onSuccess(profile);
            },
            (err) => {
              if (onError) onError(err);
            }
          );
          if (ok) {
            setIsRendered(true);
            clearInterval(checkInterval);
          }
        }
      };

      tryRender();
      checkInterval = setInterval(tryRender, 600);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [hasClientId, onSuccess, onError]);

  // Demo Google profiles for quick simulation when VITE_GOOGLE_CLIENT_ID is testing
  const handleQuickDemoSelect = (preset: { name: string; email: string; avatar: string }) => {
    const profile: GoogleUserProfile = {
      sub: `google-${Date.now()}`,
      name: preset.name,
      email: preset.email,
      picture: preset.avatar,
      email_verified: true,
    };
    saveGoogleProfile(profile);
    onSuccess(profile);
    setShowDemoModal(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const email = customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const profile: GoogleUserProfile = {
      sub: `google-${Date.now()}`,
      name: customName.trim(),
      email,
      picture: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(customName)}`,
      email_verified: true,
    };
    saveGoogleProfile(profile);
    onSuccess(profile);
    setShowDemoModal(false);
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Official Google Button Container if Client ID is configured */}
      {hasClientId && (
        <div className="w-full flex justify-center">
          <div ref={buttonContainerRef} className="min-h-[44px]" />
        </div>
      )}

      {/* Button fallback or primary button if Client ID not yet loaded or not set */}
      {(!hasClientId || !isRendered) && (
        <button
          type="button"
          onClick={() => {
            if (hasClientId && window.google?.accounts?.id) {
              window.google.accounts.id.prompt();
            } else {
              setShowDemoModal(true);
            }
          }}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-300 hover:border-slate-400 shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-3 group"
        >
          {/* Google Official Multi-Color SVG Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-slate-800">Continuar con Google</span>
        </button>
      )}

      {/* Status hint */}
      {!hasClientId && (
        <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-blue-500" />
          <span>Vincular con tu cuenta de Google (OAuth)</span>
        </p>
      )}

      {/* Modal for Google Sign-In Setup & Test Profiles */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Iniciar sesión con Google</h3>
                  <p className="text-xs text-slate-500">Google OAuth 2.0 Identity Services</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variable notice */}
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Variable Google OAuth vinculada:</span>
              </p>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                El componente está configurado con <code className="bg-white/90 px-1 py-0.5 rounded font-mono font-bold text-blue-900">import.meta.env.VITE_GOOGLE_CLIENT_ID</code>.
                {hasClientId ? (
                  <span className="text-emerald-700 font-semibold block mt-0.5">
                    ✓ Client ID detectado y activo.
                  </span>
                ) : (
                  <span className="text-slate-600 block mt-0.5">
                    Puedes probar seleccionando una cuenta de Google a continuación o ingresando tu nombre para simular la captura de foto, correo y nombre.
                  </span>
                )}
              </p>
            </div>

            {/* Cuentas de demostración predefinidas */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Seleccionar Cuenta de Google para entrar:
              </label>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoSelect({
                    name: 'Mateo Fernández',
                    email: 'mateo.fernandez@gmail.com',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 transition text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Mateo"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Mateo Fernández
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">mateo.fernandez@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  Estudiante
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoSelect({
                    name: 'Prof. Carlos Mendoza',
                    email: 'carlos.mendoza.docente@gmail.com',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex items-center gap-3 transition text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Prof. Mendoza"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                    Prof. Carlos Mendoza
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">carlos.mendoza.docente@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  Profesor
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoSelect({
                    name: 'Sofía Castillo',
                    email: 'sofia.castillo.estudiante@gmail.com',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50/50 flex items-center gap-3 transition text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                  alt="Sofía"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-pink-700">
                    Sofía Castillo
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">sofia.castillo.estudiante@gmail.com</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-100 text-pink-700">
                  Estudiante
                </span>
              </button>
            </div>

            {/* O ingresar datos personalizados */}
            <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                O ingresar con tu propia cuenta:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tu Nombre Completo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="tu.correo@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40"
              >
                Entrar con estos datos de Google
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
