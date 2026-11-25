"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  PerfilUsuario,
  Curso,
  Asignatura,
  DocenteAsignaturaCurso,
} from "@/types/database.types";
import {
  Settings,
  Users,
  Calendar,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  School,
  BookOpen,
  Plus,
  Search,
  Filter,
  Clock,
  Check,
  X,
  Layers,
  GraduationCap,
  Info,
  Loader2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Video,
  KeyRound,
  UserPlus,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"docentes" | "cursos" | "asignaturas" | "evaluacion">("docentes");

  // Datos principales
  const [teachers, setTeachers] = useState<PerfilUsuario[]>([]);
  const [courses, setCourses] = useState<Curso[]>([]);
  const [subjects, setSubjects] = useState<Asignatura[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modales
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<PerfilUsuario | null>(null);

  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Curso | null>(null);

  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Asignatura | null>(null);

  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [activeTeacherForAssign, setActiveTeacherForAssign] = useState<PerfilUsuario | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "docente" | "curso" | "asignatura"; id: string; name: string } | null>(null);

  // Filtros
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState<string>("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Cargar datos desde Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes, dacRes] = await Promise.all([
        supabase.from("perfiles_usuarios").select("*").order("nombres_completos"),
        supabase.from("cursos").select("*, tutor:perfiles_usuarios(id, nombres_completos)").order("orden"),
        supabase.from("asignaturas").select("*").order("nombre"),
        supabase.from("docente_asignatura_curso").select("*, docente:perfiles_usuarios(nombres_completos, correo), asignatura:asignaturas(nombre), curso:cursos(nombre)"),
      ]);

      if (tRes.data) setTeachers(tRes.data as unknown as PerfilUsuario[]);
      if (cRes.data) setCourses(cRes.data as unknown as Curso[]);
      if (sRes.data) setSubjects(sRes.data as unknown as Asignatura[]);
      if (dacRes.data) setAssignments(dacRes.data as any[]);
    } catch (err: any) {
      console.error("Error al cargar datos de administracion:", err);
      showToast("Error de conexion al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------------------------------
  // DOCENTES: GUARDAR / CREAR / EDITAR
  // --------------------------------------------------------------------------
  const handleSaveTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cedula = String(formData.get("cedula") || "").trim();
    const nombres_completos = String(formData.get("nombres_completos") || "").trim();
    const correo = String(formData.get("correo") || "").trim().toLowerCase();
    const telefono = String(formData.get("telefono") || "").trim() || null;
    const cargo = String(formData.get("cargo") || "Docente Titular").trim();
    const titulo_academico = String(formData.get("titulo_academico") || "").trim() || null;
    const rol = String(formData.get("rol") || "docente") as "admin" | "docente";

    if (!nombres_completos || !correo) {
      showToast("Nombres completos y correo son requeridos", "error");
      return;
    }

    try {
      if (editingTeacher) {
        const { error } = await (supabase.from("perfiles_usuarios") as any)
          .update({
            cedula: cedula || null,
            nombres_completos,
            correo,
            telefono,
            cargo,
            titulo_academico,
            rol,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTeacher.id);

        if (error) throw error;
        showToast("Docente actualizado exitosamente", "success");
      } else {
        const { error } = await (supabase.from("perfiles_usuarios") as any).insert([
          {
            cedula: cedula || null,
            nombres_completos,
            correo,
            telefono,
            cargo,
            titulo_academico,
            rol,
            activo: true,
          },
        ]);

        if (error) throw error;
        showToast(`Credenciales y perfil creados para ${nombres_completos}`, "success");
      }

      setShowTeacherModal(false);
      setEditingTeacher(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al guardar docente:", err);
      showToast("Error: " + err.message, "error");
    }
  };

  // --------------------------------------------------------------------------
  // CURSOS: GUARDAR / CREAR / EDITAR
  // --------------------------------------------------------------------------
  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") || "").trim();
    const nivel = String(formData.get("nivel") || "").trim();
    const especialidad = String(formData.get("especialidad") || "").trim() || null;
    const orden = parseInt(String(formData.get("orden") || "1"), 10);
    const tutor_id = String(formData.get("tutor_id") || "") || null;

    if (!nombre || !nivel) {
      showToast("Nombre y nivel son requeridos", "error");
      return;
    }

    try {
      if (editingCourse) {
        const { error } = await (supabase.from("cursos") as any)
          .update({
            nombre,
            nivel,
            especialidad,
            orden,
            tutor_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCourse.id);

        if (error) throw error;
        showToast("Curso actualizado correctamente", "success");
      } else {
        const { error } = await (supabase.from("cursos") as any).insert([
          {
            nombre,
            nivel,
            especialidad,
            orden,
            tutor_id,
          },
        ]);

        if (error) throw error;
        showToast(`Curso ${nombre} creado con exito`, "success");
      }

      setShowCourseModal(false);
      setEditingCourse(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al guardar curso:", err);
      showToast("Error: " + err.message, "error");
    }
  };

  // --------------------------------------------------------------------------
  // ASIGNATURAS: GUARDAR / CREAR / EDITAR
  // --------------------------------------------------------------------------
  const handleSaveSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = String(formData.get("nombre") || "").trim();
    const area = String(formData.get("area") || "Tronco Común").trim();

    if (!nombre) {
      showToast("El nombre de la materia es requerido", "error");
      return;
    }

    try {
      if (editingSubject) {
        const { error } = await (supabase.from("asignaturas") as any)
          .update({ nombre, area })
          .eq("id", editingSubject.id);

        if (error) throw error;
        showToast("Asignatura actualizada con éxito", "success");
      } else {
        const { error } = await (supabase.from("asignaturas") as any).insert([{ nombre, area }]);
        if (error) throw error;
        showToast(`Materia ${nombre} agregada con éxito`, "success");
      }

      setShowSubjectModal(false);
      setEditingSubject(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al guardar asignatura:", err);
      showToast("Error: " + err.message, "error");
    }
  };

  // --------------------------------------------------------------------------
  // ASIGNACION DOCENTE: CARGA HORARIA
  // --------------------------------------------------------------------------
  const handleSaveAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeTeacherForAssign) return;

    const formData = new FormData(e.currentTarget);
    const curso_id = String(formData.get("curso_id"));
    const asignatura_id = String(formData.get("asignatura_id"));
    const horas_semanales = parseInt(String(formData.get("horas_semanales") || "4"), 10);

    try {
      const { error } = await (supabase.from("docente_asignatura_curso") as any).upsert(
        [
          {
            docente_id: activeTeacherForAssign.id,
            curso_id,
            asignatura_id,
            horas_semanales,
            periodo_lectivo: "2026-2027",
            activo: true,
          },
        ],
        { onConflict: "docente_id,asignatura_id,curso_id" }
      );

      if (error) throw error;
      showToast("Carga académica asignada exitosamente", "success");
      setShowAssignmentModal(false);
      setActiveTeacherForAssign(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al asignar materia:", err);
      showToast("Error en asignación: " + err.message, "error");
    }
  };

  // --------------------------------------------------------------------------
  // ELIMINACION GENERICA
  // --------------------------------------------------------------------------
  const executeDelete = async () => {
    if (!deleteConfirm) return;

    try {
      let table = "";
      if (deleteConfirm.type === "docente") table = "perfiles_usuarios";
      else if (deleteConfirm.type === "curso") table = "cursos";
      else if (deleteConfirm.type === "asignatura") table = "asignaturas";

      const { error } = await supabase.from(table).delete().eq("id", deleteConfirm.id);
      if (error) throw error;

      showToast(`${deleteConfirm.name} eliminado correctamente`, "info");
      setDeleteConfirm(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      showToast("No se pudo eliminar: " + err.message, "error");
    }
  };

  // Filtrado de docentes
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = teacherSearch.toLowerCase();
      return (
        t.nombres_completos.toLowerCase().includes(q) ||
        (t.correo && t.correo.toLowerCase().includes(q)) ||
        (t.cargo && t.cargo.toLowerCase().includes(q)) ||
        (t.cedula && t.cedula.includes(q))
      );
    });
  }, [teachers, teacherSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all animate-slide-up ${
            toast.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : toast.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-blue-900 text-white border-blue-700"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === "info" && <Check className="w-4 h-4 text-blue-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Rectorado y Dirección • Gestión Integral</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Administración Académica e Institucional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mantenimiento general de Docentes, Cursos, Materias, Asignaciones de Carga y Enlace Directo a Microsoft Teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Gestión Estudiantes</span>
          </Link>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab("docentes")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "docentes"
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Docentes ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("cursos")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "cursos"
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <School className="w-4 h-4" />
          <span>Grados y Cursos ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("asignaturas")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "asignaturas"
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Materias / Asignaturas ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("evaluacion")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "evaluacion"
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Cronograma & 70/10/20</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: DOCENTES Y ENLACE A MICROSOFT TEAMS                           */}
      {/* ========================================================================= */}
      {activeTab === "docentes" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar docente por nombre o correo..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <button
              onClick={() => {
                setEditingTeacher(null);
                setShowTeacherModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Docente / Credenciales</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((doc) => {
              // Microsoft Teams deep link oficial
              const teamsChatUrl = `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(doc.correo)}`;

              return (
                <div
                  key={doc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          doc.rol === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        {doc.rol === "admin" ? "Directora / Admin" : "Docente Titular"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTeacher(doc);
                            setShowTeacherModal(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          title="Editar perfil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {doc.rol !== "admin" && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: "docente",
                                id: doc.id,
                                name: doc.nombres_completos,
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Eliminar docente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {doc.nombres_completos}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {doc.cargo || "Docente"}
                    </p>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2 text-[11px] truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700 truncate">{doc.correo}</span>
                      </div>
                      {doc.telefono && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700">{doc.telefono}</span>
                        </div>
                      )}
                      {doc.titulo_academico && (
                        <div className="text-[10px] text-slate-400 italic">
                          {doc.titulo_academico}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones: Teams y Carga Horaria */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={teamsChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#464EB8] hover:bg-[#3b429f] text-white text-[11px] font-bold transition-all shadow-xs"
                      title="Abrir chat directo o llamada en Microsoft Teams"
                    >
                      <Video className="w-3.5 h-3.5 text-white" />
                      <span>Microsoft Teams</span>
                    </a>

                    <button
                      onClick={() => {
                        setActiveTeacherForAssign(doc);
                        setShowAssignmentModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700"
                    >
                      <Plus className="w-3 h-3 text-blue-700" />
                      <span>Asignar Carga</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GRADOS Y CURSOS (CRUD)                                         */}
      {/* ========================================================================= */}
      {activeTab === "cursos" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Total Cursos Institucionales: {courses.length}
            </span>
            <button
              onClick={() => {
                setEditingCourse(null);
                setShowCourseModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Grado / Curso</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Orden</th>
                  <th className="py-3 px-4">Grado / Curso</th>
                  <th className="py-3 px-4">Nivel Educativo</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Docente Tutor Titular</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{c.orden}</td>
                    <td className="py-3 px-4 font-extrabold text-blue-800 text-sm">{c.nombre}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{c.nivel}</td>
                    <td className="py-3 px-4 text-slate-500">{c.especialidad || "General"}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {c.tutor?.nombres_completos || (
                        <span className="text-slate-400 italic font-normal">Sin Tutor Asignado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCourse(c);
                            setShowCourseModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "curso",
                              id: c.id,
                              name: c.nombre,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: ASIGNATURAS / MATERIAS (CRUD)                                  */}
      {/* ========================================================================= */}
      {activeTab === "asignaturas" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Malla Curricular: {subjects.length} Asignaturas Registradas
            </span>
            <button
              onClick={() => {
                setEditingSubject(null);
                setShowSubjectModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Materia / Asignatura</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{s.nombre}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                    Área: {s.area}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSubject(s);
                      setShowSubjectModal(true);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        type: "asignatura",
                        id: s.id,
                        name: s.nombre,
                      })
                    }
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: CRONOGRAMA & FORMULA 70/10/20                                  */}
      {/* ========================================================================= */}
      {activeTab === "evaluacion" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Reglamento de Calificación Oficial MinEduc (70/10/20)
            </h3>
            <p className="text-xs text-slate-500">
              Fórmula ministerial ejecutada automáticamente por la base de datos PostgreSQL en cada inserción de notas:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-2xl font-black text-blue-900 block">70%</span>
                <span className="text-xs font-bold text-blue-800 block mt-1">Evaluación Formativa</span>
                <p className="text-[11px] text-blue-700/80 mt-1">
                  Talleres, tareas escolares, lecciones orales y escritas individuales o grupales en aula.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-2xl font-black text-purple-900 block">10%</span>
                <span className="text-xs font-bold text-purple-800 block mt-1">Proyecto Integrador</span>
                <p className="text-[11px] text-purple-700/80 mt-1">
                  Producto interdisciplinar de fase trimestral con rúbrica aplicada.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-2xl font-black text-emerald-900 block">20%</span>
                <span className="text-xs font-bold text-emerald-800 block mt-1">Evaluación Sumativa</span>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  Prueba de base estructurada trimestral de fin de ciclo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR DOCENTE Y CREDENCIALES                              */}
      {/* ========================================================================= */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTeacher ? "Editar Perfil Docente" : "Crear Docente y Generar Credenciales"}
              </h3>
              <button
                onClick={() => {
                  setShowTeacherModal(false);
                  setEditingTeacher(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombres y Apellidos Completos: *
                  </label>
                  <input
                    name="nombres_completos"
                    type="text"
                    required
                    defaultValue={editingTeacher?.nombres_completos || ""}
                    placeholder="Ej. MSc. Ivone Jaqueline Pilco Fernandez"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cédula de Identidad:
                  </label>
                  <input
                    name="cedula"
                    type="text"
                    defaultValue={editingTeacher?.cedula || ""}
                    placeholder="Ej. 0201862000"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Celular:
                  </label>
                  <input
                    name="telefono"
                    type="text"
                    defaultValue={editingTeacher?.telefono || ""}
                    placeholder="Ej. 0992191552"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Institucional (Acceso al Sistema y Teams): *
                  </label>
                  <input
                    id="input_correo"
                    name="correo"
                    type="email"
                    required
                    defaultValue={editingTeacher?.correo || ""}
                    placeholder="Ej. ivone.pilco@uepichincha.edu.ec o @docentes.educacion.edu.ec"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Para docentes sin correo MinEduc, usar dominio interno.</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nameEl = document.querySelector('input[name="nombres_completos"]') as HTMLInputElement;
                        const emailEl = document.getElementById("input_correo") as HTMLInputElement;
                        if (nameEl && emailEl && nameEl.value) {
                          const parts = nameEl.value.toLowerCase().replace(/^(msc|lic|ing|dr)\.?\s+/i, "").trim().split(/\s+/);
                          const user = `${parts[0]}.${parts[parts.length - 1]}`;
                          emailEl.value = `${user}@uepichincha.edu.ec`;
                        }
                      }}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      Autogenerar @uepichincha.edu.ec
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo Institucional:
                  </label>
                  <input
                    name="cargo"
                    type="text"
                    defaultValue={editingTeacher?.cargo || "Docente Titular"}
                    placeholder="Ej. Docente 6.º EGB"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rol en Plataforma:
                  </label>
                  <select
                    name="rol"
                    defaultValue={editingTeacher?.rol || "docente"}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="docente">Docente Titular</option>
                    <option value="admin">Directora / Administrador</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Académico:
                  </label>
                  <input
                    name="titulo_academico"
                    type="text"
                    defaultValue={editingTeacher?.titulo_academico || ""}
                    placeholder="Ej. Licenciada en Ciencias de la Educación"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherModal(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  {editingTeacher ? "Guardar Cambios" : "Crear Credenciales"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR CURSO                                               */}
      {/* ========================================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCourse ? "Editar Curso" : "Nuevo Grado / Curso"}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Curso: *
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  defaultValue={editingCourse?.nombre || ""}
                  placeholder="Ej. 5.º EGB o 1.º BT"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nivel Educativo: *
                </label>
                <select
                  name="nivel"
                  defaultValue={editingCourse?.nivel || "Basica Media"}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Educacion Inicial">Educación Inicial</option>
                  <option value="Basica Preparatoria">Básica Preparatoria</option>
                  <option value="Basica Elemental">Básica Elemental</option>
                  <option value="Basica Media">Básica Media</option>
                  <option value="Basica Superior">Básica Superior</option>
                  <option value="Bachillerato Tecnico">Bachillerato Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Especialidad (opcional):
                </label>
                <input
                  name="especialidad"
                  type="text"
                  defaultValue={editingCourse?.especialidad || ""}
                  placeholder="Ej. Produccion Agropecuaria Sostenible"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Orden de Grado (1 a 15): *
                </label>
                <input
                  name="orden"
                  type="number"
                  required
                  defaultValue={editingCourse?.orden || courses.length + 1}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Docente Tutor Titular:
                </label>
                <select
                  name="tutor_id"
                  defaultValue={editingCourse?.tutor_id || ""}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">Sin Asignar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres_completos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  Guardar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNAR CARGA DOCENTE                                              */}
      {/* ========================================================================= */}
      {showAssignmentModal && activeTeacherForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Asignar Carga Horaria: {activeTeacherForAssign.nombres_completos.split(" ")[0]}
              </h3>
              <button onClick={() => setShowAssignmentModal(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grado / Curso: *
                </label>
                <select
                  name="curso_id"
                  required
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
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
                  Materia / Asignatura: *
                </label>
                <select
                  name="asignatura_id"
                  required
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Horas Pedagógicas Semanales:
                </label>
                <input
                  name="horas_semanales"
                  type="number"
                  defaultValue={4}
                  min={1}
                  max={30}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  Asignar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMACION DE ELIMINACION                                        */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              ¿Eliminar {deleteConfirm.type}?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Se eliminará <strong className="text-slate-800">{deleteConfirm.name}</strong> de la base de datos institucional.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
