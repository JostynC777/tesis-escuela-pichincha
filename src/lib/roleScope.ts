import { supabase } from "@/lib/supabase";

export interface UserScope {
  profileId: string;
  email: string;
  nombresCompletos: string;
  rol: string;
  cedula: string;
  isAdmin: boolean;
  allowedCourseIds: string[] | null;
}

export async function getUserCourseScope(): Promise<UserScope> {
  let email = "";
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.email) email = authData.user.email;
  } catch {
    // ignore
  }

  if (!email && typeof window !== "undefined") {
    email =
      sessionStorage.getItem("escuela_user_email") ||
      localStorage.getItem("escuela_user_email") ||
      "";
  }

  let profileId = "";
  let rol = "docente"; // Fail-closed por defecto
  let cedula = "";
  let nombresCompletos = "";

  if (email) {
    const { data: prof } = await supabase
      .from("perfiles_usuarios")
      .select("id, rol, cedula, nombres_completos")
      .eq("correo", email.trim().toLowerCase())
      .maybeSingle();

    if (prof) {
      const p = prof as {
        id: string;
        rol?: string;
        cedula?: string | null;
        nombres_completos?: string;
      };
      profileId = p.id;
      rol = String(p.rol || "docente").trim().toLowerCase();
      cedula = p.cedula || "";
      nombresCompletos = p.nombres_completos || "";
    } else if (typeof window !== "undefined") {
      const storedRole =
        sessionStorage.getItem("escuela_user_role") ||
        localStorage.getItem("escuela_user_role");
      if (storedRole) rol = storedRole.trim().toLowerCase();
    }
  }

  const isAdmin =
    rol === "admin" || rol === "rectorado" || rol === "directora";

  if (isAdmin) {
    return {
      profileId,
      email,
      nombresCompletos,
      rol,
      cedula,
      isAdmin: true,
      allowedCourseIds: null,
    };
  }

  if (rol === "estudiante" || rol === "familia") {
    return {
      profileId,
      email,
      nombresCompletos,
      rol,
      cedula,
      isAdmin: false,
      allowedCourseIds: [],
    };
  }

  // Rol docente: fail-closed -> solo cursos asignados en docente_cursos, tutor_id o docente_asignatura_curso
  if (!profileId) {
    return {
      profileId: "",
      email,
      nombresCompletos,
      rol: "docente",
      cedula,
      isAdmin: false,
      allowedCourseIds: [],
    };
  }

  const courseSet = new Set<string>();

  const [tutorRes, dcRes, dacRes] = await Promise.all([
    supabase.from("cursos").select("id").eq("tutor_id", profileId),
    (supabase as any)
      .from("docente_cursos")
      .select("curso_id")
      .eq("docente_id", profileId),
    supabase
      .from("docente_asignatura_curso")
      .select("curso_id")
      .eq("docente_id", profileId)
      .eq("activo", true),
  ]);

  (tutorRes.data || []).forEach((r: any) => r.id && courseSet.add(r.id));
  if (!dcRes.error && dcRes.data) {
    dcRes.data.forEach((r: any) => r.curso_id && courseSet.add(r.curso_id));
  }
  (dacRes.data || []).forEach((r: any) => r.curso_id && courseSet.add(r.curso_id));

  return {
    profileId,
    email,
    nombresCompletos,
    rol,
    cedula,
    isAdmin: false,
    allowedCourseIds: Array.from(courseSet),
  };
}
