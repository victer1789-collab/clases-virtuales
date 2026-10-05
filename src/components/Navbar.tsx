import React from 'react';
import {
  Bell,
  CheckCircle2,
  Code2,
  GraduationCap,
  LogOut,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import { Usuario } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  currentUser: Usuario | null;
  currentView: 'role_select' | 'alumno' | 'docente' | 'admin';
  onNavigate: (view: 'role_select' | 'alumno' | 'docente' | 'admin') => void;
  onOpenCloudflareModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenCloudflareModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => {
            if (currentUser) {
              onNavigate(currentUser.rol === 'admin' ? 'admin' : currentUser.rol);
            } else {
              onNavigate('role_select');
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                Aula<span className="text-blue-600">Secundaria</span>
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">
              Clases en Vivo por Google Meet
            </p>
          </div>
        </div>

        {/* Center / Navigation items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick role tabs if logged in */}
          {currentUser && (
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => onNavigate('alumno')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  currentView === 'alumno'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Alumno
              </button>
              <button
                onClick={() => onNavigate('docente')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  currentView === 'docente'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Docente
              </button>
              <button
                onClick={() => onNavigate('admin')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  currentView === 'admin'
                    ? 'bg-white text-purple-600 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-purple-500" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          )}

          {!currentUser && (
            <button
              onClick={() => onNavigate('admin')}
              className="text-xs font-semibold text-slate-600 hover:text-purple-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-purple-200 transition flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
              <span>Panel /admin</span>
            </button>
          )}

          {/* Cloudflare deliverable button */}
          <button
            onClick={onOpenCloudflareModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/60 text-slate-700 text-xs font-semibold transition"
            title="Ver código Cloudflare D1 & Worker OneSignal"
          >
            <Code2 className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden md:inline">Cloudflare & Worker</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Active user status & logout */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 ml-1">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.nombre}
                </p>
                <p className="text-[10px] text-blue-600 font-medium">
                  {currentUser.rol === 'alumno'
                    ? currentUser.curso
                    : currentUser.rol === 'docente'
                    ? currentUser.materia
                    : 'Administrador'}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Cambiar de Rol / Salir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('role_select')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Elegir Rol</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
