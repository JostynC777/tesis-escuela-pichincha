-- ============================================================================
-- ESCUELA DE EDUCACION BASICA "PICHINCHA" (LLOA - QUITO)
-- FASE 2: PADRON DE ESTUDIANTES, CALIFICACIONES MINEDUC (70/10/20) Y ASISTENCIA QR
-- Script idempotente compatible con supabase_schema_completo.sql y App Android
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: estudiantes (si no existe)
CREATE TABLE IF NOT EXISTS estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula VARCHAR(10) UNIQUE NOT NULL,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    nombres_completos VARCHAR(170) GENERATED ALWAYS AS (nombres || ' ' || apellidos) STORED,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,
    tutor_id UUID REFERENCES perfiles_usuarios(id) ON DELETE SET NULL,
    codigo_qr VARCHAR(100) UNIQUE NOT NULL,
    nombre_representante VARCHAR(150),
    telefono_representante VARCHAR(20),
    alerta_dece VARCHAR(20) NOT NULL DEFAULT 'estable' CHECK (alerta_dece IN ('estable', 'moderado', 'critico')),
    observacion_dece TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estudiantes_curso ON estudiantes(curso_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo_qr ON estudiantes(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_estudiantes_cedula ON estudiantes(cedula);

-- 2. TABLA: calificaciones (Ponderacion oficial MINEDUC 70/10/20)
CREATE TABLE IF NOT EXISTS calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    asignatura_id UUID NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES perfiles_usuarios(id) ON DELETE CASCADE,
    docente_asignatura_curso_id UUID REFERENCES docente_asignatura_curso(id) ON DELETE SET NULL,
    trimestre INTEGER NOT NULL CHECK (trimestre IN (1, 2, 3)),
    nota_formativa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (nota_formativa >= 0.00 AND nota_formativa <= 10.00),
    nota_proyecto NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (nota_proyecto >= 0.00 AND nota_proyecto <= 10.00),
    nota_sumativa NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (nota_sumativa >= 0.00 AND nota_sumativa <= 10.00),
    promedio_trimestral NUMERIC(4,2) GENERATED ALWAYS AS (
        ROUND(((nota_formativa * 0.70) + (nota_proyecto * 0.10) + (nota_sumativa * 0.20))::numeric, 2)
    ) STORED,
    estado_academico VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN ROUND(((nota_formativa * 0.70) + (nota_proyecto * 0.10) + (nota_sumativa * 0.20))::numeric, 2) >= 7.00 THEN 'APROBADO'
            WHEN ROUND(((nota_formativa * 0.70) + (nota_proyecto * 0.10) + (nota_sumativa * 0.20))::numeric, 2) >= 4.00 THEN 'SUPLETORIO'
            ELSE 'REPROBADO'
        END
    ) STORED,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_calificacion_estudiante_asignatura_trimestre UNIQUE (estudiante_id, asignatura_id, trimestre)
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante ON calificaciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_asignatura_trimestre ON calificaciones(asignatura_id, trimestre);

-- 3. TABLA: asistencias (Compatible con QR Android y Web)
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES perfiles_usuarios(id) ON DELETE SET NULL,
    asignatura_id UUID REFERENCES asignaturas(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    estado VARCHAR(20) NOT NULL DEFAULT 'PRESENTE' CHECK (estado IN ('PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATRASO')),
    metodo VARCHAR(20) NOT NULL DEFAULT 'QR' CHECK (metodo IN ('QR', 'MANUAL')),
    codigo_qr_escaneado VARCHAR(100),
    dispositivo_origen VARCHAR(100) DEFAULT 'com.jcumbajin.sgapichincha',
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_asistencia_estudiante_fecha_curso UNIQUE (estudiante_id, fecha, curso_id)
);

CREATE INDEX IF NOT EXISTS idx_asistencias_fecha_curso ON asistencias(fecha, curso_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_estudiante ON asistencias(estudiante_id);

-- 4. POLITICAS RLS PERMISIVAS PARA USUARIOS AUTENTICADOS
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fase2_estudiantes_authenticated_all" ON estudiantes;
CREATE POLICY "fase2_estudiantes_authenticated_all"
    ON estudiantes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "fase2_calificaciones_authenticated_all" ON calificaciones;
CREATE POLICY "fase2_calificaciones_authenticated_all"
    ON calificaciones FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "fase2_asistencias_authenticated_all" ON asistencias;
CREATE POLICY "fase2_asistencias_authenticated_all"
    ON asistencias FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. DATOS DE PRUEBA FICTICIOS (100% ANONIMIZADOS)
DO $$
DECLARE
    v_curso_5_id UUID;
    v_docente_id UUID;
    v_asig_cn_id UUID;
    v_est_id UUID;
BEGIN
    SELECT id INTO v_curso_5_id FROM cursos WHERE nombre ILIKE '%5%' ORDER BY orden LIMIT 1;
    IF v_curso_5_id IS NULL THEN
        SELECT id INTO v_curso_5_id FROM cursos ORDER BY orden LIMIT 1;
    END IF;

    SELECT id INTO v_docente_id FROM perfiles_usuarios WHERE rol = 'docente' AND activo = true ORDER BY created_at LIMIT 1;
    IF v_docente_id IS NULL THEN
        SELECT id INTO v_docente_id FROM perfiles_usuarios LIMIT 1;
    END IF;

    SELECT id INTO v_asig_cn_id FROM asignaturas WHERE nombre ILIKE '%Ciencias Naturales%' LIMIT 1;
    IF v_asig_cn_id IS NULL THEN
        SELECT id INTO v_asig_cn_id FROM asignaturas LIMIT 1;
    END IF;

    IF v_curso_5_id IS NOT NULL THEN
        INSERT INTO estudiantes (cedula, nombres, apellidos, curso_id, tutor_id, codigo_qr, nombre_representante, telefono_representante, alerta_dece, activo)
        VALUES
            ('1700000001', 'Juan Carlos', 'Perez Gomez', v_curso_5_id, v_docente_id, 'PICH-1700000001', 'Representante Ejemplo 1', '0990000001', 'estable', true),
            ('1700000002', 'Maria Jose', 'Lopez Diaz', v_curso_5_id, v_docente_id, 'PICH-1700000002', 'Representante Ejemplo 2', '0990000002', 'moderado', true),
            ('1700000003', 'Andres Felipe', 'Torres Ruiz', v_curso_5_id, v_docente_id, 'PICH-1700000003', 'Representante Ejemplo 3', '0990000003', 'critico', true)
        ON CONFLICT (cedula) DO NOTHING;

        IF v_docente_id IS NOT NULL AND v_asig_cn_id IS NOT NULL THEN
            FOR v_est_id IN SELECT id FROM estudiantes WHERE cedula IN ('1700000001', '1700000002', '1700000003') LOOP
                INSERT INTO calificaciones (estudiante_id, curso_id, asignatura_id, docente_id, trimestre, nota_formativa, nota_proyecto, nota_sumativa)
                VALUES (
                    v_est_id,
                    v_curso_5_id,
                    v_asig_cn_id,
                    v_docente_id,
                    1,
                    CASE WHEN v_est_id = (SELECT id FROM estudiantes WHERE cedula = '1700000003') THEN 5.20 ELSE 8.80 END,
                    CASE WHEN v_est_id = (SELECT id FROM estudiantes WHERE cedula = '1700000003') THEN 5.50 ELSE 9.00 END,
                    CASE WHEN v_est_id = (SELECT id FROM estudiantes WHERE cedula = '1700000003') THEN 4.80 ELSE 8.50 END
                )
                ON CONFLICT (estudiante_id, asignatura_id, trimestre) DO NOTHING;
            END LOOP;
        END IF;
    END IF;
END $$;
