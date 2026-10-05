import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { actualizarEstadoClase, crearClase, eliminarClase, getClases } from '../services/api';
import { Clase, CursoSecundaria, CURSOS_SECUNDARIA, Usuario } from '../types';

interface Props {
  docente: Usuario;
  onRefreshStats?: () => void;
}

export const DocentePanel: React.FC<Props> = ({ docente, onRefreshStats }) => {
  const cursosDisponibles = docente.cursosAsignados && docente.cursosAsignados.length > 0
    ? docente.cursosAsignados
    : CURSOS_SECUNDARIA;

  // Form State
  const [meetUrl, setMeetUrl] = useState('');
  const [cursoSeleccionado, setCursoSeleccionado] = useState<CursoSecundaria>(cursosDisponibles[0]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esEnVivo, setEsEnVivo] = useState(true);

  // UI state
  const [clases, setClases] = useState<Clase[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cargarClases = async () => {
    const todas = await getClases();
    // Clases creadas por este docente o relevantes
    const delDocente = todas.filter((c) => c.docenteId === docente.id || c.docenteNombre === docente.nombre);
    setClases(delDocente);
  };

  useEffect(() => {
    cargarClases();
  }, [docente]);

  // Generador de enlace de prueba rápido de Google Meet
  const handleGenerateSampleMeet = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const sample = `https://meet.google.com/${randPart(3)}-${randPart(4)}-${randPart(3)}`;
    setMeetUrl(sample);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetUrl.trim() || !cursoSeleccionado) return;

    // Normalizar URL si es necesario
    let finalUrl = meetUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    setIsSubmitting(true);

    const tituloFinal = titulo.trim() || `Clase de ${docente.materia || 'Secundaria'}`;

    try {
      await crearClase({
        titulo: tituloFinal,
        materia: docente.materia || 'Clase Virtual',
        curso: cursoSeleccionado,
        docenteId: docente.id,
        docenteNombre: docente.nombre,
        meetUrl: finalUrl,
        fechaHora: esEnVivo ? 'En vivo ahora' : 'Hoy, en 30 min',
        estado: esEnVivo ? 'en_vivo' : 'programada',
        descripcion: descripcion.trim() || undefined,
      });

      setSuccessBanner(
        `¡Clase publicada exitosamente para ${cursoSeleccionado}! Se envió la notificación Push por OneSignal a los alumnos.`
      );

      // Limpiar formulario
      setTitulo('');
      setDescripcion('');
      setMeetUrl('');

      await cargarClases();
      if (onRefreshStats) onRefreshStats();

      setTimeout(() => {
        setSuccessBanner(null);
      }, 6000);
    } catch (err) {
      console.error('Error publicando clase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEstado = async (clase: Clase) => {
    const nuevoEstado = clase.estado === 'en_vivo' ? 'finalizada' : 'en_vivo';
    await actualizarEstadoClase(clase.id, nuevoEstado);
    await cargarClases();
    if (onRefreshStats) onRefreshStats();
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Deseas eliminar esta clase?')) {
      await eliminarClase(id);
      await cargarClases();
      if (onRefreshStats) onRefreshStats();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Banner de Bienvenida Docente */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Panel del Profesor</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {docente.nombre}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 flex items-center gap-2">
              <span className="font-semibold text-white">{docente.materia}</span>
              <span>•</span>
              <span>{cursosDisponibles.length} cursos asignados</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15 text-xs">
            <Bell className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <p className="font-bold text-white">Disparo Push Activo</p>
              <p className="text-[11px] text-indigo-200">
                Al publicar, OneSignal notifica a los alumnos del curso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 font-medium">{successBanner}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario Principal de Publicación de Clase (Requisito Explícito) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Publicar Nueva Clase</h2>
                  <p className="text-xs text-slate-500">Crea el enlace de Google Meet para tu curso</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Google Meet
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Campo Enlace Google Meet (Requisito Explícito) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Enlace de Google Meet <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSampleMeet}
                    className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar enlace de prueba
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={meetUrl}
                    onChange={(e) => setMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition font-mono"
                  />
                  <Video className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Selector de Curso Destinatario (Requisito Explícito) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Enviar al Curso <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => setCursoSeleccionado(e.target.value as CursoSecundaria)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 bg-white outline-none transition font-medium"
                >
                  {cursosDisponibles.map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Solo los alumnos registrados en este grado recibirán la notificación y verán la tarjeta.
                </p>
              </div>

              {/* Tema o Título de la Clase */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tema / Título de la Clase
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={`Ej. Ecuaciones Cuadráticas y Práctica`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
              </div>

              {/* Instrucciones opcionales */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Indicaciones / Material Necesario (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Traer guía de ejercicios resuelta y calculadora..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition resize-none"
                />
              </div>

              {/* Estado En Vivo vs Programada */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEsEnVivo(true)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    esEnVivo
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Iniciar En Vivo Ahora
                </button>

                <button
                  type="button"
                  onClick={() => setEsEnVivo(false)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                    !esEnVivo
                      ? 'bg-blue-50 border-blue-500 text-blue-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Programar para Hoy
                </button>
              </div>

              {/* Botón de Publicar (Requisito Explícito) */}
              <button
                type="submit"
                disabled={isSubmitting || !meetUrl.trim()}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publicando y Notificando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publicar Clase en {cursoSeleccionado}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Clases Publicadas por el Docente */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Mis Clases Publicadas ({clases.length})
            </h3>
            <span className="text-xs text-slate-500">Historial de sesiones</span>
          </div>

          {clases.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No hay clases activas publicadas</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Completa el formulario a la izquierda para enviar el primer link de Google Meet a tus alumnos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clases.map((clase) => (
                <div
                  key={clase.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                            ? 'EN VIVO AHORA'
                            : clase.estado === 'programada'
                            ? 'PROGRAMADA'
                            : 'FINALIZADA'}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {clase.curso}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{clase.titulo}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleEstado(clase)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-600 transition"
                      >
                        {clase.estado === 'en_vivo' ? 'Finalizar' : 'Reanudar'}
                      </button>
                      <button
                        onClick={() => handleEliminar(clase.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Eliminar clase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {clase.descripcion && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {clase.descripcion}
                    </p>
                  )}

                  {/* Google Meet Link Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-mono text-slate-500 truncate max-w-xs">
                      {clase.meetUrl}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(clase.meetUrl, clase.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1 transition"
                      >
                        {copiedId === clase.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === clase.id ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <a
                        href={clase.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                      >
                        <Video className="w-3 h-3" />
                        <span>Abrir Meet</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
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
