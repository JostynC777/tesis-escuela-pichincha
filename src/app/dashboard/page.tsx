"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  School,
  ClipboardList,
  QrCode,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Settings,
  UserCheck,
} from "lucide-react";

interface DashboardMetrics {
  totalEstudiantes: number;
  cursosActivos: number;
  promedioEscuela: number;
  tieneNotas: boolean;
  asistenciaPorcentaje: number;
  tieneAsistencia: boolean;
  asistenciaSubtitulo: string;
  alertasDeceCount: number;
}

export default function DashboardHubPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>("admin");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEstudiantes: 0,
    cursosActivos: 0,
    promedioEscuela: 0,
    tieneNotas: false,
    asistenciaPorcentaje: 0,
    tieneAsistencia: false,
    asistenciaSubtitulo: "Sin registros hoy",
    alertasDeceCount: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Detectar rol del usuario autenticado
        let email = "";
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.email) email = authData.user.email;
        } catch {
          // fallback a storage local
        }

        if (!email && typeof window !== "undefined") {
          email =
            sessionStorage.getItem("escuela_user_email") ||
            localStorage.getItem("escuela_user_email") ||
            "";
          const storedRole =
            sessionStorage.getItem("escuela_user_role") ||
            localStorage.getItem("escuela_user_role");
          if (storedRole) setUserRole(storedRole.trim().toLowerCase());
        }

        if (email) {
          const { data: profile } = await supabase
            .from("perfiles_usuarios")
            .select("rol")
            .eq("correo", email.trim().toLowerCase())
            .maybeSingle();

          if (profile && (profile as { rol?: string }).rol) {
            setUserRole((profile as { rol: string }).rol.trim().toLowerCase());
          }
        }

        // 2. Consultar datos reales en paralelo
        const [
          { data: estudiantesData },
          { data: calificacionesData },
          { data: asistenciasData },
        ] = await Promise.all([
          supabase
            .from("estudiantes")
            .select("id, curso_id")
            .eq("activo", true),
          supabase
            .from("calificaciones")
            .select("estudiante_id, promedio_trimestral"),
          supabase
            .from("asistencias")
            .select("estudiante_id, fecha, estado")
            .order("fecha", { ascending: false }),
        ]);

        const estList = (estudiantesData || []) as { id: string; curso_id: string }[];
        const calList = (calificacionesData || []) as {
          estudiante_id: string;
          promedio_trimestral: number | null;
        }[];
        const attList = (asistenciasData || []) as {
          estudiante_id: string;
          fecha: string;
          estado: string;
        }[];

        // A. Población Total Lloa
        const totalEstudiantes = estList.length;
        const cursosActivos = new Set(estList.map((e) => e.curso_id).filter(Boolean)).size;

        // B. Promedio de la Escuela + agrupación por estudiante para DECE
        const studentGradesMap = new Map<string, { sum: number; count: number }>();
        let totalSumNotas = 0;
        let totalCountNotas = 0;

        calList.forEach((c) => {
          const val = Number(c.promedio_trimestral);
          if (!isNaN(val)) {
            totalSumNotas += val;
            totalCountNotas += 1;
            const prev = studentGradesMap.get(c.estudiante_id) || { sum: 0, count: 0 };
            studentGradesMap.set(c.estudiante_id, {
              sum: prev.sum + val,
              count: prev.count + 1,
            });
          }
        });

        const tieneNotas = totalCountNotas > 0;
        const promedioEscuela = tieneNotas
          ? Number((totalSumNotas / totalCountNotas).toFixed(2))
          : 0;

        // C. Asistencia Diaria QR (hoy o último día con registros)
        const todayIso = new Date().toISOString().slice(0, 10);
        let asistenciaPorcentaje = 0;
        let tieneAsistencia = false;
        let asistenciaSubtitulo = "Sin registros hoy";

        if (attList.length > 0) {
          const todayRecords = attList.filter((a) => a.fecha === todayIso);
          const targetDate = todayRecords.length > 0 ? todayIso : attList[0].fecha;
          const targetRecords =
            todayRecords.length > 0
              ? todayRecords
              : attList.filter((a) => a.fecha === targetDate);

          if (targetRecords.length > 0) {
            tieneAsistencia = true;
            const presentesOAtrasos = targetRecords.filter(
              (a) => a.estado === "PRESENTE" || a.estado === "ATRASO"
            ).length;
            asistenciaPorcentaje = Number(
              ((presentesOAtrasos / targetRecords.length) * 100).toFixed(1)
            );
            asistenciaSubtitulo =
              targetDate === todayIso
                ? "Jornada matutina activa"
                : `Último registro: ${targetDate}`;
          }
        }

        // D. Alertas Tempranas DECE (promedio < 7.00 o >= 3 faltas injustificadas)
        const deceStudentsSet = new Set<string>();
        studentGradesMap.forEach((stats, estId) => {
          const avg = stats.sum / stats.count;
          if (avg < 7.0) {
            deceStudentsSet.add(estId);
          }
        });

        const faltasMap = new Map<string, number>();
        attList.forEach((a) => {
          if (a.estado === "AUSENTE" || a.estado === "FALTA_INJUSTIFICADA") {
            const count = (faltasMap.get(a.estudiante_id) || 0) + 1;
            faltasMap.set(a.estudiante_id, count);
            if (count >= 3) {
              deceStudentsSet.add(a.estudiante_id);
            }
          }
        });

        setMetrics({
          totalEstudiantes,
          cursosActivos,
          promedioEscuela,
          tieneNotas,
          asistenciaPorcentaje,
          tieneAsistencia,
          asistenciaSubtitulo,
          alertasDeceCount: deceStudentsSet.size,
        });
      } catch (err) {
        console.error("Error cargando métricas del dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const isDocente = userRole === "docente";

  const teacherModules = [
    {
      title: "Módulo de Calificaciones 70/10/20",
      href: "/dashboard/teacher/grades",
      desc: "Ingreso de notas sobre 10 puntos (Formativa 70%, Proyecto 10%, Sumativa 20%) con cálculo automático instantáneo y guardado en Supabase.",
      icon: ClipboardList,
      badge: "Ponderación MINEDUC",
      btnText: "Ingresar Calificaciones 70/10/20",
      features: [
        "Ponderación oficial: Formativa (70%), Proyecto (10%), Sumativa (20%)",
        "Recálculo en tiempo real con inputs interactivos",
        "Estados automáticos: Aprobado (≥7), Supletorio (4-6.99), Reprobado (<4)",
      ],
    },
    {
      title: "Módulo de Asistencia Híbrida QR",
      href: "/dashboard/teacher/attendance",
      desc: "Generador de códigos dinámicos y respaldo manual para el registro rápido de asistencia diaria en las aulas de la Escuela Pichincha en Lloa.",
      icon: QrCode,
      badge: "QR & Manual",
      btnText: "Abrir Asistencia Híbrida",
      features: [
        "Generador de QR dinámico y escáner por carnet PICH-<cédula>",
        "Respaldo manual sincronizado en tiempo real",
        "Registro de presentes, atrasos y ausentes en Supabase",
      ],
    },
    {
      title: "Sábana General de Notas",
      href: "/dashboard/teacher",
      desc: "Consolidado anual por curso y asignatura con promedios de los 3 trimestres, escala MINEDUC y alertas tempranas DECE.",
      icon: UserCheck,
      badge: "Anual",
      btnText: "Ver Sábana General",
      features: [
        "Consolidado de Trimestre 1, 2 y 3 por estudiante",
        "Escala DAR, AAR, PAAR y NAAR automática",
        "Detección temprana DECE y exportación de actas CSV",
      ],
    },
    {
      title: "Planificaciones Curriculares",
      href: "/dashboard/teacher/planificaciones",
      desc: "Gestión y carga semanal de planificaciones microcurriculares en PDF sincronizadas con la aplicación móvil docente.",
      icon: BookOpen,
      badge: "PDF Semanal",
      btnText: "Gestionar Planificaciones",
      features: [
        "Subida y versionamiento de documentos PDF por semana",
        "Filtro por curso, asignatura y rango de fechas",
        "Visor integrado y descarga directa",
      ],
    },
  ];

  const adminModules = [
    teacherModules[0],
    teacherModules[1],
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
    {
      title: "Administración Institucional",
      href: "/dashboard/admin/settings",
      desc: "Gestión central de nómina y asignaciones docentes, cronograma escolar 2026-2027 y métricas de evaluación ministerial.",
      icon: Settings,
      badge: "Rectorado / Admin",
      btnText: "Configurar Institución",
      features: [
        "Nómina y asignaciones de asignaturas por docente",
        "Cronograma: Diagnóstico, Nivelación y Trimestre 1",
        "Ponderación bloqueada: Formativa 70%, Proyecto 10%, Prueba 20%",
      ],
    },
  ];

  const modules = isDocente ? teacherModules : adminModules;

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
            generar el código QR de asistencia o revisar los indicadores institucionales en tiempo real:
          </p>
        </div>
      </div>

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Quick Overview Metrics (Real-time Supabase) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">
            Promedio de la Escuela:
          </span>
          {loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-28 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metrics.promedioEscuela.toFixed(2)} / 10
              </div>
              <span
                className={`text-[10px] font-bold ${
                  !metrics.tieneNotas
                    ? "text-slate-500"
                    : metrics.promedioEscuela >= 7.0
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {!metrics.tieneNotas
                  ? "Sin notas registradas"
                  : metrics.promedioEscuela >= 7.0
                  ? "Aprobación regular"
                  : "Requiere refuerzo"}
              </span>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">
            Asistencia Diaria QR:
          </span>
          {loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-blue-700 font-mono">
                {metrics.tieneAsistencia ? `${metrics.asistenciaPorcentaje}%` : "0%"}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {metrics.asistenciaSubtitulo}
              </span>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">
            Alertas Tempranas DECE:
          </span>
          {loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-24 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {metrics.alertasDeceCount}{" "}
                {metrics.alertasDeceCount === 1 ? "Caso" : "Casos"}
              </div>
              <span className="text-[10px] text-rose-600 font-bold">
                Promedio &lt; 7.0/10 o 3+ faltas
              </span>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">
            Población Total Lloa:
          </span>
          {loading ? (
            <div className="space-y-2 py-1">
              <div className="h-7 w-28 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {metrics.totalEstudiantes}{" "}
                {metrics.totalEstudiantes === 1 ? "Estudiante" : "Estudiantes"}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {metrics.cursosActivos > 0
                  ? `En ${metrics.cursosActivos} ${
                      metrics.cursosActivos === 1 ? "curso activo" : "cursos activos"
                    }`
                  : "Inicial a Bachillerato"}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
