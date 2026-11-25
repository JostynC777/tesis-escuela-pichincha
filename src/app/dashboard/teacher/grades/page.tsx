"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import { Curso, Asignatura } from "@/types/database.types";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Save,
  RefreshCw,
  BookOpen,
  ChevronRight,
  Lock,
  Award,
  ArrowLeft,
  FileSpreadsheet,
  Info,
  Users,
  Loader2,
} from "lucide-react";

interface StudentGradeRow {
  id: string;
  studentCode: string;
  studentName: string;
  cedula: string;
  formativa: number;
  proyecto: number;
  sumativa: number;
  promedio: number;
  estado: "APROBADO" | "SUPLETORIO" | "REPROBADO";
}

function calculatePromedio(formativa: number, proyecto: number, sumativa: number): number {
  const f = isNaN(formativa) ? 0 : Math.min(10, Math.max(0, formativa));
  const p = isNaN(proyecto) ? 0 : Math.min(10, Math.max(0, proyecto));
  const s = isNaN(sumativa) ? 0 : Math.min(10, Math.max(0, sumativa));
  return Number((f * 0.7 + p * 0.1 + s * 0.2).toFixed(2));
}

function getEstadoGrade(promedio: number): "APROBADO" | "SUPLETORIO" | "REPROBADO" {
  if (promedio >= 7.0) return "APROBADO";
  if (promedio >= 4.0) return "SUPLETORIO";
  return "REPROBADO";
}

const TRIMESTRES_DISPONIBLES = [
  { value: 1, label: "Primer Trimestre" },
  { value: 2, label: "Segundo Trimestre" },
  { value: 3, label: "Tercer Trimestre" },
];

