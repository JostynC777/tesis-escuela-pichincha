"use client";

import React from "react";
import Link from "next/link";
import {
  School,
  ClipboardList,
  QrCode,
  BarChart3,
  ArrowRight,
  ShieldAlert,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";

export default function DashboardHubPage() {
  const modules = [
    {
      title: "Módulo de Calificaciones",
      href: "/dashboard/teacher",
      desc: "Ingreso de notas sobre 10 puntos divididas por trimestres con cálculo automático del promedio anual y escala MinEduc.",
      icon: ClipboardList,
      badge: "Docentes Tutores",
      btnText: "Ingresar Calificaciones",
      features: [
        "Notas trimestrales sobre 10 puntos (T1, T2, T3)",
        "Escala oficial: DAR (9-10), AAR (7-8.99), PAAR (4.01-6.99)",
        "Recálculo inmediato de promedios anuales",
      ],
    },
    {
      title: "Módulo de Asistencia QR",
      href: "/dashboard/teacher",
      desc: "Generador de códigos para el registro rápido de asistencia diaria en las aulas de la Escuela Pichincha en Lloa.",
      icon: QrCode,
      badge: "Control Diario",
      btnText: "Generar Código QR",
      features: [
        "Generador de QR matutino para proyección o tablet",
        "PIN de respaldo manual de 4 dígitos",
        "Registro de presentes, atrasos y faltas en vivo",
      ],
    },
    {
      title: "Analítica de Riesgo (Recharts)",
      href: "/dashboard/analytics",
      desc: "Dashboard visual para el rectorado con índices de asistencia y alertas tempranas de estudiantes con notas < 7/10 para prevenir la deserción.",
      icon: BarChart3,
      badge: "Rectorado & DECE",
      btnText: "Ver Analítica de Riesgo",
      features: [
        "Gráficos Recharts por materias y asistencia mensual",
        "Semáforo rojo/amarillo/verde de alerta temprana",
        "Fichas de intervención DECE y visitas domiciliarias",
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
            <School className="w-4 h-4 text-blue-700" />
            <span>Escuela de Educación Básica &quot;Pichincha&quot; • Lloa, Quito</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Panel de Gestión Escolar & Prevención de Deserción
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Bienvenido al sistema administrativo y docente de la Escuela Pichincha. 
            Seleccione el módulo que desea gestionar para ingresar calificaciones trimestrales, 
            generar el código QR de asistencia o revisar la analítica institucional del rectorado:
          </p>
        </div>
      </div>

      {/* 3 Main Role Modules requested */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {m.badge}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  {m.desc}
                </p>

                <div className="space-y-2 mb-6">
                  {m.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={m.href}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs text-white bg-blue-700 hover:bg-blue-800 shadow transition-all"
              >
                <span>{m.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">Promedio de la Escuela:</span>
          <div className="text-2xl font-black text-slate-900 font-mono">7.96 / 10</div>
          <span className="text-[10px] text-emerald-700 font-bold">Aprobación regular</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">Asistencia Diaria QR:</span>
          <div className="text-2xl font-black text-blue-700 font-mono">89.4%</div>
          <span className="text-[10px] text-slate-500">Jornada matutina activa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">Alertas Tempranas DECE:</span>
          <div className="text-2xl font-black text-rose-700 font-mono">5 Casos</div>
          <span className="text-[10px] text-rose-600 font-bold">Promedios &lt; 7.0/10</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">Población Total Lloa:</span>
          <div className="text-2xl font-black text-emerald-700 font-mono">430 Niños</div>
          <span className="text-[10px] text-slate-500">Inicial a 10mo EGB</span>
        </div>
      </div>
    </div>
  );
}
