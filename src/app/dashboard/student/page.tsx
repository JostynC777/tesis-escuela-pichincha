"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import { formatGrade, getMinEducGradeScale } from "@/lib/utils";
import { Curso, Estudiante } from "@/types/database.types";
import {
  BookOpen,
  Award,
  ShieldAlert,
  Users,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Eye,
} from "lucide-react";

interface SubjectGradeSummary {
  asignaturaNombre: string;
  t1: number;
  t2: number;
  t3: number;
  promedio: number;
}

interface FamilyDECEAlert {
  id: string;
  tipo_alerta: string;
  nivel_riesgo: string;
  asunto: string;
  comunicado: string;
  estado: string;
  created_at: string;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ES";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentFamilyDashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStudentData, setLoadingStudentData] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("docente");

  const [courses, setCourses] = useState<Curso[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Estudiante[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [subjectGrades, setSubjectGrades] = useState<SubjectGradeSummary[]>([]);
  const [attendancePct, setAttendancePct] = useState<number>(100);
  const [attendanceTotal, setAttendanceTotal] = useState<number>(0);
  const [deceAlerts, setDeceAlerts] = useState<FamilyDECEAlert[]>([]);

  useEffect(() => {
    async function loadRoleAndStudents() {
      setLoading(true);
      try {
        const scope = await getUserCourseScope();
        setUserRole(scope.rol);

        const { data: coursesData } = await supabase
          .from("cursos")
          .select("*, tutor:perfiles_usuarios(id, nombres_completos)")
          .order("orden");
        const allCourses = (coursesData || []) as unknown as Curso[];

        // Caso 1: Estudiante o Familia -> solo su propio registro
        if (scope.rol === "estudiante" || scope.rol === "familia") {
          setCourses(allCourses);
          let studentQuery = supabase
            .from("estudiantes")
            .select("*, curso:cursos(id, nombre, tutor:perfiles_usuarios(id, nombres_completos)), tutor:perfiles_usuarios(id, nombres_completos)")
            .eq("activo", true);

          if (scope.cedula) {
            studentQuery = studentQuery.eq("cedula", scope.cedula);
          } else if (scope.nombresCompletos) {
            studentQuery = studentQuery.ilike("nombres_completos", `%${scope.nombresCompletos.split(" ")[0]}%`);
          }

          const { data: stData } = await studentQuery.limit(1);
          const list = (stData || []) as unknown as Estudiante[];
          setAvailableStudents(list);
          if (list.length > 0) setSelectedStudentId(list[0].id);
          setLoading(false);
          return;
        }

        // Caso 2: Docente -> solo cursos asignados; Admin/Rectorado/Directora -> todos los cursos
        const allowedCourseIds = scope.allowedCourseIds;
        const visibleCourses =
          allowedCourseIds !== null
            ? allCourses.filter((c) => allowedCourseIds.includes(c.id))
            : allCourses;
        setCourses(visibleCourses);

        if (allowedCourseIds !== null && allowedCourseIds.length === 0) {
          setAvailableStudents([]);
          setLoading(false);
          return;
        }

        let stQuery = supabase
          .from("estudiantes")
          .select("*, curso:cursos(id, nombre, tutor:perfiles_usuarios(id, nombres_completos)), tutor:perfiles_usuarios(id, nombres_completos)")
          .eq("activo", true)
          .order("apellidos");

        if (allowedCourseIds !== null) {
          stQuery = stQuery.in("curso_id", allowedCourseIds);
        }

        const { data: studentsData } = await stQuery;
        const stList = (studentsData || []) as unknown as Estudiante[];
        setAvailableStudents(stList);
        if (stList.length > 0) {
          setSelectedStudentId(stList[0].id);
        }
      } catch (err) {
        console.error("Error cargando portal de familias:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRoleAndStudents();
  }, []);

  const filteredStudentsForSelector = useMemo(() => {
    if (selectedCourseFilter === "ALL") return availableStudents;
    return availableStudents.filter((s) => s.curso_id === selectedCourseFilter);
  }, [availableStudents, selectedCourseFilter]);

  useEffect(() => {
    if (
      filteredStudentsForSelector.length > 0 &&
      !filteredStudentsForSelector.some((s) => s.id === selectedStudentId)
    ) {
      setSelectedStudentId(filteredStudentsForSelector[0].id);
    }
  }, [filteredStudentsForSelector, selectedStudentId]);

  const loadStudentDetails = useCallback(async (studentId: string) => {
    if (!studentId) {
      setSubjectGrades([]);
      setDeceAlerts([]);
      return;
    }
    setLoadingStudentData(true);
    try {
      const [calRes, attRes, alertRes] = await Promise.all([
        supabase
          .from("calificaciones")
          .select("trimestre, promedio_trimestral, asignatura:asignaturas(nombre)")
          .eq("estudiante_id", studentId),
        supabase
          .from("asistencias")
          .select("estado")
          .eq("estudiante_id", studentId),
        (supabase as any)
          .from("alertas_dece")
          .select("id, tipo_alerta, nivel_riesgo, asunto, comunicado, estado, created_at")
          .eq("estudiante_id", studentId)
          .eq("visible_familia", true)
          .order("created_at", { ascending: false }),
      ]);

      // Agrupar calificaciones por asignatura
      const bySubject = new Map<string, { t1: number; t2: number; t3: number }>();
      (calRes.data || []).forEach((c: any) => {
        const name = c.asignatura?.nombre || "Asignatura";
        const cur = bySubject.get(name) || { t1: 0, t2: 0, t3: 0 };
        const val = Number(c.promedio_trimestral || 0);
        if (c.trimestre === 1) cur.t1 = val;
        if (c.trimestre === 2) cur.t2 = val;
        if (c.trimestre === 3) cur.t3 = val;
        bySubject.set(name, cur);
      });

      const summaries: SubjectGradeSummary[] = Array.from(bySubject.entries()).map(
        ([asignaturaNombre, vals]) => ({
          asignaturaNombre,
          t1: vals.t1,
          t2: vals.t2,
          t3: vals.t3,
          promedio: Number(((vals.t1 + vals.t2 + vals.t3) / 3).toFixed(2)),
        })
      );
      setSubjectGrades(summaries);

      // Calcular asistencia
      const attList = (attRes.data || []) as { estado: string }[];
      setAttendanceTotal(attList.length);
      if (attList.length > 0) {
        const okCount = attList.filter(
          (a) => a.estado === "PRESENTE" || a.estado === "ATRASO" || a.estado === "JUSTIFICADO"
        ).length;
        setAttendancePct(Math.round((okCount / attList.length) * 100));
      } else {
        setAttendancePct(100);
      }

      // Comunicados DECE
      if (!alertRes.error && alertRes.data) {
        setDeceAlerts(alertRes.data as FamilyDECEAlert[]);
      } else {
        setDeceAlerts([]);
      }
    } catch (err) {
      console.error("Error cargando detalle estudiantil:", err);
    } finally {
      setLoadingStudentData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentDetails(selectedStudentId);
    }
  }, [selectedStudentId, loadStudentDetails]);

  const activeStudent = useMemo(
    () => availableStudents.find((s) => s.id === selectedStudentId) || null,
    [availableStudents, selectedStudentId]
  );

  const generalAverage = useMemo(() => {
    if (subjectGrades.length === 0) return 0;
    const sum = subjectGrades.reduce((acc, s) => acc + s.promedio, 0);
    return Number((sum / subjectGrades.length).toFixed(2));
  }, [subjectGrades]);

  const isStaffPreview =
    userRole !== "estudiante" && userRole !== "familia";

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center gap-3 text-xs font-bold text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
        <span>Cargando Portal de Familias desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Barra de Previsualización para Docente / Admin / Rectorado */}
      {isStaffPreview && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-900">
            <Eye className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Vista Previa de Familia:</strong> Seleccione uno de sus estudiantes asignados para revisar su libreta y comunicados DECE.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-bold text-slate-800"
            >
              <option value="ALL">Todos mis cursos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-bold text-slate-800 min-w-[220px]"
            >
              {filteredStudentsForSelector.length === 0 ? (
                <option value="">Sin estudiantes disponibles</option>
              ) : (
                filteredStudentsForSelector.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.apellidos} {st.nombres} ({st.cedula})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {!activeStudent ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800">
            No se encontraron estudiantes asignados
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Verifica tus asignaciones de curso o el padrón de estudiantes en Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Student Profile Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
                  {getInitials(
                    activeStudent.nombres_completos ||
                      `${activeStudent.nombres} ${activeStudent.apellidos}`
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {activeStudent.curso?.nombre || "Curso Asignado"}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">
                      QR: {activeStudent.codigo_qr}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {activeStudent.nombres_completos ||
                      `${activeStudent.nombres} ${activeStudent.apellidos}`}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium flex flex-wrap items-center gap-2">
                    <span>C.I.: {activeStudent.cedula}</span>
                    <span>•</span>
                    <span>
                      Tutor(a):{" "}
                      {(activeStudent.curso as any)?.tutor?.nombres_completos ||
                        activeStudent.tutor?.nombres_completos ||
                        "Docente Titular"}
                    </span>
                    {activeStudent.nombre_representante && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-blue-600" />
                          Rep: {activeStudent.nombre_representante}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Promedio Anual
                  </span>
                  <span className="text-2xl font-black font-mono text-blue-700">
                    {formatGrade(generalAverage)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Sobre 10 pts
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Asistencia Total
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-700">
                    {attendancePct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {attendanceTotal > 0 ? `${attendanceTotal} registros` : "Sin faltas"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Comunicados DECE
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-700">
                    {deceAlerts.length}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Notificaciones</span>
                </div>
              </div>
            </div>
          </div>

          {/* Libreta de Calificaciones Trimestrales */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                  <h3 className="text-lg font-black text-slate-900">
                    Libreta Escolar de Calificaciones Trimestrales
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escala oficial MINEDUC: DAR (9-10), AAR (7-8.99), PAAR (4.01-6.99), NAAR (≤4).
                </p>
              </div>

              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                Año Lectivo 2026 - 2027
              </span>
            </div>

            {loadingStudentData ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <span>Sincronizando libreta desde Supabase...</span>
              </div>
            ) : subjectGrades.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Aún no existen calificaciones trimestrales registradas para este estudiante.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                      <th className="py-3 px-3">Asignatura</th>
                      <th className="py-3 px-3 text-center">1er Trimestre</th>
                      <th className="py-3 px-3 text-center">2do Trimestre</th>
                      <th className="py-3 px-3 text-center">3er Trimestre</th>
                      <th className="py-3 px-3 text-center">Promedio Anual</th>
                      <th className="py-3 px-3 text-center">Escala MinEduc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectGrades.map((mat) => {
                      const scale = getMinEducGradeScale(mat.promedio);
                      return (
                        <tr key={mat.asignaturaNombre} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3 font-bold text-slate-900">
                            {mat.asignaturaNombre}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {formatGrade(mat.t1)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {formatGrade(mat.t2)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {formatGrade(mat.t3)}
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-black text-sm text-blue-700">
                            {formatGrade(mat.promedio)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scale.badgeClass}`}
                            >
                              {scale.code}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Comunicados DECE */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-lg font-black text-slate-900">
                Comunicados DECE y Seguimiento Estudiantil
              </h3>
            </div>

            {deceAlerts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  El estudiante no registra alertas ni comunicados DECE pendientes.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {deceAlerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-4 rounded-2xl border ${
                      al.nivel_riesgo === "CRITICO"
                        ? "bg-rose-50/70 border-rose-200"
                        : al.nivel_riesgo === "MODERADO"
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-black text-slate-900">{al.asunto}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                          {al.tipo_alerta} • {al.nivel_riesgo}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(al.created_at).toLocaleDateString("es-EC")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{al.comunicado}</p>
                    <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase">
                      Estado: {al.estado.replace("_", " ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
