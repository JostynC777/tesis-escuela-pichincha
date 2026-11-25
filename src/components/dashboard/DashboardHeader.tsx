"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  Bell,
  Clock,
  Calendar,
  School,
  ChevronDown,
} from "lucide-react";

function getInitials(name: string | undefined | null): string {
  if (!name) return "DOC";
  const clean = name.replace(/^(msc\.|lic\.|ing\.|lcda\.|dr\.|dra\.|prof\.)\s+/i, "").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "DOC";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const [activeUser, setActiveUser] = useState<{
    name: string;
    role: string;
    email: string;
  }>({
    name: "Docente Titular",
    role: "DOCENTE",
    email: "",
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
          setActiveUser({
            name: storedName,
            role: storedRole || "DOCENTE",
            email: email,
          });
        }
      }

      if (email) {
        try {
          const { data } = await supabase
            .from("perfiles_usuarios")
            .select("nombres_completos, rol, correo")
            .eq("correo", email.trim().toLowerCase())
            .single();

          const profile = data as {
            nombres_completos?: string;
            rol?: string;
            correo?: string;
          } | null;

          if (profile) {
            setActiveUser({
              name: profile.nombres_completos || "Docente Titular",
              role: profile.rol || "DOCENTE",
              email: profile.correo || "",
            });
          }
        } catch (e) {}
      }
    }

    loadActiveUser();
  }, [pathname]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
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
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname.includes("/admin/students")) return "Gestión de Estudiantes • Nómina & Carnets QR";
    if (pathname.includes("/admin/settings")) return "Administración Institucional • Nómina, Cronograma & Métricas";
    if (pathname === "/dashboard/admin") return "Dashboard de Analítica Directiva • Rectorado Institucional";
    if (pathname.includes("/teacher/grades")) return "Registro de Calificaciones Trimestrales • Sistema 70/10/20 MINEDUC";
    if (pathname.includes("/teacher/profile")) return "Perfil Docente • Planificaciones Curriculares & Recursos";
    if (pathname.includes("/teacher/attendance")) return "Módulo de Asistencia Híbrida • QR Dinámico & Respaldo Manual";
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
        
        {/* Quick Role Switcher pills visible only for admin/rectorado */}
        {(activeUser.role.trim().toLowerCase() === "admin" ||
          activeUser.role.trim().toLowerCase() === "rectorado") && (
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

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span>{currentTime || "08:15:00"}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{currentDate}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 p-4 shadow-xl z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Avisos del Plantel</span>
                <span className="text-[10px] text-blue-700 font-bold">2 Pendientes</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                  <span className="font-bold block text-[11px]">Alerta DECE - Deserción</span>
                  <span className="text-[11px] text-rose-700">2 estudiantes de 5to EGB registran promedio menor a 7.0/10.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                  <span className="font-bold block text-[11px]">Cierre de 1er Trimestre</span>
                  <span className="text-[11px] text-blue-700">Ingreso de calificaciones en el sistema habilitado hasta el viernes.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Profile Indicator */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {activeUser.name}
            </span>
            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
              {activeUser.role}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-sm select-none"
            title={`${activeUser.name} (${activeUser.email || activeUser.role})`}
          >
            {getInitials(activeUser.name)}
          </div>
        </div>

      </div>
    </header>
  );
}
