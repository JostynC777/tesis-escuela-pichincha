-- ============================================================================
-- ESCUELA DE EDUCACION BASICA "PICHINCHA" (LLOA - QUITO)
-- FASE 4: RPC PUBLICA PARA CONTEOS AGREGADOS DEL PORTAL INFORMATIVO (/portal)
-- Devuelve unicamente totales agregados sin exponer cedulas, nombres ni correos
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_portal_public_stats()
RETURNS TABLE (
    total_estudiantes INTEGER,
    total_cursos INTEGER,
    total_docentes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        (SELECT COUNT(*)::INTEGER FROM estudiantes WHERE activo = true) AS total_estudiantes,
        (SELECT COUNT(*)::INTEGER FROM cursos) AS total_cursos,
        (SELECT COUNT(*)::INTEGER FROM perfiles_usuarios WHERE rol = 'docente' AND activo = true) AS total_docentes;
$$;

REVOKE ALL ON FUNCTION public.get_portal_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_public_stats() TO anon, authenticated;
