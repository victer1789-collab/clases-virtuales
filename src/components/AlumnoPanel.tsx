import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  GraduationCap,
  Layers,
  MessageSquare,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import { getClases, getComunicados } from '../services/api';
import { sendOneSignalCourseTag } from '../services/onesignal';
import { Clase, Comunicado, CursoSecundaria, Usuario } from '../types';

interface Props {
  alumno: Usuario;
  onChangeProfile: () => void;
}

export const AlumnoPanel: React.FC<Props> = ({ alumno, onChangeProfile }) => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'en_vivo' | 'programadas'>('todas');
  const [tagStatus, setTagStatus] = useState<string | null>(null);

  const curso = alumno.curso || ('3ro de Secundaria' as CursoSecundaria);

  const cargarDatos = async () => {
    const clasesCurso = await getClases(curso);
    const comunicadosCurso = await getComunicados(curso);
    setClases(clasesCurso);
    setComunicados(comunicadosCurso);
  };

  useEffect(() => {
    cargarDatos();
  }, [curso]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReSyncTag = async () => {
    setTagStatus('Sincronizando con OneSignal...');
    const res = await sendOneSignalCourseTag(curso);
    setTagStatus(res.message);
    setTimeout(() => setTagStatus(null), 3500);
  };

  const clasesFiltradas = clases.filter((c) => {
    if (filtro === 'en_vivo') return c.estado === 'en_vivo';
    if (filtro === 'programadas') return c.estado === 'programada';
    return true;
  });

  const claseEnVivoDestacada = clases.find((c) => c.estado === 'en_vivo');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Student Welcome Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Estudiante de Secundaria</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              ¡Hola, {alumno.nombre}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2">
              <span className="font-bold text-white bg-blue-500/40 px-2 py-0.5 rounded-md">
                {curso}
              </span>
              <span>•</span>
              <span>Tablero de Clases de Google Meet</span>
            </p>
          </div>

          {/* OneSignal Sync status info */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/15 text-xs">
              <Bell className="w-4 h-4 text-emerald-300 shrink-0" />
              <div>
                <p className="font-bold text-white leading-tight">OneSignal Sincronizado</p>
                <p className="text-[10px] text-blue-200">
                  Tag: <code className="font-mono bg-white/10 px-1 rounded">curso: {curso}</code>
                </p>
              </div>
            </div>

            <button
              onClick={handleReSyncTag}
              className="text-[11px] text-blue-100 hover:text-white underline hover:no-underline font-medium self-start sm:self-end"
            >
              Re-vincular notificaciones
            </button>
          </div>
        </div>
      </div>

      {tagStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{tagStatus}</span>
        </div>
      )}

      {/* Featured Live Class Hero Banner if currently active */}
      {claseEnVivoDestacada && (
        <div className="rounded-3xl bg-emerald-600 text-white p-5 sm:p-6 shadow-lg border border-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-100 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  EN VIVO AHORA MISMO
                </span>
                <span className="text-xs font-semibold text-emerald-100">
                  {claseEnVivoDestacada.materia}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {claseEnVivoDestacada.titulo}
              </h2>
              <p className="text-xs text-emerald-100">
                Profesor: <strong className="text-white">{claseEnVivoDestacada.docenteNombre}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={claseEnVivoDestacada.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4 text-emerald-700" />
              <span>Entrar a la Clase (Meet)</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-emerald-700" />
            </a>
          </div>
        </div>
      )}

      {/* Main Grid: Meet Classes Cards (Requisito Explícito del Dashboard del Alumno) */}
      <div className="space-y-4">
        {/* Bar: Title and Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Clases de {curso}
            </h2>
            <p className="text-xs text-slate-500">
              Enlaces directos de Google Meet programados para tu grado escolar
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtro === 'todas' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Todas ({clases.length})
            </button>
            <button
              onClick={() => setFiltro('en_vivo')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filtro === 'en_vivo' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              En vivo ({clases.filter((c) => c.estado === 'en_vivo').length})
            </button>
            <button
              onClick={() => setFiltro('programadas')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtro === 'programadas' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Programadas ({clases.filter((c) => c.estado === 'programada').length})
            </button>
          </div>
        </div>

        {/* Empty state */}
        {clasesFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No hay clases virtuales para este filtro
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cuando tus profesores publiquen un enlace de Google Meet para {curso}, aparecerá de
              inmediato en este tablero y recibirás una notificación push en tu celular.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clasesFiltradas.map((clase) => (
              <div
                key={clase.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Subject & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold tracking-tight">
                      {clase.materia}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        clase.estado === 'en_vivo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : clase.estado === 'programada'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {clase.estado === 'en_vivo' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      {clase.estado === 'en_vivo'
                        ? 'En vivo'
                        : clase.estado === 'programada'
                        ? clase.fechaHora
                        : 'Finalizada'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {clase.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{clase.docenteNombre}</span>
                    </p>
                  </div>

                  {clase.descripcion && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                      {clase.descripcion}
                    </p>
                  )}
                </div>

                {/* Card Bottom: Google Meet Action & Copy */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[200px]">{clase.meetUrl}</span>
                    <button
                      onClick={() => handleCopy(clase.meetUrl, clase.id)}
                      className="text-slate-500 hover:text-slate-800 p-1 rounded-md transition flex items-center gap-1"
                      title="Copiar enlace"
                    >
                      {copiedId === clase.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === clase.id ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* Botón principal Unirse a Google Meet (Adaptado para celulares) */}
                  <a
                    href={clase.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Unirse a Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secondary Section: Comunicados del Colegio / Dirección */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Avisos y Comunicados para {curso}
              </h2>
              <p className="text-xs text-slate-500">
                Información oficial enviada por la dirección y tus profesores
              </p>
            </div>
          </div>
        </div>

        {comunicados.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 text-xs text-slate-500 text-center">
            No hay comunicados recientes para tu curso.
          </div>
        ) : (
          <div className="space-y-3">
            {comunicados.map((com) => (
              <div
                key={com.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        com.prioridad === 'urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : com.prioridad === 'normal'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {com.prioridad === 'urgente' ? 'Urgente' : 'Informativo'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dirigido a: <strong>{com.cursoDestino === 'todos' ? 'Todos los Cursos' : com.cursoDestino}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(com.creadoEn).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{com.titulo}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{com.mensaje}</p>

                <p className="text-[11px] text-slate-400 pt-1">
                  Publicado por: <span className="font-semibold text-slate-600">{com.autorNombre}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
