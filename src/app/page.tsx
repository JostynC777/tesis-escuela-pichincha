"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  School,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Award,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Estados del Formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authMismatch, setAuthMismatch] = useState<{
    email: string;
    nombre: string;
    rol: string;
  } | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  // Manejador de Autenticación Real con Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAuthMismatch(null);

    // Validación de campos vacíos
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, complete todos los campos (correo institucional y contraseña).");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Consulta a la tabla real de perfiles_usuarios en Supabase
      const { data: profileData, error: profileError } = await supabase
        .from("perfiles_usuarios")
        .select("rol, nombres_completos")
        .eq("correo", cleanEmail)
        .single();

      const profile = profileData as { rol?: string; nombres_completos?: string } | null;

      if (profileError || !profile) {
        setErrorMessage(
          "Credenciales no reconocidas en el sistema de la Escuela Pichincha. Verifique su correo institucional."
        );
        return;
      }

      // 2. Intentar autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      // 3. Detectar mismatch: usuario existe en perfiles_usuarios pero NO en Supabase Auth
      if (authError) {
        const isUserNotFound =
          authError.message?.toLowerCase().includes("user not found") ||
          authError.message?.toLowerCase().includes("invalid login credentials") ||
          authError.code === "auth/user-not-found" ||
          authError.status === 400;

        if (isUserNotFound) {
          // Usuario existe en perfiles_usuarios pero no en Auth
          setAuthMismatch({
            email: cleanEmail,
            nombre: profile.nombres_completos || "",
            rol: profile.rol || "",
          });
          return;
        }

        setErrorMessage(authError.message || "No se pudo iniciar sesión en Supabase.");
        return;
      }

      // 4. Autenticación exitosa - Guardar información en sesión
      if (typeof window !== "undefined") {
        sessionStorage.setItem("escuela_user_role", profile.rol || "");
        sessionStorage.setItem("escuela_user_name", profile.nombres_completos || "");
        sessionStorage.setItem("escuela_user_email", cleanEmail);
        localStorage.setItem("escuela_user_role", profile.rol || "");
        localStorage.setItem("escuela_user_name", profile.nombres_completos || "");
        localStorage.setItem("escuela_user_email", cleanEmail);
      }

      const userRole = (profile.rol || "").toUpperCase();

      // 5. Enrutamiento según el rol oficial devuelto por Supabase
      if (userRole === "ADMIN" || userRole === "RECTORADO") {
        router.push("/dashboard/admin");
      } else if (userRole === "DOCENTE") {
        router.push("/dashboard/teacher");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err: any) {
      setErrorMessage(
        "Error de conexión al verificar credenciales con la base de datos de Supabase. Verifique su conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para crear usuario en Supabase Auth (solo admin)
  const handleCreateAuthUser = async () => {
    if (!authMismatch) return;

    setCreatingUser(true);
    setErrorMessage(null);

    try {
      // Usar supabase.auth.admin.createUser requiere service_role key
      // En el cliente, usamos signUp para permitir al usuario crear su propia cuenta
      const { error } = await supabase.auth.signUp({
        email: authMismatch.email,
        password: "Pichincha2026*", // Contraseña inicial temporal
        options: {
          data: {
            nombres_completos: authMismatch.nombre,
            rol: authMismatch.rol,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          setErrorMessage(
            "Este correo ya tiene una cuenta en Supabase Auth. Intente iniciar sesión con su contraseña."
          );
        } else {
          setErrorMessage(
            `Error al crear credenciales: ${error.message}. Contacte al administrador del sistema.`
          );
        }
        return;
      }

      // Éxito: credenciales creadas, ahora intentar login automáticamente
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: authMismatch.email,
        password: "Pichincha2026*",
      });

      if (loginError) {
        setErrorMessage(
          "Credenciales creadas exitosamente. Por favor, inicie sesión manualmente con la contraseña temporal: Pichincha2026*"
        );
        setAuthMismatch(null);
        return;
      }

      // Login automático exitoso
      if (typeof window !== "undefined") {
        sessionStorage.setItem("escuela_user_role", authMismatch.rol || "");
        sessionStorage.setItem("escuela_user_name", authMismatch.nombre || "");
        sessionStorage.setItem("escuela_user_email", authMismatch.email);
        localStorage.setItem("escuela_user_role", authMismatch.rol || "");
        localStorage.setItem("escuela_user_name", authMismatch.nombre || "");
        localStorage.setItem("escuela_user_email", authMismatch.email);
      }

      const userRole = (authMismatch.rol || "").toUpperCase();

      if (userRole === "ADMIN" || userRole === "RECTORADO") {
        router.push("/dashboard/admin");
      } else if (userRole === "DOCENTE") {
        router.push("/dashboard/teacher");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err: any) {
      setErrorMessage(
        "Error de conexión al crear credenciales en Supabase Auth. Verifique su conexión a internet."
      );
    } finally {
      setCreatingUser(false);
    }
  };

  // Función para cerrar el aviso de mismatch
  const dismissAuthMismatch = () => {
    setAuthMismatch(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-50">

      {/* =====================================================================
          MITAD IZQUIERDA: BRANDING INSTITUCIONAL (ESCUELA PICHINCHA - LLOA)
      ===================================================================== */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white overflow-hidden">

        {/* Patrón de luz y fondo geométrico sutil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        {/* Encabezado Superior: Placeholder Logo MINEDUC */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center font-black text-white text-xs shadow-inner">
              EC
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-blue-200">
                Ministerio de Educación y Deporte
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                Gobierno de la República del Ecuador • Distrito 17D01
              </span>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-bold border border-blue-700/60">
              <School className="w-3.5 h-3.5" />
              <span>Código AMIE: 17H01429 • Parroquia Rural Lloa</span>
            </div>

            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight text-white">
              Escuela de Educación Básica "Pichincha"
            </h1>

            <p className="text-lg xl:text-xl font-bold text-blue-200 leading-snug">
              Plataforma Integral de Gestión Académica y Asistencia QR
            </p>

            <p className="text-sm text-slate-300 leading-relaxed max-w-lg pt-1">
              Sistema digital institucional para el control y seguimiento pedagógico, toma de asistencia automatizada en aula y cálculo de notas bajo la normativa oficial del MINEDUC.
            </p>
          </div>
        </div>

        {/* Bloque Central de Características Institucionales */}
        <div className="relative z-10 grid grid-cols-1 gap-4 max-w-lg my-8">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <div className="p-2.5 rounded-xl bg-blue-600/80 text-white shrink-0 mt-0.5">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Asistencia Híbrida QR en Aula
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Generador dinámico de códigos de 60 segundos y respaldo manual para docentes tutores.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <div className="p-2.5 rounded-xl bg-indigo-600/80 text-white shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Ponderación Ministerial 70 / 10 / 20
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluación Formativa (70%), Proyecto Integrador (10%) y Evaluación Sumativa (20%).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <div className="p-2.5 rounded-xl bg-emerald-600/80 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Alerta Temprana DECE
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Monitoreo directo desde Rectorado para prevenir la reprobación y deserción escolar.
              </p>
            </div>
          </div>
        </div>

        {/* Pie de Página Izquierdo */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Escuela Pichincha • Parroquia Lloa</span>
          <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Supabase Auth & Cifrado SSL</span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          MITAD DERECHA: FORMULARIO INTERACTIVO DE LOGIN
      ===================================================================== */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">

        {/* Barra Superior Derecha */}
        <div className="flex items-center justify-between w-full pb-4">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 leading-tight">
                Escuela Pichincha
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                Lloa • AMIE 17H01429
              </span>
            </div>
          </div>

          <Link
            href="/portal"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100"
          >
            <span>Ver Portal Informativo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Contenedor Central del Formulario */}
        <div className="w-full max-w-md mx-auto my-auto py-8">

          {/* Encabezado del Formulario */}
          <div className="text-center sm:text-left mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-700 mb-4 border border-blue-100">
              <School className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Ingrese sus credenciales institucionales para acceder a su panel de gestión académica.
            </p>
          </div>

          {/* Formulario Principal */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campo 1: Correo Institucional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Correo Institucional
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="ej. laura.simbana@pichincha.edu.ec"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                />
              </div>
            </div>

            {/* Campo 2: Contraseña con Toggle Ojito */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <span className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                  ¿Olvidó su clave?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón Principal: Ingresar al Sistema */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800 active:scale-[0.99] shadow-blue-700/20"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando con Supabase Auth...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Mensaje de Error Elegante en Rojo */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Error de autenticación</span>
                  <span className="text-[11px] text-rose-700">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Aviso de Mismatch: Usuario existe en perfiles_usuarios pero no en Supabase Auth */}
            {authMismatch && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">Credenciales de Auth no encontradas</span>
                      <button
                        onClick={dismissAuthMismatch}
                        className="text-amber-600 hover:text-amber-800 font-bold text-lg leading-none p-1"
                        title="Cerrar"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-700 mb-3">
                      El usuario <span className="font-bold">{authMismatch.nombre}</span>
                      ({authMismatch.email}) está registrado en la base de datos de la Escuela Pichincha
                      con rol <span className="font-bold">{authMismatch.rol}</span>,
                      pero <span className="font-bold">no tiene credenciales creadas en Supabase Auth</span>.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCreateAuthUser}
                        disabled={creatingUser}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingUser ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Creando credenciales...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Crear credenciales en Supabase Auth</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Contraseña inicial: <span className="font-mono bg-amber-100 px-1 rounded">Pichincha2026*</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-2">
                      Nota: El usuario deberá cambiar su contraseña en el primer inicio de sesión.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Pie de Página Derecho */}
        <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>
            Sistema de Gestión Académica • Escuela de Educación Básica "Pichincha"
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            AMIE: 17H01429 • Distrito Educativo 17D01 • Lloa, Cantón Quito
          </p>
        </div>

      </div>

    </div>
  );
}