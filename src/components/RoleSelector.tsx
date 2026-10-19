import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  GraduationCap,
  LogOut,
  Mail,
  School,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Video,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleUserProfile } from '../services/googleAuth';
import { CURSOS_SECUNDARIA, CursoSecundaria, MATERIAS_SUGERIDAS, Usuario } from '../types';
import { requestOneSignalPushPermission, sendOneSignalCourseTag } from '../services/onesignal';

interface Props {
  onSelectUser: (usuario: Usuario) => void;
  onOpenAdmin: () => void;
}

export const RoleSelector: React.FC<Props> = ({ onSelectUser, onOpenAdmin }) => {
  const [selectedRole, setSelectedRole] = useState<'alumno' | 'docente' | null>(null);
  const [googleProfile, setGoogleProfile] = useState<GoogleUserProfile | null>(null);

  // Estados Formulario Alumno
  const [alumnoNombre, setAlumnoNombre] = useState('');
  const [alumnoCurso, setAlumnoCurso] = useState<CursoSecundaria>('3ro de Secundaria');
  const [pushActive, setPushActive] = useState(true);

  // Estados Formulario Docente
  const [docenteNombre, setDocenteNombre] = useState('');
  const [docenteMateria, setDocenteMateria] = useState('Matemáticas');
  const [docenteCursos, setDocenteCursos] = useState<CursoSecundaria[]>([
    '2do de Secundaria',
    '3ro de Secundaria',
    '4to de Secundaria',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Callback cuando el usuario inicia sesión con Google
  const handleGoogleSuccess = (profile: GoogleUserProfile) => {
    setGoogleProfile(profile);
    setAlumnoNombre(profile.name);
    setDocenteNombre(profile.name);
  };

  const toggleDocenteCurso = (curso: CursoSecundaria) => {
    if (docenteCursos.includes(curso)) {
      if (docenteCursos.length === 1) return; // Al menos un curso seleccionado
      setDocenteCursos(docenteCursos.filter((c) => c !== curso));
    } else {
      setDocenteCursos([...docenteCursos, curso]);
    }
  };

  const handleSelectAllCursos = () => {
    if (docenteCursos.length === CURSOS_SECUNDARIA.length) {
      setDocenteCursos(['3ro de Secundaria']);
    } else {
      setDocenteCursos([...CURSOS_SECUNDARIA]);
    }
  };

  // Guardar Alumno y ejecutar OneSignal.sendTag("curso", curso)
  const handleSubmitAlumno = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNombre = (alumnoNombre || googleProfile?.name || '').trim();
    if (!finalNombre) return;

    setIsSubmitting(true);
    setStatusMessage('Configurando perfil y sincronizando notificaciones con OneSignal...');

    try {
      // 1. Pedir permisos push si el usuario lo desea
      if (pushActive) {
        await requestOneSignalPushPermission();
      }

      // 2. REQUISITO FUNDAMENTAL: Ejecutar OneSignal.sendTag("curso", cursoSeleccionado)
      const tagResult = await sendOneSignalCourseTag(alumnoCurso);
      setStatusMessage(tagResult.message);

      // Crear usuario alumno con datos de Google
      const nuevoAlumno: Usuario = {
        id: googleProfile ? `alu-${googleProfile.sub}` : `alu-${Date.now()}`,
        nombre: finalNombre,
        rol: 'alumno',
        curso: alumnoCurso,
        email: googleProfile?.email || `${finalNombre.toLowerCase().replace(/\s+/g, '.')}@secundaria.edu`,
        fotoUrl: googleProfile?.picture,
        googleId: googleProfile?.sub,
      };

      setTimeout(() => {
        setIsSubmitting(false);
        onSelectUser(nuevoAlumno);
      }, 700);
    } catch (err) {
      console.error('Error al guardar alumno:', err);
      setIsSubmitting(false);
      onSelectUser({
        id: `alu-${Date.now()}`,
        nombre: finalNombre,
        rol: 'alumno',
        curso: alumnoCurso,
        email: googleProfile?.email,
        fotoUrl: googleProfile?.picture,
      });
    }
  };

  // Guardar Docente
  const handleSubmitDocente = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNombre = (docenteNombre || googleProfile?.name || '').trim();
    if (!finalNombre || !docenteMateria.trim() || docenteCursos.length === 0) return;

    setIsSubmitting(true);
    const nuevoDocente: Usuario = {
      id: googleProfile ? `doc-${googleProfile.sub}` : `doc-${Date.now()}`,
      nombre: finalNombre,
      rol: 'docente',
      materia: docenteMateria.trim(),
      cursosAsignados: docenteCursos,
      email: googleProfile?.email || `${finalNombre.toLowerCase().replace(/\s+/g, '.')}@colegio.edu`,
      fotoUrl: googleProfile?.picture,
      googleId: googleProfile?.sub,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSelectUser(nuevoDocente);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-radial from-blue-50/50 via-slate-50 to-slate-100">
      <div className="w-full max-w-xl">
        {/* Step 1: Role Selection Cards & Google Sign In */}
        {!selectedRole && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Gestión Escolar Virtual
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bienvenido a Aula<span className="text-blue-600">Secundaria</span>
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Inicia sesión con Google o selecciona tu rol para acceder a tus clases en Google Meet y notificaciones.
              </p>
            </div>

            {/* SECCIÓN GOOGLE OAUTH: Perfil detectado o Botón de Google */}
            {googleProfile ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-emerald-300 shadow-lg shadow-emerald-500/5 space-y-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={googleProfile.picture}
                      alt={googleProfile.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {googleProfile.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          Google OAuth
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{googleProfile.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGoogleProfile(null)}
                    className="p-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Cerrar sesión de Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    ¿Cómo deseas ingresar a la plataforma?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAlumnoNombre(googleProfile.name);
                        setSelectedRole('alumno');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Como Alumno</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocenteNombre(googleProfile.name);
                        setSelectedRole('docente');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <School className="w-4 h-4" />
                      <span>Como Docente</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700">
                    Acceso Rápido y Seguro
                  </span>
                </div>
                {/* Botón de Google OAuth */}
                <GoogleSignInButton onSuccess={handleGoogleSuccess} />
              </div>
            )}

            {/* Separador visual */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-slate-50 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                O elige tu rol manualmente
              </span>
            </div>

            {/* Role Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option Alumno */}
              <button
                type="button"
                onClick={() => setSelectedRole('alumno')}
                className="group relative flex flex-col items-start p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Estudiantes
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Soy Alumno
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ingresa a tus clases de Google Meet según tu grado (1ro a 6to de secundaria).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Acceder como alumno</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>

              {/* Option Docente */}
              <button
                type="button"
                onClick={() => setSelectedRole('docente')}
                className="group relative flex flex-col items-start p-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                  <School className="w-6 h-6" />
                </div>
                <div className="mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Profesores
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Soy Docente
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Publica enlaces de Google Meet y notifica automáticamente por push a tus cursos.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Panel de profesor</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            </div>

            {/* Admin entry link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                <span>¿Eres Director o Administrador? Ir a /admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form Alumno */}
        {selectedRole === 'alumno' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedRole(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a elegir rol
            </button>

            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              {googleProfile ? (
                <img
                  src={googleProfile.picture}
                  alt={googleProfile.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900">Registro de Alumno</h2>
                <p className="text-xs text-slate-500">
                  {googleProfile
                    ? `Autenticado con Google como ${googleProfile.email}`
                    : 'Ingresa tu nombre y selecciona tu curso para sintonizar tus clases'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAlumno} className="mt-6 space-y-5">
              {/* Campo Nombre */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mateo Fernández"
                  value={alumnoNombre}
                  onChange={(e) => setAlumnoNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              {/* Selector de Curso (1ro a 6to de Secundaria) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Curso (Nivel Secundaria)
                </label>
                <select
                  value={alumnoCurso}
                  onChange={(e) => setAlumnoCurso(e.target.value as CursoSecundaria)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 bg-white outline-none transition font-medium"
                >
                  {CURSOS_SECUNDARIA.map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Solo verás los enlaces de Google Meet y comunicados asignados a tu grado.
                </p>
              </div>

              {/* OneSignal Tag Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
                <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Notificaciones Push con OneSignal
                  </p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Al guardar se vinculará tu etiqueta <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-blue-900 font-bold">curso: &ldquo;{alumnoCurso}&rdquo;</code> en OneSignal para avisarte al instante cuando tus profesores abran sala.
                  </p>
                </div>
              </div>

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={isSubmitting || !alumnoNombre.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Sincronizando con OneSignal...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar y Entrar a mi Aula</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Form Docente */}
        {selectedRole === 'docente' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedRole(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a elegir rol
            </button>

            <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
              {googleProfile ? (
                <img
                  src={googleProfile.picture}
                  alt={googleProfile.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <School className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900">Registro de Docente</h2>
                <p className="text-xs text-slate-500">
                  {googleProfile
                    ? `Autenticado con Google como ${googleProfile.email}`
                    : 'Configura tu materia y los cursos donde impartes clases virtuales'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitDocente} className="mt-6 space-y-5">
              {/* Campo Nombre */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre del Profesor(a)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Prof. Carlos Mendoza"
                  value={docenteNombre}
                  onChange={(e) => setDocenteNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              {/* Campo Materia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Materia / Asignatura
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Matemáticas, Física, etc."
                  value={docenteMateria}
                  onChange={(e) => setDocenteMateria(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
                {/* Sugerencias rápidas */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MATERIAS_SUGERIDAS.slice(0, 6).map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setDocenteMateria(mat)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition ${
                        docenteMateria === mat
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Múltiple de Cursos (1ro a 6to) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cursos Asignados (Selección múltiple)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCursos}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    {docenteCursos.length === CURSOS_SECUNDARIA.length
                      ? 'Deseleccionar'
                      : 'Todos los cursos'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CURSOS_SECUNDARIA.map((curso) => {
                    const isSelected = docenteCursos.includes(curso);
                    return (
                      <button
                        key={curso}
                        type="button"
                        onClick={() => toggleDocenteCurso(curso)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{curso}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Podrás publicar enlaces de Google Meet a cualquiera de estos cursos.
                </p>
              </div>

              {/* Botón Guardar Docente */}
              <button
                type="submit"
                disabled={isSubmitting || !docenteNombre.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Ingresando al panel...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Acceder al Panel Docente</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
