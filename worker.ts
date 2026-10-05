/**
 * Cloudflare Worker: AulaSecundaria API + OneSignal Push Notifications
 * 
 * Configuración requerida en wrangler.toml:
 * 
 * name = "aulasecundaria-backend"
 * main = "worker.ts"
 * compatibility_date = "2024-01-01"
 * 
 * [[d1_databases]]
 * binding = "DB"
 * database_name = "aulasecundaria-db"
 * database_id = "<TU_DATABASE_ID>"
 * 
 * [vars]
 * ONESIGNAL_APP_ID = "86d06c13-5e30-4fab-b011-3a651871b4a9"
 * ONESIGNAL_REST_API_KEY = "w7i14wzktuqsewrcujlzazw25"
 */

// Declaración de compatibilidad para D1Database si @cloudflare/workers-types no está instalado
type D1Database = any;

export interface Env {
  DB: D1Database;
  ONESIGNAL_APP_ID?: string;
  ONESIGNAL_REST_API_KEY?: string;
}

const DEFAULT_ONESIGNAL_APP_ID = "86d06c13-5e30-4fab-b011-3a651871b4a9";
const DEFAULT_ONESIGNAL_REST_KEY = "w7i14wzktuqsewrcujlzazw25";

// CORS Headers para permitir llamadas desde el frontend web y PWA
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Disparar Notificación Push a través de la API REST de OneSignal
 */
