"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  School,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"teacher" | "director" | "parent">("teacher");
  const [email, setEmail] = useState("maria.guaman@educacion.gob.ec");
  const [password, setPassword] = useState("Docente2026*");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: "teacher" | "director" | "parent") => {
    setRole(selectedRole);
    if (selectedRole === "teacher") {
      setEmail("maria.guaman@educacion.gob.ec");
      setPassword("Docente2026*");
    } else if (selectedRole === "director") {
      setEmail("rectorado.pichincha@educacion.gob.ec");
      setPassword("Director2026*");
    } else {
      setEmail("familia.toapanta@correo.ec");
      setPassword("Familia2026*");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("escuela_user_role", role);
      }

      if (role === "teacher") {
        router.push("/dashboard/teacher");
      } else if (role === "director") {
        router.push("/dashboard/analytics");
      } else {
        router.push("/dashboard/student");
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" />
          <span>Volver al Portal Público</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 pt-10 sm:pt-0">
        {/* Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-amber-400 to-emerald-600" />

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md mb-3">
              <School className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Escuela Pichincha
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sistema de Gestión Académica Escolar • Lloa
            </p>
          </div>

          {/* Role selector pills */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Ingreso Rápido de Prueba:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleSelect("teacher")}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  role === "teacher"
                    ? "bg-blue-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>👨‍🏫 Docente</span>
                <span className="text-[9px] opacity-80">Notas & QR</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("director")}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  role === "director"
                    ? "bg-blue-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🏛️ Rectorado</span>
                <span className="text-[9px] opacity-80">Analítica</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("parent")}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                  role === "parent"
                    ? "bg-blue-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>👨‍👩‍👦 Familia</span>
                <span className="text-[9px] opacity-80">Libretas</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Correo Institucional o Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <span className="text-[11px] text-blue-700 font-semibold cursor-pointer">
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <input
                type="checkbox"
                defaultChecked
                id="remember"
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember">Recordar credenciales en este equipo</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Iniciando Sesión...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    Ingresar como {role === "teacher" ? "Docente Tutor" : role === "director" ? "Rectorado" : "Padre de Familia"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* District info */}
          <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Acceso Oficial Autorizado:</span>
              <span>Conforme a las normativas de seguridad digital del Ministerio de Educación del Ecuador.</span>
            </div>
          </div>
        </div>

        {/* Security accreditation badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span>Servidores Seguros MinEduc • Distrito 17D01</span>
        </div>
      </div>
    </div>
  );
}
