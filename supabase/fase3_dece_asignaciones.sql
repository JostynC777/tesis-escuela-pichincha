-- ============================================================================
-- ESCUELA DE EDUCACION BASICA "PICHINCHA" (LLOA - QUITO)
-- FASE 3: ALERTAS DECE Y RELACION DOCENTE - CURSOS
-- Script idempotente listo para ejecutar en SQL Editor de Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: alertas_dece
CREATE TABLE IF NOT EXISTS alertas_dece (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES perfiles_usuarios(id) ON DELETE SET NULL,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('ACADEMICA', 'ASISTENCIA', 'CONDUCTUAL', 'PSICOSOCIAL')),
    nivel_riesgo TEXT NOT NULL CHECK (nivel_riesgo IN ('LEVE', 'MODERADO', 'CRITICO')),
    asunto TEXT NOT NULL,
    comunicado TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'EN_SEGUIMIENTO', 'RESUELTA')),
    visible_familia BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_dece_estudiante ON alertas_dece(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_alertas_dece_curso ON alertas_dece(curso_id);
CREATE INDEX IF NOT EXISTS idx_alertas_dece_docente ON alertas_dece(docente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_dece_estado ON alertas_dece(estado);

-- 2. TABLA: docente_cursos (Complementa cursos.tutor_id y docente_asignatura_curso)
CREATE TABLE IF NOT EXISTS docente_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docente_id UUID NOT NULL REFERENCES perfiles_usuarios(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    es_tutor BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_docente_curso UNIQUE (docente_id, curso_id)
);

CREATE INDEX IF NOT EXISTS idx_docente_cursos_docente ON docente_cursos(docente_id);
CREATE INDEX IF NOT EXISTS idx_docente_cursos_curso ON docente_cursos(curso_id);

-- Poblar docente_cursos automáticamente desde cursos.tutor_id y docente_asignatura_curso
INSERT INTO docente_cursos (docente_id, curso_id, es_tutor)
SELECT tutor_id, id, true
FROM cursos
WHERE tutor_id IS NOT NULL
ON CONFLICT (docente_id, curso_id) DO UPDATE SET es_tutor = true;

INSERT INTO docente_cursos (docente_id, curso_id, es_tutor)
SELECT DISTINCT docente_id, curso_id, false
FROM docente_asignatura_curso
WHERE activo = true
ON CONFLICT (docente_id, curso_id) DO NOTHING;

-- 3. POLITICAS RLS PERMISIVAS PARA USUARIOS AUTENTICADOS
ALTER TABLE alertas_dece ENABLE ROW LEVEL SECURITY;
ALTER TABLE docente_cursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fase3_alertas_dece_authenticated_all" ON alertas_dece;
CREATE POLICY "fase3_alertas_dece_authenticated_all"
    ON alertas_dece FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "fase3_docente_cursos_authenticated_all" ON docente_cursos;
CREATE POLICY "fase3_docente_cursos_authenticated_all"
    ON docente_cursos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
