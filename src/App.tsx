import React, { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AlumnoPanel } from './components/AlumnoPanel';
import { CloudflareCodeModal } from './components/CloudflareCodeModal';
import { DocentePanel } from './components/DocentePanel';
import { Navbar } from './components/Navbar';
import { NotificationToast } from './components/NotificationToast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { RoleSelector } from './components/RoleSelector';
import { getCurrentUser, setCurrentUser } from './services/api';
import { initOneSignal } from './services/onesignal';
import { Usuario } from './types';

export default function App() {
  const [currentUser, setLocalCurrentUser] = useState<Usuario | null>(null);
  const [currentView, setCurrentView] = useState<'role_select' | 'alumno' | 'docente' | 'admin'>('role_select');
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);

  // Inicializar OneSignal y cargar usuario persistido
  useEffect(() => {
    initOneSignal();

    // Comprobar si la ruta actual es /admin
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      if (pathname.includes('/admin') || search.includes('admin')) {
        setCurrentView('admin');
        return;
      }
    }

    const saved = getCurrentUser();
    if (saved) {
      setLocalCurrentUser(saved);
      if (saved.rol === 'alumno') setCurrentView('alumno');
      else if (saved.rol === 'docente') setCurrentView('docente');
      else setCurrentView('admin');
    }
  }, []);

  const handleSelectUser = (user: Usuario) => {
    setLocalCurrentUser(user);
    setCurrentUser(user);
    if (user.rol === 'alumno') {
      setCurrentView('alumno');
    } else if (user.rol === 'docente') {
      setCurrentView('docente');
    } else {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLocalCurrentUser(null);
    setCurrentView('role_select');
  };

  const handleNavigate = (view: 'role_select' | 'alumno' | 'docente' | 'admin') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast para Notificaciones Push en Vivo */}
      <NotificationToast />

      {/* Indicador de Estado Fuera de Línea (PWA) */}
      <OfflineIndicator />

      {/* Barra de Navegación Principal con Soporte PWA */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Contenido Principal según el Rol / Vista */}
      <main className="flex-1 pb-12">
        {currentView === 'role_select' && (
          <RoleSelector
            onSelectUser={handleSelectUser}
            onOpenAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'alumno' && (
          <AlumnoPanel
            alumno={
              currentUser && currentUser.rol === 'alumno'
                ? currentUser
                : {
                    id: 'alu-demo',
                    nombre: 'Mateo Fernández',
                    rol: 'alumno',
                    curso: '3ro de Secundaria',
                  }
            }
            onChangeProfile={() => setCurrentView('role_select')}
          />
        )}

        {currentView === 'docente' && (
          <DocentePanel
            docente={
              currentUser && currentUser.rol === 'docente'
                ? currentUser
                : {
                    id: 'doc-demo',
                    nombre: 'Prof. Carlos Mendoza',
                    rol: 'docente',
                    materia: 'Matemáticas',
                    cursosAsignados: [
                      '1ro de Secundaria',
                      '2do de Secundaria',
                      '3ro de Secundaria',
                      '6to de Secundaria',
                    ],
                  }
            }
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
            onSelectUserForTesting={(u) => handleSelectUser(u)}
          />
        )}
      </main>

      {/* Modal de Código y Arquitectura Cloudflare Worker & D1 */}
      <CloudflareCodeModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
      />

      {/* Footer Móvil / General */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AulaSecundaria PWA • Gestión de Clases por Google Meet (1ro a 6to)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              OneSignal Push: Activo
            </span>
            <span>•</span>
            <button
              onClick={() => setIsCloudflareModalOpen(true)}
              className="text-blue-600 hover:underline font-semibold"
            >
              Cloudflare D1 & Worker
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