async function sendOneSignalNotification(params: {
  appId: string;
  apiKey: string;
  title: string;
  message: string;
  targetCourse?: string; // Si se omite o es 'todos', se envía a toda la comunidad
  url?: string;
  data?: Record<string, unknown>;
}) {
  const { appId, apiKey, title, message, targetCourse, url, data } = params;

  const payload: Record<string, unknown> = {
    app_id: appId,
    headings: { es: title, en: title },
    contents: { es: message, en: message },
    data: data || {},
  };

  if (url) {
    payload.url = url;
    payload.web_url = url;
  }

  // Filtrado por etiquetas de OneSignal
  if (targetCourse && targetCourse !== "todos") {
    payload.filters = [
      { field: "tag", key: "curso", relation: "=", value: targetCourse },
    ];
  } else {
    payload.included_segments = ["Subscribed Users", "Total Subscriptions"];
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return { ok: response.ok, status: response.status, result };
  } catch (err: any) {
    console.error("Error al enviar notificación push OneSignal:", err);
    return { ok: false, error: err.message };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Manejo de preflight OPTIONS para CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const appId = env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID;
    const apiKey = env.ONESIGNAL_REST_API_KEY || DEFAULT_ONESIGNAL_REST_KEY;

    try {
      // ----------------------------------------------------------------------
      // RUTA: GET /api/stats (Estadísticas del panel administrativo)
      // ----------------------------------------------------------------------
      if (pathname === "/api/stats" && request.method === "GET") {
        const totalAlumnos = (await env.DB.prepare(
          "SELECT COUNT(*) as count FROM usuarios WHERE rol = 'alumno'"
        ).first()) as { count: number } | null;

        const totalDocentes = (await env.DB.prepare(
          "SELECT COUNT(*) as count FROM usuarios WHERE rol = 'docente'"
        ).first()) as { count: number } | null;

        const totalClases = (await env.DB.prepare(
          "SELECT COUNT(*) as count FROM clases WHERE estado != 'finalizada'"
        ).first()) as { count: number } | null;

        const totalComunicados = (await env.DB.prepare(
          "SELECT COUNT(*) as count FROM comunicados"
        ).first()) as { count: number } | null;

        return jsonResponse({
          success: true,
          stats: {
            alumnos: totalAlumnos?.count || 0,
            docentes: totalDocentes?.count || 0,
            clasesActivas: totalClases?.count || 0,
            comunicados: totalComunicados?.count || 0,
          },
        });
      }

      // ----------------------------------------------------------------------
      // RUTA: GET /api/clases (Listar clases virtuales)
      // Query params opcionales: ?curso=... &docenteId=...
      // ----------------------------------------------------------------------
      if (pathname === "/api/clases" && request.method === "GET") {
        const curso = searchParams.get("curso");
        const docenteId = searchParams.get("docenteId");

        let query = "SELECT * FROM clases";
        const conditions: string[] = [];
        const params: any[] = [];

        if (curso) {
          conditions.push("curso = ?");
          params.push(curso);
        }
        if (docenteId) {
          conditions.push("docente_id = ?");
          params.push(docenteId);
        }

        if (conditions.length > 0) {
          query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY fecha_hora DESC";

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ success: true, clases: results });
      }

      // ----------------------------------------------------------------------
      // RUTA: POST /api/clases (Crear y publicar nueva clase + Push Notification)
      // ----------------------------------------------------------------------
      if (pathname === "/api/clases" && request.method === "POST") {
        const body = (await request.json()) as any;
        const {
          titulo,
          materia,
          curso,
          docente_id,
          docente_nombre,
          meet_url,
          fecha_hora,
          descripcion,
          estado = "en_vivo",
        } = body;

        if (!titulo || !curso || !meet_url) {
          return jsonResponse(
            { success: false, error: "Título, curso y enlace de Google Meet son requeridos" },
            400
          );
        }

        const id = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const fechaValida = fecha_hora || new Date().toISOString();

        // 1. Guardar en base de datos D1
        await env.DB.prepare(
          `INSERT INTO clases (id, titulo, materia, curso, docente_id, docente_nombre, meet_url, fecha_hora, estado, descripcion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            titulo,
            materia || "Clase Virtual",
            curso,
            docente_id || "doc-anon",
            docente_nombre || "Docente",
            meet_url,
            fechaValida,
            estado,
            descripcion || ""
          )
          .run();

        // 2. Disparar Notificación Push OneSignal segmentada al curso correspondiente
        const pushResult = await sendOneSignalNotification({
          appId,
          apiKey,
          title: `¡Clase de ${materia || "Secundaria"} para ${curso}!`,
          message: `${docente_nombre}: ${titulo}. Toca aquí para unirte a Google Meet.`,
          targetCourse: curso,
          url: meet_url,
          data: { claseId: id, meet_url, tipo: "clase_meet", curso },
        });

        return jsonResponse({
          success: true,
          clase: { id, titulo, materia, curso, docente_nombre, meet_url, fecha_hora: fechaValida, estado },
          notificacion: pushResult,
        });
      }

      // ----------------------------------------------------------------------
      // RUTA: GET /api/comunicados (Listar comunicados de la institución)
      // ----------------------------------------------------------------------
      if (pathname === "/api/comunicados" && request.method === "GET") {
        const curso = searchParams.get("curso");
        let query = "SELECT * FROM comunicados";
        const params: any[] = [];

        if (curso) {
          query += " WHERE curso_destino = 'todos' OR curso_destino = ?";
          params.push(curso);
        }

        query += " ORDER BY creado_en DESC LIMIT 50";

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ success: true, comunicados: results });
      }

      // ----------------------------------------------------------------------
      // RUTA: POST /api/comunicados (Publicar comunicado + Push Notification)
      // ----------------------------------------------------------------------
      if (pathname === "/api/comunicados" && request.method === "POST") {
        const body = (await request.json()) as any;
        const {
          titulo,
          mensaje,
          curso_destino = "todos",
          autor_nombre = "Dirección Académica",
          prioridad = "normal",
        } = body;

        if (!titulo || !mensaje) {
          return jsonResponse(
            { success: false, error: "Título y mensaje son requeridos" },
            400
          );
        }

        const id = `com-${Date.now()}`;

        await env.DB.prepare(
          `INSERT INTO comunicados (id, titulo, mensaje, curso_destino, autor_nombre, prioridad)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(id, titulo, mensaje, curso_destino, autor_nombre, prioridad)
          .run();

        // Disparar push OneSignal
        const pushResult = await sendOneSignalNotification({
          appId,
          apiKey,
          title: `📢 Comunicado: ${titulo}`,
          message: mensaje,
          targetCourse: curso_destino,
          data: { comunicadoId: id, prioridad },
        });

        return jsonResponse({
          success: true,
          comunicado: { id, titulo, mensaje, curso_destino, autor_nombre, prioridad },
          notificacion: pushResult,
        });
      }

      // ----------------------------------------------------------------------
      // RUTA: POST /api/usuarios (Guardar o actualizar perfil)
      // ----------------------------------------------------------------------
      if (pathname === "/api/usuarios" && request.method === "POST") {
        const body = (await request.json()) as any;
        const { id, nombre, rol, curso, materia, cursos_asignados, email, onesignal_player_id } = body;

        if (!nombre || !rol) {
          return jsonResponse({ success: false, error: "Nombre y rol son requeridos" }, 400);
        }

        const userId = id || `usr-${Date.now()}`;
        const cursosJson = cursos_asignados ? JSON.stringify(cursos_asignados) : null;

        await env.DB.prepare(
          `INSERT INTO usuarios (id, nombre, rol, curso, materia, cursos_asignados, email, onesignal_player_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             nombre = excluded.nombre,
             curso = excluded.curso,
             materia = excluded.materia,
             cursos_asignados = excluded.cursos_asignados,
             email = excluded.email,
             onesignal_player_id = excluded.onesignal_player_id,
             actualizado_en = CURRENT_TIMESTAMP`
        )
          .bind(userId, nombre, rol, curso || null, materia || null, cursosJson, email || null, onesignal_player_id || null)
          .run();

        return jsonResponse({
          success: true,
          usuario: { id: userId, nombre, rol, curso, materia, cursos_asignados },
        });
      }

      // ----------------------------------------------------------------------
      // RUTA: GET /api/usuarios (Listar alumnos y docentes)
      // ----------------------------------------------------------------------
      if (pathname === "/api/usuarios" && request.method === "GET") {
        const rol = searchParams.get("rol");
        let query = "SELECT id, nombre, rol, curso, materia, cursos_asignados, email, creado_en FROM usuarios";
        const params: any[] = [];

        if (rol) {
          query += " WHERE rol = ?";
          params.push(rol);
        }

        query += " ORDER BY creado_en DESC";

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ success: true, usuarios: results });
      }

      // Ruta no encontrada
      return jsonResponse({ error: "Endpoint no encontrado", path: pathname }, 404);
    } catch (error: any) {
      console.error("Worker Error:", error);
      return jsonResponse(
        { success: false, error: error.message || "Error interno del servidor" },
        500
      );
    }
  },
};
