"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import { Curso, Asignatura } from "@/types/database.types";
import { DynamicQRGenerator } from "@/components/dashboard/DynamicQRGenerator";
import { GradeEditorModal, StudentGradeRecord } from "@/components/dashboard/GradeEditorModal";
import { EarlyWarningBadge } from "@/components/dashboard/EarlyWarningBadge";
import { formatGrade, getMinEducGradeScale } from "@/lib/utils";
import {
  School,
  ClipboardList,
  Search,
  Edit3,
  Download,
  Users,
  CheckCircle2,
  Phone,
  QrCode,
  BookOpen,
  Loader2,
} from "lucide-react";

export default function TeacherGradesDashboardPage() {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [subjects, setSubjects] = useState<Asignatura[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [docenteId, setDocenteId] = useState<string>("");

  const [students, setStudents] = useState<StudentGradeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [scaleFilter, setScaleFilter] = useState("TODOS");

  const [editingStudent, setEditingStudent] = useState<StudentGradeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cargar cursos, asignaturas y docente activo con filtro estricto por rol
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [scope, { data: coursesData }, { data: subjectsData }] =
          await Promise.all([
            getUserCourseScope(),
            supabase
              .from("cursos")
              .select("*, tutor:perfiles_usuarios(id, nombres_completos)")
              .order("orden"),
            supabase.from("asignaturas").select("*").order("nombre"),
          ]);

        const allCourses = (coursesData || []) as unknown as Curso[];
        const visibleCourses =
          scope.allowedCourseIds !== null
            ? allCourses.filter((c) => scope.allowedCourseIds!.includes(c.id))
            : allCourses;

        const sList = (subjectsData || []) as unknown as Asignatura[];
        setCourses(visibleCourses);
        setSubjects(sList);

        if (visibleCourses.length > 0) {
          setSelectedCourseId(visibleCourses[0].id);
        } else {
          setSelectedCourseId("");
          setLoading(false);
        }

        if (sList.length > 0) {
          const defaultSubject =
            sList.find((s) => s.nombre.toLowerCase().includes("ciencias")) || sList[0];
          setSelectedSubjectId(defaultSubject.id);
        }

        if (scope.profileId) {
          setDocenteId(scope.profileId);
        }
      } catch (err) {
        console.error("Error cargando catalogos:", err);
        setLoading(false);
      }
    }
    loadCatalogs();
  }, []);

  const currentClass = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  // Cargar estudiantes, calificaciones (3 trimestres) y asistencias
  const fetchSabanaData = useCallback(async () => {
    if (!selectedCourseId || !selectedSubjectId) return;
    setLoading(true);
    try {
      const [{ data: studentsData }, { data: gradesData }, { data: attData }] =
        await Promise.all([
          supabase
            .from("estudiantes")
            .select("*")
            .eq("curso_id", selectedCourseId)
            .eq("activo", true)
            .order("apellidos"),
          supabase
            .from("calificaciones")
            .select("estudiante_id, trimestre, promedio_trimestral, observaciones")
            .eq("curso_id", selectedCourseId)
            .eq("asignatura_id", selectedSubjectId),
          supabase
            .from("asistencias")
            .select("estudiante_id, estado")
            .eq("curso_id", selectedCourseId),
        ]);

      const gradesByStudent = new Map<string, { t1: number; t2: number; t3: number; obs: string }>();
      (gradesData || []).forEach((g: any) => {
        const current = gradesByStudent.get(g.estudiante_id) || { t1: 0, t2: 0, t3: 0, obs: "" };
        const prom = Number(g.promedio_trimestral || 0);
        if (g.trimestre === 1) current.t1 = prom;
        if (g.trimestre === 2) current.t2 = prom;
        if (g.trimestre === 3) current.t3 = prom;
        if (g.observaciones) current.obs = g.observaciones;
        gradesByStudent.set(g.estudiante_id, current);
      });

      const attByStudent = new Map<string, { total: number; present: number; faltas: number }>();
      (attData || []).forEach((a: any) => {
        const cur = attByStudent.get(a.estudiante_id) || { total: 0, present: 0, faltas: 0 };
        cur.total += 1;
        if (a.estado === "PRESENTE" || a.estado === "ATRASO" || a.estado === "JUSTIFICADO") {
          cur.present += 1;
        } else if (a.estado === "AUSENTE") {
          cur.faltas += 1;
        }
        attByStudent.set(a.estudiante_id, cur);
      });

      const courseName = currentClass?.nombre || "Curso Asignado";

      const records: StudentGradeRecord[] = (studentsData || []).map((st: any) => {
        const gr = gradesByStudent.get(st.id) || { t1: 0, t2: 0, t3: 0, obs: "" };
        const att = attByStudent.get(st.id) || { total: 0, present: 0, faltas: 0 };

        const promedioAnual = Number(((gr.t1 + gr.t2 + gr.t3) / 3).toFixed(2));
        const asistenciaPorcentaje =
          att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;
        const scale = getMinEducGradeScale(promedioAnual);

        let alertaRiesgo: "normal" | "moderado" | "critico" = "normal";
        if (promedioAnual < 6.0 || att.faltas >= 3) {
          alertaRiesgo = "critico";
        } else if (promedioAnual < 7.0) {
          alertaRiesgo = "moderado";
        }

        return {
          id: st.id,
          studentCode: st.codigo_qr || `PICH-${st.cedula}`,
          studentName: st.nombres_completos || `${st.apellidos} ${st.nombres}`,
          gradeAndSection: courseName,
          parentName: st.nombre_representante || "Representante registrado",
          parentPhone: st.telefono_representante || "Sin teléfono",
          trimestre1: gr.t1,
          trimestre2: gr.t2,
          trimestre3: gr.t3,
          promedioAnual,
          asistenciaPorcentaje,
          faltasInjustificadas: att.faltas,
          escalaMinEduc: scale.code,
          alertaRiesgo,
          motivoAlerta: gr.obs || st.observacion_dece || "",
        };
      });

      setStudents(records);
    } catch (err) {
      console.error("Error cargando sabana anual:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedSubjectId, currentClass?.nombre]);

  useEffect(() => {
    fetchSabanaData();
  }, [fetchSabanaData]);

  const handleEditGrade = (student: StudentGradeRecord) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveGrade = async (updated: StudentGradeRecord) => {
    if (!selectedCourseId || !selectedSubjectId || !docenteId) return;

    try {
      const trimestresPayload = [
        { trimestre: 1, val: updated.trimestre1 },
        { trimestre: 2, val: updated.trimestre2 },
        { trimestre: 3, val: updated.trimestre3 },
      ].map((t) => ({
        estudiante_id: updated.id,
        curso_id: selectedCourseId,
        asignatura_id: selectedSubjectId,
        docente_id: docenteId,
        trimestre: t.trimestre,
        nota_formativa: Number(t.val.toFixed(2)),
        nota_proyecto: Number(t.val.toFixed(2)),
        nota_sumativa: Number(t.val.toFixed(2)),
        observaciones: updated.motivoAlerta || null,
      }));

      const { error } = await (supabase.from("calificaciones") as any).upsert(
        trimestresPayload,
        { onConflict: "estudiante_id,asignatura_id,trimestre" }
      );

      if (error) throw error;

      const deceLevel =
        updated.alertaRiesgo === "normal" ? "estable" : updated.alertaRiesgo;
      await (supabase.from("estudiantes") as any)
        .update({
          alerta_dece: deceLevel,
          observacion_dece: updated.motivoAlerta || null,
        })
        .eq("id", updated.id);

      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`Notas trimestrales guardadas en Supabase para ${updated.studentName}`);
    } catch (err: any) {
      showToast("Error al guardar: " + (err?.message || "intente nuevamente"));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Código QR",
      "Estudiante",
      "T1",
      "T2",
      "T3",
      "Promedio Anual",
      "Asistencia %",
      "Escala MINEDUC",
      "Alerta DECE",
    ];
    const rows = students.map((s) => [
      s.studentCode,
      `"${s.studentName}"`,
      s.trimestre1.toFixed(2),
      s.trimestre2.toFixed(2),
      s.trimestre3.toFixed(2),
      s.promedioAnual.toFixed(2),
      `${s.asistenciaPorcentaje}%`,
      s.escalaMinEduc,
      s.alertaRiesgo.toUpperCase(),
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `sabana_anual_${(currentClass?.nombre || "curso").replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (scaleFilter === "TODOS") return matchesSearch;
    return matchesSearch && s.escalaMinEduc === scaleFilter;
  });

  const classAverage = useMemo(() => {
    if (students.length === 0) return "0.00";
    const sum = students.reduce((acc, s) => acc + s.promedioAnual, 0);
    return (sum / students.length).toFixed(2);
  }, [students]);

  const classAttendanceAvg = useMemo(() => {
    if (students.length === 0) return 100;
    const sum = students.reduce((acc, s) => acc + s.asistenciaPorcentaje, 0);
    return Math.round(sum / students.length);
  }, [students]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Grado / Curso Asignado
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {currentClass?.nombre || "Cargando cursos..."}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {courses.slice(0, 5).map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedCourseId(cls.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCourseId === cls.id
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cls.nombre}
              </button>
            ))}

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold focus:border-blue-600 outline-none"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre}
                </option>
              ))}
            </select>

            <Link
              href="/dashboard/teacher/grades"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 text-white hover:bg-blue-800 text-xs font-bold transition-all shadow-sm"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Registro Trimestral 70/10/20</span>
            </Link>

            <Link
              href="/dashboard/teacher/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-700" />
              <span>Módulo Asistencia Híbrida</span>
            </Link>

            <Link
              href="/dashboard/teacher/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
              <span>Mis Planificaciones</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Docente Tutora:</span>
            <span className="font-bold text-slate-800">
              {currentClass?.tutor?.nombres_completos || "Docente Asignado"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Alumnos Matriculados:</span>
            <span className="font-bold text-blue-700">{students.length} estudiantes</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Promedio del Grado:</span>
            <span className="font-bold text-emerald-700">{classAverage} / 10.00 pts</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Asistencia Promedio:</span>
            <span className="font-bold text-slate-800">{classAttendanceAvg}%</span>
          </div>
        </div>
      </div>

      <DynamicQRGenerator
        courseId={currentClass?.id}
        classNameTitle={currentClass?.nombre || "Curso"}
        classCode={currentClass?.nombre || "PICHINCHA"}
      />

      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg font-black text-slate-900">
                Sábana General Anual y Calificaciones por Trimestres (MinEduc)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Notas evaluadas sobre 10 puntos con cálculo automático del promedio anual, escala MINEDUC y Alertas DECE.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar alumno o representante..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white outline-none"
              />
            </div>

            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium focus:border-blue-600 outline-none"
            >
              <option value="TODOS">Todas las Escalas</option>
              <option value="DAR">Solo DAR (9 - 10 pts)</option>
              <option value="AAR">Solo AAR (7 - 8.99 pts)</option>
              <option value="PAAR">Solo PAAR (4.01 - 6.99 pts)</option>
              <option value="NAAR">Solo NAAR (&le; 4 pts)</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={students.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Exportar Acta</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-3">Estudiante & Representante</th>
                <th className="py-3 px-3 text-center">1er Trimestre</th>
                <th className="py-3 px-3 text-center">2do Trimestre</th>
                <th className="py-3 px-3 text-center">3er Trimestre</th>
                <th className="py-3 px-3 text-center">Promedio Anual</th>
                <th className="py-3 px-3 text-center">Asistencia</th>
                <th className="py-3 px-3 text-center">Escala MinEduc</th>
                <th className="py-3 px-3 text-center">Alerta DECE</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
                      <span>Cargando sábana general desde Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((std) => {
                  const scale = getMinEducGradeScale(std.promedioAnual);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {std.studentName}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            {std.studentCode}
                          </span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-blue-600" />
                            <span>
                              {std.parentName} • {std.parentPhone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                        {formatGrade(std.trimestre1)}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                        {formatGrade(std.trimestre2)}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                        {formatGrade(std.trimestre3)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {formatGrade(std.promedioAnual)}
                        </span>
                        <span className="text-[10px] text-slate-400">sobre 10 pts</span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            std.asistenciaPorcentaje >= 85
                              ? "text-emerald-700"
                              : std.asistenciaPorcentaje >= 75
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {std.asistenciaPorcentaje}%
                        </span>
                        {(std.faltasInjustificadas || 0) > 0 && (
                          <span className="block text-[10px] text-rose-600 font-semibold">
                            {std.faltasInjustificadas} falta(s)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scale.badgeClass}`}
                        >
                          {scale.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <EarlyWarningBadge level={std.alertaRiesgo} />
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleEditGrade(std)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-700 text-blue-700 hover:text-white border border-blue-200 transition-all font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center p-8 bg-slate-50/80 rounded-3xl border border-dashed border-slate-300">
                      <Users className="w-10 h-10 text-slate-400 mb-3" />
                      <h4 className="text-sm font-black text-slate-800 mb-1">
                        No hay estudiantes registrados en este curso
                      </h4>
                      <p className="text-xs text-slate-500">
                        Matricule estudiantes desde Gestión de Estudiantes o ejecute el script SQL de Fase 2.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GradeEditorModal
        student={editingStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGrade}
      />
    </div>
  );
}
