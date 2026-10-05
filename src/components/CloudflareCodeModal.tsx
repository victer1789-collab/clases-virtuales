import React, { useState } from 'react';
import { Check, Copy, Database, Server, Terminal, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareCodeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'worker' | 'deploy'>('worker');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const schemaContent = `-- Cloudflare D1 Database Schema: AulaSecundaria
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('alumno', 'docente', 'admin')),
    curso TEXT,
    materia TEXT,
    cursos_asignados TEXT,
    email TEXT,
    onesignal_player_id TEXT,
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clases (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    materia TEXT NOT NULL,
    curso TEXT NOT NULL,
    docente_id TEXT NOT NULL,
    docente_nombre TEXT NOT NULL,
    meet_url TEXT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estado TEXT DEFAULT 'programada' CHECK(estado IN ('en_vivo', 'programada', 'finalizada')),
    descripcion TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comunicados (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    curso_destino TEXT DEFAULT 'todos',
    autor_nombre TEXT NOT NULL,
    prioridad TEXT DEFAULT 'normal',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clases_curso ON clases(curso);
CREATE INDEX IF NOT EXISTS idx_comunicados_destino ON comunicados(curso_destino);`;

  const workerContent = `// Cloudflare Worker: API + OneSignal Push
export interface Env {
  DB: D1Database;
  ONESIGNAL_APP_ID?: string;
  ONESIGNAL_REST_API_KEY?: string;
}

const ONESIGNAL_APP_ID = "86d06c13-5e30-4fab-b011-3a651871b4a9";
const ONESIGNAL_REST_KEY = "w7i14wzktuqsewrcujlzazw25";

async function sendPush(appId: string, apiKey: string, title: string, msg: string, curso?: string, url?: string) {
  const payload: any = {
    app_id: appId,
    headings: { es: title },
    contents: { es: msg }
  };
  if (url) payload.url = url;
  if (curso && curso !== "todos") {
    payload.filters = [{ field: "tag", key: "curso", relation: "=", value: curso }];
  } else {
    payload.included_segments = ["Subscribed Users"];
  }

  return fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Basic \${apiKey}\`
    },
    body: JSON.stringify(payload)
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    // Rutas /api/clases, /api/comunicados, /api/stats, /api/usuarios
    // Revisa el archivo /worker.ts completo en la raíz del proyecto.
  }
};`;

  const deployGuide = `# Guía Rápida de Despliegue en Cloudflare D1 & Workers

1. Iniciar sesión en Cloudflare CLI:
   npx wrangler login

2. Crear la base de datos D1:
   npx wrangler d1 create aulasecundaria-db

3. Aplicar el esquema SQL a D1:
   npx wrangler d1 execute aulasecundaria-db --file=./schema.sql --remote

4. Configurar secretos de OneSignal en Worker:
   npx wrangler secret put ONESIGNAL_REST_API_KEY
   # Ingresar clave: w7i14wzktuqsewrcujlzazw25

5. Desplegar el Worker:
   npx wrangler deploy worker.ts

6. Vincular en el Frontend:
   En tu archivo .env define:
   VITE_API_URL="https://tu-worker.tu-cuenta.workers.dev"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Backend Cloudflare & OneSignal</h3>
              <p className="text-xs text-slate-400">
                Código fuente listo para producción: schema.sql y worker.ts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'worker'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            worker.ts (Worker + OneSignal REST)
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            schema.sql (Cloudflare D1)
          </button>

          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'deploy'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Guía de Despliegue
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'worker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">
                  Cloudflare Worker con disparo de Push OneSignal (Key w7i14wzktuqsewrcujlzazw25)
                </span>
                <button
                  onClick={() => copyToClipboard(workerContent, 'worker')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans transition"
                >
                  {copied === 'worker' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'worker' ? 'Copiado' : 'Copiar worker.ts'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 overflow-x-auto leading-relaxed">
                {workerContent}
              </pre>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">
                  Esquema D1 SQLite para usuarios, clases virtuales y comunicados
                </span>
                <button
                  onClick={() => copyToClipboard(schemaContent, 'schema')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans transition"
                >
                  {copied === 'schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'schema' ? 'Copiado' : 'Copiar schema.sql'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 overflow-x-auto leading-relaxed">
                {schemaContent}
              </pre>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">
                  Comandos para desplegar en tu cuenta de Cloudflare
                </span>
                <button
                  onClick={() => copyToClipboard(deployGuide, 'deploy')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans transition"
                >
                  {copied === 'deploy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'deploy' ? 'Copiado' : 'Copiar Guía'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-amber-200 overflow-x-auto leading-relaxed">
                {deployGuide}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Archivos creados en la raíz: <code>/schema.sql</code> y <code>/worker.ts</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
