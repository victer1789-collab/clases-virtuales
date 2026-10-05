import { Clase, Comunicado, CursoSecundaria, RolUsuario, Usuario } from '../types';
import { INITIAL_CLASES, INITIAL_COMUNICADOS, INITIAL_USUARIOS } from './mockData';
import { broadcastLocalPush } from './onesignal';

const STORAGE_KEYS = {
  CLASES: 'aulasec_clases_v1',
  COMUNICADOS: 'aulasec_comunicados_v1',
  USUARIOS: 'aulasec_usuarios_v1',
  CURRENT_USER: 'aulasec_current_user_v1',
};

// Obtener la URL del backend si el usuario lo conecta a Cloudflare
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function loadFromStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// ---------------------------------------------------------------------------
// USUARIO ACTUAL / PERFIL
// ---------------------------------------------------------------------------
export function getCurrentUser(): Usuario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: Usuario | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      // También persistir o actualizar en la lista de usuarios
      const usuarios = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
      const idx = usuarios.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        usuarios[idx] = user;
      } else {
        usuarios.push(user);
      }
      saveToStorage(STORAGE_KEYS.USUARIOS, usuarios);
    }
  } catch (err) {
    console.error('Error setting current user:', err);
  }
}

// ---------------------------------------------------------------------------
// CLASES VIRTUALES
// ---------------------------------------------------------------------------
export async function getClases(curso?: CursoSecundaria): Promise<Clase[]> {
  // Si hay una API remota configurada en Cloudflare:
  if (API_BASE_URL) {
    try {
      const url = new URL(`${API_BASE_URL}/api/clases`);
      if (curso) url.searchParams.set('curso', curso);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return data.clases || [];
      }
    } catch (e) {
      console.warn('Fallo al conectar con Cloudflare API, usando almacenamiento local:', e);
    }
  }

  // Fallback Local Storage
  const todas = loadFromStorage<Clase[]>(STORAGE_KEYS.CLASES, INITIAL_CLASES);
  if (!curso) return todas;
  return todas.filter((c) => c.curso === curso);
}

export async function crearClase(
  nueva: Omit<Clase, 'id' | 'creadoEn'>
): Promise<{ success: boolean; clase: Clase }> {
  const id = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const clase: Clase = {
    ...nueva,
    id,
    creadoEn: new Date().toISOString(),
  };

  // 1. Guardar en almacenamiento local
  const clases = loadFromStorage<Clase[]>(STORAGE_KEYS.CLASES, INITIAL_CLASES);
  clases.unshift(clase);
  saveToStorage(STORAGE_KEYS.CLASES, clases);

  // 2. Transmitir simulación de Push OneSignal en el navegador
  broadcastLocalPush({
    titulo: `🔔 ¡Nueva Clase de ${clase.materia}!`,
    mensaje: `${clase.docenteNombre} te invita a Google Meet para ${clase.curso}.`,
    curso: clase.curso,
    url: clase.meetUrl,
  });

  // 3. Si hay backend Cloudflare Worker configurado, enviar petición HTTP real
  if (API_BASE_URL) {
    try {
      await fetch(`${API_BASE_URL}/api/clases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clase),
      });
    } catch (err) {
      console.warn('Worker remoto no disponible:', err);
    }
  }

  return { success: true, clase };
}

export async function actualizarEstadoClase(
  id: string,
  estado: Clase['estado']
): Promise<boolean> {
  const clases = loadFromStorage<Clase[]>(STORAGE_KEYS.CLASES, INITIAL_CLASES);
  const target = clases.find((c) => c.id === id);
  if (target) {
    target.estado = estado;
    saveToStorage(STORAGE_KEYS.CLASES, clases);
    return true;
  }
  return false;
}

export async function eliminarClase(id: string): Promise<boolean> {
  const clases = loadFromStorage<Clase[]>(STORAGE_KEYS.CLASES, INITIAL_CLASES);
  const filtradas = clases.filter((c) => c.id !== id);
  saveToStorage(STORAGE_KEYS.CLASES, filtradas);
  return true;
}

// ---------------------------------------------------------------------------
// COMUNICADOS
// ---------------------------------------------------------------------------
export async function getComunicados(curso?: CursoSecundaria): Promise<Comunicado[]> {
  if (API_BASE_URL) {
    try {
      const url = new URL(`${API_BASE_URL}/api/comunicados`);
      if (curso) url.searchParams.set('curso', curso);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        return data.comunicados || [];
      }
    } catch {}
  }

  const comunicados = loadFromStorage<Comunicado[]>(
    STORAGE_KEYS.COMUNICADOS,
    INITIAL_COMUNICADOS
  );

  if (!curso) return comunicados;
  return comunicados.filter((c) => c.cursoDestino === 'todos' || c.cursoDestino === curso);
}

export async function crearComunicado(
  nuevo: Omit<Comunicado, 'id' | 'creadoEn'>
): Promise<{ success: boolean; comunicado: Comunicado }> {
  const id = `com-${Date.now()}`;
  const comunicado: Comunicado = {
    ...nuevo,
    id,
    creadoEn: new Date().toISOString(),
  };

  const comunicados = loadFromStorage<Comunicado[]>(
    STORAGE_KEYS.COMUNICADOS,
    INITIAL_COMUNICADOS
  );
  comunicados.unshift(comunicado);
  saveToStorage(STORAGE_KEYS.COMUNICADOS, comunicados);

  // Broadcast push
  broadcastLocalPush({
    titulo: `📢 Aviso: ${comunicado.titulo}`,
    mensaje: comunicado.mensaje,
    curso: comunicado.cursoDestino,
  });

  if (API_BASE_URL) {
    try {
      await fetch(`${API_BASE_URL}/api/comunicados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comunicado),
      });
    } catch {}
  }

  return { success: true, comunicado };
}

