"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import { Curso, Estudiante } from "@/types/database.types";
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
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  Plus,
  X,
  Send,
  Loader2,
  Clock,
  FileWarning,
  RefreshCw,
} from "lucide-react";

type TipoAlertaDECE = "ACADEMICA" | "ASISTENCIA" | "CONDUCTUAL" | "PSICOSOCIAL";
type NivelRiesgoDECE = "LEVE" | "MODERADO" | "CRITICO";
type EstadoAlertaDECE = "ABIERTA" | "EN_SEGUIMIENTO" | "RESUELTA";

interface AlertaDECERow {
  id: string;
  estudiante_id: string;
  docente_id: string | null;
  curso_id: string;
  tipo_alerta: TipoAlertaDECE;
  nivel_riesgo: NivelRiesgoDECE;
  asunto: string;
  comunicado: string;
  estado: EstadoAlertaDECE;
  visible_familia: boolean;
  created_at: string;
  estudiante?: { nombres: string; apellidos: string; cedula: string; codigo_qr: string } | null;
  curso?: { nombre: string } | null;
  docente?: { nombres_completos: string } | null;
}

export default function AnalyticsRiskDashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>("admin");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [courses, setCourses] = useState<Curso[]>([]);
  const [students, setStudents] = useState<Estudiante[]>([]);
  const [alertas, setAlertas] = useState<AlertaDECERow[]>([]);
  const [subjectChartData, setSubjectChartData] = useState<{ subject: string; promedio: number }[]>([]);
  const [courseAttendanceData, setCourseAttendanceData] = useState<{ curso: string; asistencia: number }[]>([]);

  const [kpis, setKpis] = useState({
    promedioGeneral: 0,
    tieneNotas: false,
    asistenciaPromedio: 0,
    tieneAsistencia: false,
    estudiantesEnRiesgo: 0,
    alertasActivas: 0,
  });

  // Filtros de la tabla de alertas
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal Nuevo Comunicado / Reporte DECE
  const [showNewAlertModal, setShowNewAlertModal] = useState<boolean>(false);
  const [formCourseId, setFormCourseId] = useState<string>("");
  const [formStudentId, setFormStudentId] = useState<string>("");
  const [formTipo, setFormTipo] = useState<TipoAlertaDECE>("ACADEMICA");
  const [formNivel, setFormNivel] = useState<NivelRiesgoDECE>("MODERADO");
  const [formAsunto, setFormAsunto] = useState<string>("");
  const [formComunicado, setFormComunicado] = useState<string>("");
  const [formVisibleFamilia, setFormVisibleFamilia] = useState<boolean>(true);
  const [isSavingAlert, setIsSavingAlert] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const scope = await getUserCourseScope();
      setCurrentUserId(scope.profileId);
      setUserRole(scope.rol);

      const { data: coursesData } = await supabase.from("cursos").select("*").order("orden");
      const allCourses = (coursesData || []) as unknown as Curso[];

      const allowedCourseIds = scope.allowedCourseIds;
      const visibleCourses =
        allowedCourseIds !== null
          ? allCourses.filter((c) => allowedCourseIds.includes(c.id))
          : allCourses;

      setCourses(visibleCourses);
      if (visibleCourses.length > 0 && !formCourseId) {
        setFormCourseId(visibleCourses[0].id);
      }

      if (allowedCourseIds !== null && allowedCourseIds.length === 0) {
        setStudents([]);
        setAlertas([]);
        setSubjectChartData([]);
        setCourseAttendanceData([]);
        setKpis({
          promedioGeneral: 0,
          tieneNotas: false,
          asistenciaPromedio: 0,
          tieneAsistencia: false,
          estudiantesEnRiesgo: 0,
          alertasActivas: 0,
        });
        setLoading(false);
        return;
      }

      let stQuery = supabase
        .from("estudiantes")
        .select("*")
        .eq("activo", true)
        .order("apellidos");
      let calQuery = supabase
        .from("calificaciones")
        .select("estudiante_id, curso_id, promedio_trimestral, asignatura:asignaturas(nombre)");
      let attQuery = supabase
        .from("asistencias")
        .select("estudiante_id, curso_id, estado");
      let alertQuery = (supabase as any)
        .from("alertas_dece")
        .select("*, estudiante:estudiantes(nombres, apellidos, cedula, codigo_qr), curso:cursos(nombre), docente:perfiles_usuarios!docente_id(nombres_completos)")
        .order("created_at", { ascending: false });

      if (allowedCourseIds !== null) {
        stQuery = stQuery.in("curso_id", allowedCourseIds);
        calQuery = calQuery.in("curso_id", allowedCourseIds);
        attQuery = attQuery.in("curso_id", allowedCourseIds);
        alertQuery = alertQuery.in("curso_id", allowedCourseIds);
      }

      const [stRes, calRes, attRes, alertRes] = await Promise.all([
        stQuery,
        calQuery,
        attQuery,
        alertQuery,
      ]);

      const stList = (stRes.data || []) as unknown as Estudiante[];
      const calList = (calRes.data || []) as any[];
      const attList = (attRes.data || []) as any[];
      const alertList = !alertRes.error && alertRes.data ? (alertRes.data as AlertaDECERow[]) : [];

      setStudents(stList);
      setAlertas(alertList);

      // Promedio general + por asignatura + riesgo por estudiante
      let totalSum = 0;
      let totalCount = 0;
      const bySubject = new Map<string, { sum: number; count: number }>();
      const byStudentGrade = new Map<string, { sum: number; count: number }>();

      calList.forEach((c) => {
        const val = Number(c.promedio_trimestral);
        if (!isNaN(val)) {
          totalSum += val;
          totalCount += 1;

          const subName = c.asignatura?.nombre || "General";
          const curSub = bySubject.get(subName) || { sum: 0, count: 0 };
          bySubject.set(subName, { sum: curSub.sum + val, count: curSub.count + 1 });

          const curSt = byStudentGrade.get(c.estudiante_id) || { sum: 0, count: 0 };
          byStudentGrade.set(c.estudiante_id, { sum: curSt.sum + val, count: curSt.count + 1 });
        }
      });

      const subChart = Array.from(bySubject.entries()).map(([subject, data]) => ({
        subject: subject.length > 16 ? subject.slice(0, 15) + "…" : subject,
        promedio: Number((data.sum / data.count).toFixed(2)),
      }));
      setSubjectChartData(subChart);

      // Asistencia promedio + por curso + faltas por estudiante
      let attPresent = 0;
      const byCourseAtt = new Map<string, { present: number; total: number }>();
      const faltasByStudent = new Map<string, number>();

      attList.forEach((a) => {
        const isOk = a.estado === "PRESENTE" || a.estado === "ATRASO" || a.estado === "JUSTIFICADO";
        if (isOk) attPresent += 1;
        if (a.estado === "AUSENTE" || a.estado === "FALTA_INJUSTIFICADA") {
          faltasByStudent.set(a.estudiante_id, (faltasByStudent.get(a.estudiante_id) || 0) + 1);
        }

        const cCur = byCourseAtt.get(a.curso_id) || { present: 0, total: 0 };
        byCourseAtt.set(a.curso_id, {
          present: cCur.present + (isOk ? 1 : 0),
          total: cCur.total + 1,
        });
      });

      const courseAttChart = visibleCourses.map((c) => {
        const d = byCourseAtt.get(c.id);
        return {
          curso: c.nombre,
          asistencia: d && d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
        };
      });
      setCourseAttendanceData(courseAttChart);

      const riskStudents = new Set<string>();
      byStudentGrade.forEach((g, estId) => {
        if (g.sum / g.count < 7.0) riskStudents.add(estId);
      });
      faltasByStudent.forEach((count, estId) => {
        if (count >= 3) riskStudents.add(estId);
      });

      const alertasActivas = alertList.filter((a) => a.estado !== "RESUELTA").length;

      setKpis({
        promedioGeneral: totalCount > 0 ? Number((totalSum / totalCount).toFixed(2)) : 0,
        tieneNotas: totalCount > 0,
        asistenciaPromedio: attList.length > 0 ? Number(((attPresent / attList.length) * 100).toFixed(1)) : 0,
        tieneAsistencia: attList.length > 0,
        estudiantesEnRiesgo: riskStudents.size,
        alertasActivas,
      });
    } catch (err: any) {
      console.error("Error cargando analítica DECE:", err);
      showToast("Error al sincronizar datos DECE: " + (err?.message || ""), "error");
    } finally {
      setLoading(false);
    }
  }, [formCourseId]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Estudiantes filtrados para el curso elegido en el modal
  const studentsForModalCourse = useMemo(() => {
    return students.filter((s) => s.curso_id === formCourseId);
  }, [students, formCourseId]);

  useEffect(() => {
    if (studentsForModalCourse.length > 0) {
      setFormStudentId(studentsForModalCourse[0].id);
    } else {
      setFormStudentId("");
    }
  }, [studentsForModalCourse]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseId || !formStudentId || !formAsunto.trim() || !formComunicado.trim()) {
      showToast("Completa todos los campos obligatorios.", "error");
      return;
    }

    setIsSavingAlert(true);
    try {
      const { error } = await (supabase as any).from("alertas_dece").insert({
        estudiante_id: formStudentId,
        docente_id: currentUserId || null,
        curso_id: formCourseId,
        tipo_alerta: formTipo,
        nivel_riesgo: formNivel,
        asunto: formAsunto.trim(),
        comunicado: formComunicado.trim(),
        estado: "ABIERTA",
        visible_familia: formVisibleFamilia,
      });

      if (error) throw error;

      showToast("Comunicado / Reporte DECE registrado en Supabase", "success");
      setShowNewAlertModal(false);
      setFormAsunto("");
      setFormComunicado("");
      await fetchAnalyticsData();
    } catch (err: any) {
      showToast("Error al guardar alerta DECE: " + (err?.message || "Verifica haber ejecutado fase3_dece_asignaciones.sql"), "error");
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, newStatus: EstadoAlertaDECE) => {
    try {
      const { error } = await (supabase as any)
        .from("alertas_dece")
        .update({ estado: newStatus })
        .eq("id", alertId);

      if (error) throw error;
      setAlertas((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, estado: newStatus } : a))
      );
      showToast(`Estado actualizado a ${newStatus}`, "success");
    } catch (err: any) {
      showToast("Error al actualizar estado: " + (err?.message || ""), "error");
    }
  };

  const filteredAlertas = useMemo(() => {
    return alertas.filter((a) => {
      const stName = a.estudiante
        ? `${a.estudiante.apellidos} ${a.estudiante.nombres}`.toLowerCase()
        : "";
      const matchesSearch =
        searchTerm === "" ||
        stName.includes(searchTerm.toLowerCase()) ||
        a.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.curso?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "TODOS" || a.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [alertas, searchTerm, statusFilter]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl text-white shadow-xl flex items-center gap-3 ${
            toast.type === "error" ? "bg-rose-700" : "bg-emerald-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span className="text-xs font-bold">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {userRole === "docente"
                ? "Seguimiento Docente • Mis Cursos Asignados"
                : "Rectorado & DECE • Analítica Institucional"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Alertas Tempranas DECE y Prevención de Riesgo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicadores calculados en tiempo real desde Supabase y gestión de comunicados preventivos para familias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setShowNewAlertModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Comunicado / Reporte DECE</span>
          </button>
        </div>
      </div>

      {/* KPIs Reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Promedio Académico
          </span>
          {loading ? (
            <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-black text-slate-900 font-mono">
              {kpis.promedioGeneral.toFixed(2)} / 10
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium">
            {kpis.tieneNotas ? "Calculado desde calificaciones" : "Sin notas registradas"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Asistencia Real
          </span>
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-black text-blue-700 font-mono">
              {kpis.tieneAsistencia ? `${kpis.asistenciaPromedio}%` : "0%"}
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium">
            {kpis.tieneAsistencia ? "Presentes y atrasos registrados" : "Sin registros aún"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Estudiantes en Riesgo
          </span>
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-black text-rose-700 font-mono">
              {kpis.estudiantesEnRiesgo} {kpis.estudiantesEnRiesgo === 1 ? "Caso" : "Casos"}
            </div>
          )}
          <span className="text-[10px] text-rose-600 font-bold">
            Promedio &lt; 7.0 o 3+ faltas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Reportes DECE Activos
          </span>
          {loading ? (
            <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-black text-amber-700 font-mono">
              {kpis.alertasActivas}
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium">
            Abiertos o en seguimiento
          </span>
        </div>
      </div>

      {/* Gráficos Recharts con Datos Reales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-black text-slate-900">
              Rendimiento Promedio por Asignatura (Real)
            </h3>
          </div>
          <div className="h-64">
            {subjectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="promedio" name="Promedio / 10" fill="#1D4ED8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay calificaciones registradas para graficar.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900">
              Porcentaje de Asistencia por Curso (Real)
            </h3>
          </div>
          <div className="h-64">
            {courseAttendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="curso" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="asistencia" name="% Asistencia" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No hay registros de asistencia para graficar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla en tiempo real de Comunicados y Alertas DECE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-rose-600" />
              <span>Historial de Comunicados y Alertas DECE ({filteredAlertas.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seguimiento en vivo de reportes académicos, asistencia y conducta vinculados con las familias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar estudiante o asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-600 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ABIERTA">Abierta</option>
              <option value="EN_SEGUIMIENTO">En Seguimiento</option>
              <option value="RESUELTA">Resuelta</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Estudiante & Curso</th>
                <th className="py-3 px-4">Tipo / Riesgo</th>
                <th className="py-3 px-4">Asunto y Comunicado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Cargando alertas DECE...</span>
                  </td>
                </tr>
              ) : filteredAlertas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No existen comunicados DECE registrados para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAlertas.map((al) => {
                  const badgeLevel =
                    al.nivel_riesgo === "CRITICO"
                      ? "critico"
                      : al.nivel_riesgo === "MODERADO"
                      ? "moderado"
                      : "normal";
                  return (
                    <tr key={al.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {al.estudiante
                            ? `${al.estudiante.apellidos} ${al.estudiante.nombres}`
                            : "Estudiante"}
                        </span>
                        <span className="text-[11px] text-blue-700 font-semibold">
                          {al.curso?.nombre || "Curso"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-700 text-[11px] mb-1">
                          {al.tipo_alerta}
                        </span>
                        <EarlyWarningBadge level={badgeLevel} />
                      </td>

                      <td className="py-3.5 px-4 max-w-md">
                        <span className="font-bold text-slate-900 block">{al.asunto}</span>
                        <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                          {al.comunicado}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(al.created_at).toLocaleDateString("es-EC")} •{" "}
                          {al.visible_familia ? "Visible para familia" : "Solo uso interno"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            al.estado === "RESUELTA"
                              ? "bg-emerald-100 text-emerald-800"
                              : al.estado === "EN_SEGUIMIENTO"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {al.estado.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {al.estado !== "EN_SEGUIMIENTO" && al.estado !== "RESUELTA" && (
                          <button
                            onClick={() => handleUpdateAlertStatus(al.id, "EN_SEGUIMIENTO")}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold"
                          >
                            Seguimiento
                          </button>
                        )}
                        {al.estado !== "RESUELTA" && (
                          <button
                            onClick={() => handleUpdateAlertStatus(al.id, "RESUELTA")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                          >
                            Resolver
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Comunicado / Reporte DECE */}
      {showNewAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Nuevo Comunicado / Reporte DECE
                </h3>
              </div>
              <button
                onClick={() => setShowNewAlertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Curso Asignado: *
                  </label>
                  <select
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estudiante: *
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {studentsForModalCourse.length === 0 ? (
                      <option value="">Sin estudiantes</option>
                    ) : (
                      studentsForModalCourse.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.apellidos} {s.nombres}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Alerta: *
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as TipoAlertaDECE)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="ACADEMICA">Académica</option>
                    <option value="ASISTENCIA">Asistencia</option>
                    <option value="CONDUCTUAL">Conductual</option>
                    <option value="PSICOSOCIAL">Psicosocial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nivel de Riesgo: *
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(e.target.value as NivelRiesgoDECE)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="LEVE">Leve</option>
                    <option value="MODERADO">Moderado</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asunto: *</label>
                <input
                  type="text"
                  value={formAsunto}
                  onChange={(e) => setFormAsunto(e.target.value)}
                  required
                  placeholder="Ej. Convocatoria a refuerzo académico / Control de faltas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comunicado / Detalle del Seguimiento: *
                </label>
                <textarea
                  rows={3}
                  value={formComunicado}
                  onChange={(e) => setFormComunicado(e.target.value)}
                  required
                  placeholder="Describa la observación pedagógica o citación para el representante..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formVisibleFamilia}
                  onChange={(e) => setFormVisibleFamilia(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700"
                />
                <span>Visible en el Portal de Familias del estudiante</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewAlertModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAlert || !formStudentId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isSavingAlert ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Enviar Reporte DECE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
