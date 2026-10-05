-- ============================================================================
-- Cloudflare D1 Database Schema: AulaSecundaria
-- Dialecto: SQLite (compatible con Cloudflare D1)
-- ============================================================================

-- Tabla de Usuarios (Alumnos, Docentes y Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('alumno', 'docente', 'admin')),
    curso TEXT,                         -- Para alumnos: '1ro de Secundaria' ... '6to de Secundaria'
    materia TEXT,                       -- Para docentes: ej. 'Matemáticas'
    cursos_asignados TEXT,             -- JSON Array para docentes: ej. '["1ro de Secundaria","2do de Secundaria"]'
    email TEXT,
    onesignal_player_id TEXT,
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clases Virtuales (Google Meet)
CREATE TABLE IF NOT EXISTS clases (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    materia TEXT NOT NULL,
    curso TEXT NOT NULL,                -- Curso destinatario: '1ro de Secundaria' ... '6to de Secundaria'
    docente_id TEXT NOT NULL,
    docente_nombre TEXT NOT NULL,
    meet_url TEXT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estado TEXT DEFAULT 'programada' CHECK(estado IN ('en_vivo', 'programada', 'finalizada')),
    descripcion TEXT,
    notificacion_enviada INTEGER DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de Comunicados Generales y Específicos
CREATE TABLE IF NOT EXISTS comunicados (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    curso_destino TEXT DEFAULT 'todos', -- 'todos' o curso específico '1ro de Secundaria'
    autor_id TEXT,
    autor_nombre TEXT NOT NULL,
    prioridad TEXT DEFAULT 'normal' CHECK(prioridad IN ('baja', 'normal', 'urgente')),
    notificacion_enviada INTEGER DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_curso ON usuarios(curso);
CREATE INDEX IF NOT EXISTS idx_clases_curso ON clases(curso);
CREATE INDEX IF NOT EXISTS idx_clases_estado ON clases(estado);
CREATE INDEX IF NOT EXISTS idx_clases_fecha ON clases(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comunicados_destino ON comunicados(curso_destino);
CREATE INDEX IF NOT EXISTS idx_comunicados_creado ON comunicados(creado_en DESC);

-- ============================================================================
-- Datos iniciales de demostración (Seed Data)
-- ============================================================================

INSERT OR IGNORE INTO usuarios (id, nombre, rol, materia, cursos_asignados, email) VALUES
('doc-1', 'Prof. Carlos Mendoza', 'docente', 'Matemáticas y Geometría', '["1ro de Secundaria","2do de Secundaria","3ro de Secundaria"]', 'cmendoza@secundaria.edu'),
('doc-2', 'Prof. María Elena Ramos', 'docente', 'Física y Química', '["3ro de Secundaria","4to de Secundaria","5to de Secundaria","6to de Secundaria"]', 'mramos@secundaria.edu'),
('doc-3', 'Prof. Roberto Silva', 'docente', 'Lenguaje y Literatura', '["1ro de Secundaria","2do de Secundaria","4to de Secundaria"]', 'rsilva@secundaria.edu'),
('doc-4', 'Prof. Ana Lucía Gómez', 'docente', 'Historia y Geografía', '["5to de Secundaria","6to de Secundaria"]', 'agomez@secundaria.edu'),
('adm-1', 'Lic. Patricia Vargas', 'admin', NULL, NULL, 'direccion@secundaria.edu'),
('alu-1', 'Mateo Fernández', 'alumno', NULL, NULL, 'mateo.f@secundaria.edu'),
('alu-2', 'Sofía Castillo', 'alumno', NULL, NULL, 'sofia.c@secundaria.edu'),
('alu-3', 'Lucas Navarro', 'alumno', NULL, NULL, 'lucas.n@secundaria.edu');

-- Actualizar cursos de alumnos de prueba
UPDATE usuarios SET curso = '3ro de Secundaria' WHERE id = 'alu-1';
UPDATE usuarios SET curso = '4to de Secundaria' WHERE id = 'alu-2';
UPDATE usuarios SET curso = '2do de Secundaria' WHERE id = 'alu-3';

-- Clases iniciales
INSERT OR IGNORE INTO clases (id, titulo, materia, curso, docente_id, docente_nombre, meet_url, fecha_hora, estado, descripcion) VALUES
('cls-101', 'Resolución de Ecuaciones de Segundo Grado', 'Matemáticas y Geometría', '3ro de Secundaria', 'doc-1', 'Prof. Carlos Mendoza', 'https://meet.google.com/abc-defg-hij', datetime('now', '+15 minutes'), 'en_vivo', 'Tengan a mano el cuaderno de ejercicios y la calculadora científica.'),
('cls-102', 'Leyes de Newton y Dinámica Clásica', 'Física y Química', '4to de Secundaria', 'doc-2', 'Prof. María Elena Ramos', 'https://meet.google.com/xyz-uvwx-rst', datetime('now', '+2 hours'), 'programada', 'Revisaremos la guía práctica de problemas de la página 45.'),
('cls-103', 'Análisis Literario: Cien Años de Soledad', 'Lenguaje y Literatura', '3ro de Secundaria', 'doc-3', 'Prof. Roberto Silva', 'https://meet.google.com/lit-secu-ndo', datetime('now', '+4 hours'), 'programada', 'Exposición grupal de los capítulos 1 al 3.'),
('cls-104', 'Revolución Industrial y su Impacto Global', 'Historia y Geografía', '5to de Secundaria', 'doc-4', 'Prof. Ana Lucía Gómez', 'https://meet.google.com/his-tori-agp', datetime('now', '+1 day'), 'programada', 'Debate abierto sobre las consecuencias socioeconómicas.');

-- Comunicados iniciales
INSERT OR IGNORE INTO comunicados (id, titulo, mensaje, curso_destino, autor_id, autor_nombre, prioridad) VALUES
('com-1', 'Inicio de Evaluaciones Trimestrales', 'Estimada comunidad educativa, la próxima semana inician las evaluaciones virtuales. Asegurarse de tener conexión estable y puntualidad en Google Meet.', 'todos', 'adm-1', 'Lic. Patricia Vargas (Dirección)', 'urgente'),
('com-2', 'Taller de Nivelación de Matemáticas', 'Los estudiantes de 3ro de Secundaria que deseen reforzar álgebra pueden conectarse los viernes a las 16:00 hrs.', '3ro de Secundaria', 'doc-1', 'Prof. Carlos Mendoza', 'normal');
