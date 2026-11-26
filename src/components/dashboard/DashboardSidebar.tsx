"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getInitials(name: string | undefined | null): string {
  if (!name) return "DOC";
  const clean = name.replace(/^(msc\.|lic\.|ing\.|lcda\.|dr\.|dra\.|prof\.)\s+/i, "").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "DOC";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
import {
  School,
  LayoutDashboard,
  ClipboardList,
  QrCode,
  BarChart3,
  ExternalLink,
  LogOut,
  UserCheck,
  AlertTriangle,
  GraduationCap,
  Settings,
  BookOpen,
  TrendingUp,
  Users,
  CalendarClock,
} from "lucide-react";

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function DashboardSidebar({ mobileOpen, onCloseMobile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<{
    name: string;
    role: string;
    email: string;
    cargo: string;
  }>({
    name: "Docente Titular",
    role: "DOCENTE",
    email: "",
    cargo: "Docente Pichincha",
  });

  useEffect(() => {
    async function loadActiveUser() {
      let email = "";
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email) email = data.user.email;
      } catch (err) {}

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
            email: email,
          }));
        }
      }

      if (email) {
        try {
          const { data } = await supabase
            .from("perfiles_usuarios")
            .select("nombres_completos, rol, correo, cargo")
            .eq("correo", email.trim().toLowerCase())
            .single();

          const profile = data as {
            nombres_completos?: string;
            rol?: string;
            correo?: string;
            cargo?: string;
          } | null;

          if (profile) {
            setActiveUser({
              name: profile.nombres_completos || "Docente Titular",
              role: profile.rol || "DOCENTE",
              email: profile.correo || "",
              cargo: profile.cargo || "Docente Pichincha",
            });
          }
        } catch (e) {}
      }
    }

    loadActiveUser();
  }, [pathname]);

  const navigation = [
    {
      name: "Resumen General",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "Inicio",
    },
    {
      name: "Registro de Notas (70/10/20)",
      href: "/dashboard/teacher/grades",
      icon: ClipboardList,
      badge: "Trimestral",
    },
    {
      name: "Sábana General de Notas",
      href: "/dashboard/teacher",
      icon: UserCheck,
      badge: "Anual",
    },
    {
      name: "Asistencia Híbrida QR",
      href: "/dashboard/teacher/attendance",
      icon: QrCode,
      badge: "QR & Manual",
    },
    {
      name: "Planificaciones Curriculares",
      href: "/dashboard/teacher/planificaciones",
      icon: BookOpen,
      badge: "PDF Semanal",
    },
    {
      name: "Horarios de Clases",
      href: "/dashboard/horarios",
      icon: CalendarClock,
      badge: "PDF / Excel",
    },
    {
      name: "Mi Perfil Docente",
      href: "/dashboard/teacher/profile",
      icon: UserCheck,
      badge: "Docente",
    },
    {
      name: "Analítica Directiva",
      href: "/dashboard/admin",
      icon: TrendingUp,
      badge: "Rectorado",
      adminOnly: true,
    },
    {
      name: "Gestión de Estudiantes",
      href: "/dashboard/admin/students",
      icon: Users,
      badge: "Nómina & QR",
    },
    {
      name: "Alertas DECE & Riesgo",
      href: "/dashboard/analytics",
      icon: BarChart3,
      badge: "Prevención",
    },
    {
      name: "Portal de Familias",
      href: "/dashboard/student",
      icon: GraduationCap,
      badge: "Estudiante",
    },
    {
      name: "Gestión Institucional",
      href: "/dashboard/admin/settings",
      icon: Settings,
      badge: "Directora",
      adminOnly: true,
    },
  ];

  const isDocente = activeUser.role.trim().toLowerCase() === "docente";
  const visibleNavigation = navigation.filter((item) => !(isDocente && item.adminOnly));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-slate-50/70">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
                <School className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  Escuela Pichincha
                </span>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
                  Lloa • MinEduc
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Áreas Administrativas
            </div>

            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.name}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <Link
            href="/portal"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
              <span>Ver Portal Público</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Web</span>
          </Link>

          {/* User card */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                {getInitials(activeUser.name)}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {activeUser.name}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {activeUser.cargo || activeUser.email || "Docente Titular"}
                </span>
              </div>
            </div>

            <Link
              href="/"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.clear();
                  localStorage.removeItem("escuela_user_email");
                  localStorage.removeItem("escuela_user_name");
                  localStorage.removeItem("escuela_user_role");
                }
              }}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
