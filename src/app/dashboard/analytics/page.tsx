"use client";

import React, { useState } from "react";
import {
  SUBJECT_PERFORMANCE_DATA,
  MONTHLY_ATTENDANCE_DATA,
  DECE_RISK_STUDENTS,
  RiskStudentReport,
} from "@/lib/mockData";
import { EarlyWarningBadge } from "@/components/dashboard/EarlyWarningBadge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  School,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  ShieldAlert,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Phone,
  Mail,
  Home,
  HeartHandshake,
} from "lucide-react";

export default function AnalyticsRiskDashboardPage() {
  const [riskFilter, setRiskFilter] = useState<"all" | "critico" | "moderado" | "estable">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [interventionToast, setInterventionToast] = useState<string | null>(null);

  const filteredStudents = DECE_RISK_STUDENTS.filter((std) => {
    const matchesSearch =
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.causaRiesgo.toLowerCase().includes(searchTerm.toLowerCase());

    if (riskFilter === "all") return matchesSearch;
    return matchesSearch && std.nivelRiesgo === riskFilter;
  });

  const handleAction = (studentName: string, actionType: string) => {
    setInterventionToast(`Protocolo activado: "${actionType}" para el estudiante ${studentName}. Notificación enviada al DECE.`);
    setTimeout(() => setInterventionToast(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Toast Alert */}
      {interventionToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-blue-900 text-white shadow-2xl flex items-center gap-3 animate-fadeIn border border-blue-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{interventionToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
              <School className="w-4 h-4 text-blue-700" />
              <span>Dirección & Rectorado Institucional • Escuela Pichincha (Lloa)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Analítica de Rendimiento & Prevención de Deserción Escolar
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
              Monitoreo visual de asistencia y sistema de alerta temprana para estudiantes con promedios inferiores a 7.0/10 puntos conforme a los lineamientos del Ministerio de Educación.
            </p>
          </div>

          <button
            onClick={() => alert("Generando informe consolidado para el Distrito Educativo 17D01...")}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white shadow flex items-center gap-2 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe DECE</span>
          </button>
        </div>
      </div>

      {/* 4 Quantitative KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block mb-1">Promedio General Escuela</span>
          <div className="text-3xl font-black text-slate-900 font-mono">7.96</div>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> Sobre el mínimo MinEduc (7.0)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block mb-1">Asistencia Promedio Lloa</span>
          <div className="text-3xl font-black text-blue-700 font-mono">89.4%</div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Verificado por registro QR matutino
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block mb-1">Estudiantes en Riesgo &lt; 7.0</span>
          <div className="text-3xl font-black text-rose-700 font-mono">5 Casos</div>
          <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Con intervención DECE activa
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block mb-1">Tasa de Retención Escolar</span>
          <div className="text-3xl font-black text-emerald-700 font-mono">98.2%</div>
          <span className="text-[11px] text-emerald-700 font-bold block mt-1">
            Meta de cero deserción en Lloa
          </span>
        </div>
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: BarChart - Promedio General por Materia vs Meta MinEduc (7.0) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
                <span>Promedio General por Asignatura vs Meta MinEduc (7.0 pts)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparativo de rendimiento escolar trimestral en las áreas fundamentales del currículo básico.
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={SUBJECT_PERFORMANCE_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="materia"
                    stroke="#64748B"
                    fontSize={11}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar
                    dataKey="promedio"
                    name="Promedio de la Escuela"
                    fill="#1D4ED8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="metaMinEduc"
                    name="Mínimo Requerido (7.00)"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Área prioritaria de refuerzo: <strong className="text-amber-700">Matemáticas (6.90 pts)</strong></span>
            <span>Área con mayor destreza: <strong className="text-emerald-700">Educación Física (9.40 pts)</strong></span>
          </div>
        </div>

        {/* Chart 2: AreaChart - Índices de Asistencia Mensual por Subnivel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <span>Evolución Mensual de Asistencia Escolar</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Porcentaje mensual de asistencia presencial por subnivel (Sep a Feb)
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MONTHLY_ATTENDANCE_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mes" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[70, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="Media"
                    name="Básica Media"
                    stroke="#1D4ED8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMedia)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Superior"
                    name="Básica Superior"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="Elemental"
                    name="Básica Elemental"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Nota: La caída en enero coincidió con temporada invernal en la vía Lloa - Guagua Pichincha.</span>
          </div>
        </div>

      </div>

      {/* Sistema de Alerta Temprana DECE (Semáforo de Riesgo < 7.0 / Prevención de Deserción) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Header & Semaphore Filter Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-black text-slate-900">
                Sistema de Alerta Temprana de Deserción Escolar (MinEduc & DECE)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Detección de niñas y niños con promedio menor a 7.0/10 o asistencia crítica para activar protocolos de apoyo familiar y pedagógico.
            </p>
          </div>

          {/* Semaphore filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRiskFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                riskFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({DECE_RISK_STUDENTS.length})
            </button>
            <button
              onClick={() => setRiskFilter("critico")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                riskFilter === "critico"
                  ? "bg-rose-700 text-white shadow"
                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Riesgo Crítico (&lt; 6.0)</span>
            </button>
            <button
              onClick={() => setRiskFilter("moderado")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                riskFilter === "moderado"
                  ? "bg-amber-600 text-white shadow"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>En Riesgo (6.0 - 6.99)</span>
            </button>
            <button
              onClick={() => setRiskFilter("estable")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                riskFilter === "estable"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Estable (&ge; 7.0)</span>
            </button>
          </div>
        </div>

        {/* Semaphore Criteria Explanation Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-800">
              🔴 Nivel Rojo (Crítico): Promedio &lt; 6.0 o Asistencia &lt; 70%
            </span>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Riesgo inminente de reprobación y abandono. Se activa visita domiciliaria del DECE y citación al representante.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-amber-800">
              🟡 Nivel Amarillo (Moderado): Promedio 6.00 - 6.99 pts
            </span>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Próximo a alcanzar los aprendizajes (PAAR). Plan obligatorio de refuerzo pedagógico extracurricular en aula.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              🟢 Nivel Verde (Estable): Promedio &ge; 7.00 pts
            </span>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Estudiante con desempeño regular o destacado (AAR / DAR). Asistencia continua y regular en Lloa.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, grado o diagnóstico..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando {filteredStudents.length} estudiantes
          </span>
        </div>

        {/* Risk Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-3">Estudiante & Grado</th>
                <th className="py-3 px-3 text-center">Promedio</th>
                <th className="py-3 px-3 text-center">Asistencia</th>
                <th className="py-3 px-3 text-center">Semáforo</th>
                <th className="py-3 px-3">Diagnóstico de Riesgo</th>
                <th className="py-3 px-3">Protocolo DECE Recomendado</th>
                <th className="py-3 px-3 text-right">Acción Rectorado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      {std.name}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {std.grade} • Paralelo {std.parallel} • Tutor: {std.tutor}
                    </span>
                    <div className="text-[10px] text-blue-700 font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>Contacto: {std.telefonoContacto}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono font-black text-sm">
                    <span className={std.promedio < 7.0 ? "text-rose-700" : "text-emerald-700"}>
                      {std.promedio.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono font-bold">
                    <span className={std.asistencia < 70 ? "text-rose-700" : std.asistencia < 80 ? "text-amber-700" : "text-emerald-700"}>
                      {std.asistencia}%
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <EarlyWarningBadge level={std.nivelRiesgo} />
                  </td>

                  <td className="py-3.5 px-3 text-slate-600 text-xs max-w-xs">
                    {std.causaRiesgo}
                  </td>

                  <td className="py-3.5 px-3 text-blue-900 text-xs font-medium max-w-xs">
                    {std.seguimientoDECE}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {std.nivelRiesgo === "critico" ? (
                        <button
                          onClick={() => handleAction(std.name, "Visita Domiciliaria DECE")}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                        >
                          <Home className="w-3 h-3" />
                          <span>Activar Visita</span>
                        </button>
                      ) : std.nivelRiesgo === "moderado" ? (
                        <button
                          onClick={() => handleAction(std.name, "Plan de Refuerzo de Tareas")}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1"
                        >
                          <HeartHandshake className="w-3 h-3" />
                          <span>Refuerzo</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(std.name, "Reconocimiento a la Familia")}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs border border-emerald-300 flex items-center gap-1"
                        >
                          <span>Felicitación</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
