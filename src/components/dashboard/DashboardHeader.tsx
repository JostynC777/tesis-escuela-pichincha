"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  Bell,
  Clock,
  MoreVertical,
  User,
  Sun,
  Moon,
  LogOut,
  Check,
  Send,
  X,
  Loader2,
} from "lucide-react";

function getInitials(name: string | undefined | null): string {
  if (!name) return "DOC";
  const clean = name.replace(/^(msc\.|lic\.|ing\.|lcda\.|dr\.|dra\.|prof\.)\s+/i, "").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "DOC";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface NotificacionItem {
  id: string;
  remitente_nombre: string;
  destinatario_id: string | null;
  titulo: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

interface TeacherOption {
  id: string;
  nombres_completos: string;
}

interface DashboardHeaderProps {
  onToggleMobileMenu: () => void;
}

export function DashboardHeader({ onToggleMobileMenu }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [activeUser, setActiveUser] = useState<{
    id: string;
    name: string;
    role: string;
    email: string;
  }>({
    id: "",
    name: "Docente Titular",
    role: "DOCENTE",
    email: "",
  });

  const [notifications, setNotifications] = useState<NotificacionItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [teachersList, setTeachersList] = useState<TeacherOption[]>([]);
  const [sendDestId, setSendDestId] = useState<string>("");
  const [sendTitle, setSendTitle] = useState<string>("");
  const [sendMsg, setSendMsg] = useState<string>("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Inicializar tema desde localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const darkActive = saved === "dark";
    setIsDark(darkActive);
    document.documentElement.classList.toggle("dark", darkActive);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", nextDark);
    }
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingNotifs(true);
    try {
      const { data, error } = await (supabase as any)
        .from("notificaciones")
        .select("id, remitente_nombre, destinatario_id, titulo, mensaje, leido, created_at")
        .or(`destinatario_id.eq.${userId},destinatario_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(25);

      if (!error && Array.isArray(data)) {
        setNotifications(data as NotificacionItem[]);
      }
    } catch {
      // ignore if table not yet created
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    async function loadActiveUser() {
      let email = "";
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) email = data.user.email;
      } catch {}

      if (!email && typeof window !== "undefined") {
        email =
          sessionStorage.getItem("escuela_user_email") ||
          localStorage.getItem("escuela_user_email") ||
          "";
        const storedName =
          sessionStorage.getItem("escuela_user_name") ||
          localStorage.getItem("escuela_user_name");
        const storedRole =
          sessionStorage.getItem("escuela_user_role") ||
          localStorage.getItem("escuela_user_role");
        if (storedName) {
          setActiveUser((prev) => ({
            ...prev,
            name: storedName,
            role: storedRole || "DOCENTE",
            email,
          }));
        }
      }

      if (email) {
        try {
          const { data } = await supabase
            .from("perfiles_usuarios")
            .select("id, nombres_completos, rol, correo")
            .eq("correo", email.trim().toLowerCase())
            .single();

          const profile = data as {
            id?: string;
            nombres_completos?: string;
            rol?: string;
            correo?: string;
          } | null;

          if (profile) {
            const uId = profile.id || "";
            const uRole = profile.rol || "DOCENTE";
            setActiveUser({
              id: uId,
              name: profile.nombres_completos || "Docente Titular",
              role: uRole,
              email: profile.correo || "",
            });
            if (uId) {
              fetchNotifications(uId);
            }
            const rNorm = uRole.trim().toLowerCase();
            if (rNorm === "admin" || rNorm === "directora" || rNorm === "rectorado") {
              const { data: tData } = await supabase
                .from("perfiles_usuarios")
                .select("id, nombres_completos")
                .eq("rol", "docente")
                .eq("activo", true)
                .order("nombres_completos");
              if (tData) setTeachersList(tData as unknown as TeacherOption[]);
            }
          }
        } catch {}
      }
    }

    loadActiveUser();
  }, [pathname, fetchNotifications]);

  // Reloj sin segundos (hora, minutos y AM/PM)
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("es-EC", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notif: NotificacionItem) => {
    if (notif.leido) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
    );
    try {
      await (supabase as any)
        .from("notificaciones")
        .update({ leido: true })
        .eq("id", notif.id);
    } catch {}
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTitle.trim() || !sendMsg.trim()) return;
    setIsSendingNotif(true);
    try {
      const { error } = await (supabase as any).from("notificaciones").insert({
        remitente_nombre: activeUser.name,
        destinatario_id: sendDestId || null,
        titulo: sendTitle.trim(),
        mensaje: sendMsg.trim(),
        leido: false,
      });
      if (!error) {
        setSendTitle("");
        setSendMsg("");
        setSendDestId("");
        setShowSendForm(false);
        if (activeUser.id) await fetchNotifications(activeUser.id);
      }
    } catch {}
    finally {
      setIsSendingNotif(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("escuela_user_role");
      sessionStorage.removeItem("escuela_user_name");
      sessionStorage.removeItem("escuela_user_email");
      localStorage.removeItem("escuela_user_role");
      localStorage.removeItem("escuela_user_name");
      localStorage.removeItem("escuela_user_email");
    }
    setShowUserMenu(false);
    router.push("/");
  };

  const unreadCount = notifications.filter((n) => !n.leido).length;
  const normalizedRole = activeUser.role.trim().toLowerCase();
  const isDirective =
    normalizedRole === "admin" ||
    normalizedRole === "directora" ||
    normalizedRole === "rectorado";

  const getPageTitle = () => {
    if (pathname.includes("/admin/students")) return "Gestión de Estudiantes • Nómina & Carnets QR";
    if (pathname.includes("/admin/settings")) return "Administración Institucional • Nómina, Cronograma & Métricas";
    if (pathname === "/dashboard/admin") return "Dashboard de Analítica Directiva • Rectorado Institucional";
    if (pathname.includes("/teacher/grades")) return "Registro de Calificaciones Trimestrales • Sistema 70/10/20 MINEDUC";
    if (pathname.includes("/teacher/profile")) return "Perfil Docente • Planificaciones Curriculares & Recursos";
    if (pathname.includes("/teacher/attendance")) return "Módulo de Asistencia Híbrida • QR Dinámico & Respaldo Manual";
    if (pathname.includes("/teacher/planificaciones")) return "Planificaciones Curriculares por Semana";
    if (pathname.includes("/horarios")) return "Horarios de Clases • Jornada Escolar";
    if (pathname.includes("/teacher")) return "Registro de Calificaciones Trimestrales & Asistencia QR";
    if (pathname.includes("/analytics")) return "Rectorado: Analítica Institucional & Prevención de Deserción";
    if (pathname.includes("/student")) return "Portal de Familias • Consulta de Libretas y Tareas";
    return "Panel General de Gestión Escolar • Escuela Pichincha";
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Escuela Pichincha</span>
            <span>/</span>
            <span className="text-blue-700 font-bold">Lloa</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher pills visible only for admin/rectorado/directora */}
        {isDirective && (
          <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase px-2">
              Ver como:
            </span>
            <button
              onClick={() => router.push("/dashboard/teacher")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                pathname.includes("/teacher")
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Docente
            </button>
            <button
              onClick={() => router.push("/dashboard/analytics")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                pathname.includes("/analytics")
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rectorado
            </button>
            <button
              onClick={() => router.push("/dashboard/student")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                pathname.includes("/student")
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Familia
            </button>
          </div>
        )}

        {/* Live Clock (sin segundos) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span>{currentTime || "08:15 a. m."}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{currentDate}</span>
        </div>

        {/* Notifications Bell (conectada a public.notificaciones) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowUserMenu(false);
            }}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 relative transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 p-4 shadow-xl z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    Avisos del Plantel
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {unreadCount > 0
                      ? `${unreadCount} sin leer`
                      : "Todas leídas"}
                  </span>
                </div>

                {isDirective && (
                  <button
                    onClick={() => setShowSendForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold transition-colors"
                  >
                    {showSendForm ? <X className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                    <span>{showSendForm ? "Cerrar" : "Enviar aviso"}</span>
                  </button>
                )}
              </div>

              {showSendForm && isDirective && (
                <form
                  onSubmit={handleSendNotification}
                  className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <select
                    value={sendDestId}
                    onChange={(e) => setSendDestId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="">Todos los docentes (Aviso general)</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombres_completos}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                    placeholder="Título del aviso..."
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                  />
                  <textarea
                    rows={2}
                    value={sendMsg}
                    onChange={(e) => setSendMsg(e.target.value)}
                    placeholder="Mensaje..."
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={isSendingNotif}
                    className="w-full py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSendingNotif ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Publicar Notificación</span>
                  </button>
                </form>
              )}

              <div className="py-2 space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
                {loadingNotifs ? (
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Cargando avisos...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-[11px]">
                    No tienes notificaciones registradas.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif)}
                      className={`p-3 rounded-xl border transition-all ${
                        notif.leido
                          ? "bg-slate-50 border-slate-200 text-slate-700"
                          : "bg-blue-50/80 border-blue-200 text-slate-900 cursor-pointer hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[11px] text-blue-800 truncate">
                          {notif.remitente_nombre || "Dirección Institucional"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                            notif.leido
                              ? "bg-slate-200 text-slate-600"
                              : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {notif.leido ? "Leído" : "No leído"}
                        </span>
                      </div>

                      <span className="font-black block text-xs text-slate-900">
                        {notif.titulo}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {notif.mensaje}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>
                          {new Date(notif.created_at).toLocaleString("es-EC", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!notif.leido && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif);
                            }}
                            className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
                          >
                            <Check className="w-3 h-3" />
                            <span>Marcar como leída</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Profile & Dropdown Menu */}
        <div className="relative pl-2 border-l border-slate-200" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
            title={`${activeUser.name} (${activeUser.email || activeUser.role})`}
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {activeUser.name}
              </span>
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                {activeUser.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-sm select-none">
              {getInitials(activeUser.name)}
            </div>
            <MoreVertical className="w-4 h-4 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 p-2 shadow-xl z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="font-bold text-slate-900 block truncate">
                  {activeUser.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {activeUser.email || activeUser.role}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push("/dashboard/teacher/profile");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
              >
                <User className="w-4 h-4 text-blue-600" />
                <span>Ver mi perfil</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>{isDark ? "Tema Claro" : "Tema Oscuro"}</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {isDark ? "Oscuro" : "Claro"}
                </span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
