export type RolUsuario = 'alumno' | 'docente' | 'admin';

export type CursoSecundaria =
  | '1ro de Secundaria'
  | '2do de Secundaria'
  | '3ro de Secundaria'
  | '4to de Secundaria'
  | '5to de Secundaria'
  | '6to de Secundaria';

export const CURSOS_SECUNDARIA: CursoSecundaria[] = [
  '1ro de Secundaria',
  '2do de Secundaria',
  '3ro de Secundaria',
  '4to de Secundaria',
  '5to de Secundaria',
  '6to de Secundaria',
];

export const MATERIAS_SUGERIDAS = [
  'Matemáticas',
  'Física',
  'Química',
  'Biología y Ciencias Naturales',
  'Lenguaje y Literatura',
  'Historia y Geografía',
  'Inglés',
  'Filosofía y Psicología',
  'Computación e Informática',
  'Educación Artística',
  'Educación Física',
];

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  curso?: CursoSecundaria; // Requerido para alumno
  materia?: string; // Para docente
  cursosAsignados?: CursoSecundaria[]; // Para docente
  email?: string;
  onesignalPlayerId?: string;
  creadoEn?: string;
}

export type EstadoClase = 'en_vivo' | 'programada' | 'finalizada';

export interface Clase {
  id: string;
  titulo: string;
  materia: string;
  curso: CursoSecundaria;
  docenteId: string;
  docenteNombre: string;
  meetUrl: string;
  fechaHora: string; // ISO String o formato legible
  estado: EstadoClase;
  descripcion?: string;
  creadoEn: string;
}

export type PrioridadComunicado = 'baja' | 'normal' | 'urgente';

export interface Comunicado {
  id: string;
  titulo: string;
  mensaje: string;
  cursoDestino: CursoSecundaria | 'todos';
  autorNombre: string;
  prioridad: PrioridadComunicado;
  creadoEn: string;
}

export interface NotificacionPushLog {
  id: string;
  timestamp: string;
  titulo: string;
  mensaje: string;
  cursoDestino: string;
  url?: string;
  origen: 'docente' | 'admin' | 'sistema';
}