export async function eliminarComunicado(id: string): Promise<boolean> {
  const comunicados = loadFromStorage<Comunicado[]>(
    STORAGE_KEYS.COMUNICADOS,
    INITIAL_COMUNICADOS
  );
  const filtrados = comunicados.filter((c) => c.id !== id);
  saveToStorage(STORAGE_KEYS.COMUNICADOS, filtrados);
  return true;
}

// ---------------------------------------------------------------------------
// USUARIOS Y ESTADÍSTICAS
// ---------------------------------------------------------------------------
export async function getUsuarios(rol?: RolUsuario): Promise<Usuario[]> {
  const usuarios = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  if (!rol) return usuarios;
  return usuarios.filter((u) => u.rol === rol);
}

export async function guardarUsuario(usuario: Usuario): Promise<Usuario> {
  const usuarios = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  const idx = usuarios.findIndex((u) => u.id === usuario.id);
  if (idx >= 0) {
    usuarios[idx] = usuario;
  } else {
    usuarios.push(usuario);
  }
  saveToStorage(STORAGE_KEYS.USUARIOS, usuarios);
  return usuario;
}

export async function eliminarUsuario(id: string): Promise<boolean> {
  const usuarios = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  const filtrados = usuarios.filter((u) => u.id !== id);
  saveToStorage(STORAGE_KEYS.USUARIOS, filtrados);
  return true;
}

export async function getStats() {
  const usuarios = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  const clases = loadFromStorage<Clase[]>(STORAGE_KEYS.CLASES, INITIAL_CLASES);
  const comunicados = loadFromStorage<Comunicado[]>(
    STORAGE_KEYS.COMUNICADOS,
    INITIAL_COMUNICADOS
  );

  const totalAlumnos = usuarios.filter((u) => u.rol === 'alumno').length;
  const totalDocentes = usuarios.filter((u) => u.rol === 'docente').length;
  const clasesActivas = clases.filter((c) => c.estado !== 'finalizada').length;
  const totalComunicados = comunicados.length;

  return {
    totalAlumnos,
    totalDocentes,
    clasesActivas,
    totalComunicados,
  };
}
