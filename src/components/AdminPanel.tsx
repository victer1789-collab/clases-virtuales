import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Code2,
  GraduationCap,
  Megaphone,
  School,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import {
  crearComunicado,
  eliminarComunicado,
  eliminarUsuario,
  getComunicados,
  getStats,
  getUsuarios,
} from '../services/api';
import {
  Comunicado,
  CURSOS_SECUNDARIA,
  CursoSecundaria,
  PrioridadComunicado,
  Usuario,
} from '../types';

interface Props {
  onOpenCloudflareModal: () => void;
  onSelectUserForTesting?: (u: Usuario) => void;
}

export const AdminPanel: React.FC<Props> = ({
  onOpenCloudflareModal,
  onSelectUserForTesting,
}) => {
  // Stats
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalDocentes: 0,
    clasesActivas: 0,
    totalComunicados: 0,
  });

  // Form Comunicado General
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cursoDestino, setCursoDestino] = useState<string>('todos');
  const [prioridad, setPrioridad] = useState<PrioridadComunicado>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Lists
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [activeTab, setActiveTab] = useState<'comunicados' | 'usuarios'>('comunicados');

  const cargarTodo = async () => {
    const s = await getStats();
    setStats(s);
    const c = await getComunicados();
    setComunicados(c);
    const u = await getUsuarios();
    setUsuarios(u);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleCrearComunicado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensaje.trim()) return;

    setIsSubmitting(true);

    try {
      await crearComunicado({
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        cursoDestino: cursoDestino as any,
        autorNombre: 'Dirección General de Secundaria',
        prioridad,
      });

      setStatusFeedback(
        `Comunicado emitido correctamente. Notificación Push OneSignal enviada a ${
          cursoDestino === 'todos' ? 'todos los alumnos' : cursoDestino
        }.`
      );

      setTitulo('');
      setMensaje('');
      setCursoDestino('todos');
      await cargarTodo();

      setTimeout(() => {
        setStatusFeedback(null);
      }, 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarComunicado = async (id: string) => {
    if (window.confirm('¿Deseas eliminar este comunicado?')) {
      await eliminarComunicado(id);
      await cargarTodo();
    }
  };

  const handleEliminarUsuario = async (id: string) => {
    if (window.confirm('¿Deseas eliminar este usuario de la base de datos?')) {
      await eliminarUsuario(id);
      await cargarTodo();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Ruta /admin • Dirección y Administración</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Panel Administrativo de AulaSecundaria
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Control de métricas institucionales, comunicados masivos y alumnos.
            </p>
          </div>

          <button
            onClick={onOpenCloudflareModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition self-start sm:self-center"
          >
            <Code2 className="w-4 h-4" />
            <span>Código Cloudflare & Worker</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas (Requisito Explícito: Total Alumnos y Total Docentes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Alumnos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Alumnos
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalAlumnos}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>1ro a 6to de Secundaria</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Docentes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Docentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalDocentes}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              Profesores con Meet asignado
            </p>
          </div>
        </div>

        {/* Card 3: Clases Activas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Clases Virtuales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.clasesActivas}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Salas Google Meet disponibles
            </p>
          </div>
        </div>

        {/* Card 4: Total Comunicados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Comunicados
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalComunicados}
            </p>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Avisos emitidos vía OneSignal
            </p>
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Grid: Formulario Comunicados Generales + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Comunicados Generales (Requisito Explícito) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Emitir Comunicado General
                </h2>
                <p className="text-xs text-slate-500">
                  Envía un anuncio que llegará por notificación push OneSignal
                </p>
              </div>
            </div>

            <form onSubmit={handleCrearComunicado} className="mt-5 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Título del Comunicado <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Inicio de Evaluaciones Trimestrales"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              {/* Área de Texto para Comunicados Generales (Requisito Explícito) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mensaje del Comunicado <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe el comunicado oficial para la comunidad estudiantil..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition resize-none leading-relaxed"
                />
              </div>

              {/* Destinatarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Destinatarios
                  </label>
                  <select
                    value={cursoDestino}
                    onChange={(e) => setCursoDestino(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-xs text-slate-900 bg-white outline-none transition font-medium"
                  >
                    <option value="todos">Todos los Cursos (1ro a 6to)</option>
                    {CURSOS_SECUNDARIA.map((curso) => (
                      <option key={curso} value={curso}>
                        Solo {curso}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as PrioridadComunicado)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-xs text-slate-900 bg-white outline-none transition font-medium"
                  >
                    <option value="normal">Normal / Informativo</option>
                    <option value="urgente">Urgente / Importante</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              {/* OneSignal info banner */}
              <div className="p-3 rounded-xl bg-purple-50 text-purple-900 text-[11px] flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  OneSignal disparará la notificación en los dispositivos de los alumnos correspondientes.
                </span>
              </div>

              {/* Botón Publicar */}
              <button
                type="submit"
                disabled={isSubmitting || !titulo.trim() || !mensaje.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publicando comunicado...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publicar Comunicado</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right side: Comunicados emitidos & Directorio de Alumnos/Docentes */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('comunicados')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'comunicados'
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Comunicados Emitidos ({comunicados.length})
              </button>
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'usuarios'
                    ? 'bg-purple-100 text-purple-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Usuarios Registrados ({usuarios.length})
              </button>
            </div>
          </div>

          {activeTab === 'comunicados' && (
            <div className="space-y-3">
              {comunicados.map((com) => (
                <div
                  key={com.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          com.prioridad === 'urgente'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {com.prioridad}
                      </span>
                      <span className="text-xs text-slate-500">
                        Destino:{' '}
                        <strong>{com.cursoDestino === 'todos' ? 'Todos' : com.cursoDestino}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleEliminarComunicado(com.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Eliminar comunicado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{com.titulo}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{com.mensaje}</p>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>{com.autorNombre}</span>
                    <span>{new Date(com.creadoEn).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="space-y-2.5">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        u.rol === 'docente'
                          ? 'bg-indigo-100 text-indigo-700'
                          : u.rol === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.rol === 'docente' ? (
                        <School className="w-4 h-4" />
                      ) : u.rol === 'admin' ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {u.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="capitalize font-semibold text-slate-700">{u.rol}</span>
                        {u.curso && ` • ${u.curso}`}
                        {u.materia && ` • ${u.materia}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onSelectUserForTesting && (
                      <button
                        onClick={() => onSelectUserForTesting(u)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                      >
                        Probar rol
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminarUsuario(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