export default function TeacherGradesPage() {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [subjects, setSubjects] = useState<Asignatura[]>([]);
  const [docenteId, setDocenteId] = useState<string>("");

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar catalogos iniciales y perfil docente activo con filtro estricto por rol
  useEffect(() => {
    async function loadInitialCatalogs() {
      try {
        const [scope, { data: coursesData }, { data: subjectsData }] =
          await Promise.all([
            getUserCourseScope(),
            supabase.from("cursos").select("*").order("orden"),
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
    loadInitialCatalogs();
  }, []);

  // Cargar estudiantes y calificaciones desde Supabase
  const fetchGradesData = useCallback(async () => {
    if (!selectedCourseId || !selectedSubjectId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const [{ data: studentsData, error: stErr }, { data: gradesData, error: grErr }] =
        await Promise.all([
          supabase
            .from("estudiantes")
            .select("id, cedula, nombres, apellidos, nombres_completos, codigo_qr")
            .eq("curso_id", selectedCourseId)
            .eq("activo", true)
            .order("apellidos"),
          supabase
            .from("calificaciones")
            .select("estudiante_id, nota_formativa, nota_proyecto, nota_sumativa")
            .eq("curso_id", selectedCourseId)
            .eq("asignatura_id", selectedSubjectId)
            .eq("trimestre", selectedTerm),
        ]);

      if (stErr) throw stErr;
      if (grErr) throw grErr;

      const gradeMap = new Map<string, any>();
      (gradesData || []).forEach((g: any) => {
        gradeMap.set(g.estudiante_id, g);
      });

      const rows: StudentGradeRow[] = (studentsData || []).map((st: any) => {
        const g = gradeMap.get(st.id);
        const f = g ? Number(g.nota_formativa) : 0;
        const p = g ? Number(g.nota_proyecto) : 0;
        const s = g ? Number(g.nota_sumativa) : 0;
        const prom = calculatePromedio(f, p, s);
        return {
          id: st.id,
          studentCode: st.codigo_qr || `PICH-${st.cedula}`,
          studentName: st.nombres_completos || `${st.apellidos} ${st.nombres}`,
          cedula: st.cedula,
          formativa: f,
          proyecto: p,
          sumativa: s,
          promedio: prom,
          estado: getEstadoGrade(prom),
        };
      });

      setStudents(rows);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al cargar calificaciones desde Supabase.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedSubjectId, selectedTerm]);

  useEffect(() => {
    fetchGradesData();
  }, [fetchGradesData]);

  const handleGradeChange = (
    studentId: string,
    field: "formativa" | "proyecto" | "sumativa",
    rawValue: string
  ) => {
    const parsed = rawValue === "" ? 0 : parseFloat(rawValue);
    if (isNaN(parsed)) return;
    const clampedValue = Math.min(10, Math.max(0, parsed));

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const updated = { ...student, [field]: clampedValue };
        const newPromedio = calculatePromedio(
          updated.formativa,
          updated.proyecto,
          updated.sumativa
        );
        return {
          ...updated,
          promedio: newPromedio,
          estado: getEstadoGrade(newPromedio),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedCourseId || !selectedSubjectId || students.length === 0) return;
    if (!docenteId) {
      setErrorMsg("No se identificó un docente activo para registrar la calificación.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = students.map((st) => ({
        estudiante_id: st.id,
        curso_id: selectedCourseId,
        asignatura_id: selectedSubjectId,
        docente_id: docenteId,
        trimestre: selectedTerm,
        nota_formativa: Number(st.formativa.toFixed(2)),
        nota_proyecto: Number(st.proyecto.toFixed(2)),
        nota_sumativa: Number(st.sumativa.toFixed(2)),
      }));

      const { error } = await (supabase.from("calificaciones") as any).upsert(
        payload,
        { onConflict: "estudiante_id,asignatura_id,trimestre" }
      );

      if (error) throw error;

      setSavedSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al guardar calificaciones en Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCourseName =
    courses.find((c) => c.id === selectedCourseId)?.nombre || "Curso";
  const selectedSubjectName =
    subjects.find((s) => s.id === selectedSubjectId)?.nombre || "Asignatura";
  const selectedTermLabel =
    TRIMESTRES_DISPONIBLES.find((t) => t.value === selectedTerm)?.label || "Trimestre";

  const handleDownloadCSV = () => {
    const headers = [
      "Código",
      "Estudiante",
      "Cédula",
      "Grado",
      "Asignatura",
      "Trimestre",
      "Formativa (70%)",
      "Proyecto (10%)",
      "Sumativa (20%)",
      "Promedio Final",
      "Estado",
    ];

    const rows = students.map((s) => [
      s.studentCode,
      `"${s.studentName}"`,
      s.cedula,
      `"${selectedCourseName}"`,
      `"${selectedSubjectName}"`,
      `"${selectedTermLabel}"`,
      s.formativa.toFixed(2),
      s.proyecto.toFixed(2),
      s.sumativa.toFixed(2),
      s.promedio.toFixed(2),
      s.estado,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `acta_calificaciones_${selectedCourseName.replace(/\s+/g, "_")}_T${selectedTerm}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cedula.includes(searchQuery)
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { promedio: 0, aprobados: 0, supletorios: 0, reprobados: 0 };
    const sumPromedios = students.reduce((acc, s) => acc + s.promedio, 0);
    return {
      promedio: Number((sumPromedios / total).toFixed(2)),
      aprobados: students.filter((s) => s.estado === "APROBADO").length,
      supletorios: students.filter((s) => s.estado === "SUPLETORIO").length,
      reprobados: students.filter((s) => s.estado === "REPROBADO").length,
    };
  }, [students]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/teacher"
              className="text-xs font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Sábana Anual</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              MINEDUC Ecuador
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-700 text-white shadow-sm">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span>Registro de Calificaciones</span>
          </h1>

          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Ingreso y cálculo automático de calificaciones trimestrales (70/10/20) conectado a Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchGradesData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5"
            title="Recargar desde Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={students.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Descargar Acta</span>
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={isSaving || students.length === 0}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Guardando..." : "Guardar Calificaciones"}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-black">¡Calificaciones guardadas en Supabase!</p>
              <p className="text-[11px] text-emerald-700">
                Los promedios de {selectedCourseName} ({selectedSubjectName}) han sido sincronizados.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
            Sincronizado
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-2.5 text-xs font-bold">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Filter className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
            Criterios de Evaluación y Asignación Docente
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Grado / Curso Asignado:
            </label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              >
                {courses.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Asignatura:
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              >
                {subjects.map((asig) => (
                  <option key={asig.id} value={asig.id}>
                    {asig.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Trimestre Lectivo:
            </label>
            <div className="relative">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
                className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              >
                {TRIMESTRES_DISPONIBLES.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Ponderación Oficial Bloqueada por Sistema (Acuerdo Ministerial)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Fórmula Automática 70/10/20
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50/80 rounded-2xl p-5 border-2 border-blue-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="px-2.5 py-1 rounded-full bg-blue-700 text-white text-xs font-black">70%</div>
            </div>
            <h3 className="text-sm font-black text-blue-950 mb-1">Evaluación Formativa</h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Tareas individuales, talleres grupales, lecciones orales y escritas realizadas durante el trimestre.
            </p>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-5 border-2 border-amber-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div className="px-2.5 py-1 rounded-full bg-amber-600 text-white text-xs font-black">10%</div>
            </div>
            <h3 className="text-sm font-black text-amber-950 mb-1">Proyecto Integrador</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Fase trimestral del proyecto interdisciplinario escolar con aplicación práctica en Lloa.
            </p>
          </div>

          <div className="bg-emerald-50/80 rounded-2xl p-5 border-2 border-emerald-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-black">20%</div>
            </div>
            <h3 className="text-sm font-black text-emerald-950 mb-1">Evaluación Sumativa</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Prueba estructurada objetiva de base de conocimientos al concluir el período trimestral.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Promedio del Aula
          </span>
          <span className="text-xl font-black text-slate-900">
            {stats.promedio.toFixed(2)} <span className="text-xs text-slate-400 font-bold">/ 10</span>
          </span>
        </div>

        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Aprobados (≥ 7.00)
          </span>
          <span className="text-xl font-black text-emerald-700">
            {stats.aprobados}{" "}
            <span className="text-xs font-semibold text-emerald-600">
              ({students.length > 0 ? Math.round((stats.aprobados / students.length) * 100) : 0}%)
            </span>
          </span>
        </div>

        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Supletorio (4.00 - 6.99)
          </span>
          <span className="text-xl font-black text-amber-700">
            {stats.supletorios}{" "}
            <span className="text-xs font-semibold text-amber-600">
              ({students.length > 0 ? Math.round((stats.supletorios / students.length) * 100) : 0}%)
            </span>
          </span>
        </div>

        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Reprobados (&lt; 4.00)
          </span>
          <span className="text-xl font-black text-rose-700">
            {stats.reprobados}{" "}
            <span className="text-xs font-semibold text-rose-600">
              ({students.length > 0 ? Math.round((stats.reprobados / students.length) * 100) : 0}%)
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Nómina y Registro de Notas Calificadas</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {filteredStudents.length} estudiantes
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Cambios sin guardar
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingrese calificaciones sobre 10.00. El promedio final se calcula instantáneamente.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">Estudiante</th>
                <th className="py-3.5 px-3 text-center min-w-[130px]">Nota Formativa (70%)</th>
                <th className="py-3.5 px-3 text-center min-w-[130px]">Nota Proyecto (10%)</th>
                <th className="py-3.5 px-3 text-center min-w-[130px]">Nota Sumativa (20%)</th>
                <th className="py-3.5 px-3 text-center min-w-[120px]">Promedio Final</th>
                <th className="py-3.5 px-4 text-center min-w-[130px]">Estado Académico</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-700" />
                      <span>Cargando nómina y calificaciones desde Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs shrink-0">
                          {student.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {student.studentName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span>C.I: {student.cedula}</span>
                            <span>•</span>
                            <span>{student.studentCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={student.formativa === 0 ? "" : student.formativa}
                        placeholder="0.00"
                        onChange={(e) => handleGradeChange(student.id, "formativa", e.target.value)}
                        className="w-24 text-center font-bold text-xs py-1.5 px-2 bg-blue-50/50 hover:bg-white text-blue-900 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={student.proyecto === 0 ? "" : student.proyecto}
                        placeholder="0.00"
                        onChange={(e) => handleGradeChange(student.id, "proyecto", e.target.value)}
                        className="w-24 text-center font-bold text-xs py-1.5 px-2 bg-amber-50/50 hover:bg-white text-amber-900 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={student.sumativa === 0 ? "" : student.sumativa}
                        placeholder="0.00"
                        onChange={(e) => handleGradeChange(student.id, "sumativa", e.target.value)}
                        className="w-24 text-center font-bold text-xs py-1.5 px-2 bg-emerald-50/50 hover:bg-white text-emerald-900 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-sm font-black ${
                            student.promedio >= 7.0
                              ? "text-emerald-700"
                              : student.promedio >= 4.0
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {student.promedio.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">/ 10.00</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {student.estado === "APROBADO" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>APROBADO</span>
                        </span>
                      )}
                      {student.estado === "SUPLETORIO" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>SUPLETORIO</span>
                        </span>
                      )}
                      {student.estado === "REPROBADO" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>REPROBADO</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center p-8 bg-slate-50/80 rounded-3xl border border-dashed border-slate-300">
                      <Users className="w-10 h-10 text-slate-400 mb-3" />
                      <h4 className="text-sm font-black text-slate-800 mb-1">
                        No hay estudiantes registrados en {selectedCourseName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Verifique la nómina en Gestión de Estudiantes o ejecute el script SQL de Fase 2.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Escala Ministerial:</strong> Aprobado (≥ 7.00) • Supletorio (4.00 - 6.99) • Reprobado (&lt; 4.00)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-semibold">
            <span>Fórmula: (Formativa × 0.70) + (Proyecto × 0.10) + (Sumativa × 0.20)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
