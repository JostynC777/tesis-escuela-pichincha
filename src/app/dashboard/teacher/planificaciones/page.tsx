"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Curso,
  Asignatura,
  PerfilUsuario,
  Planificacion,
  EstadoPlanificacion,
} from "@/types/database.types";
import {
  BookOpen,
  Calendar,
  Upload,
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  ExternalLink,
  Plus,
  X,
  FileCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Loader2,
  School,
  Sparkles,
  ArrowRight,
  Send,
  Layers,
  FolderOpen,
  Link2,
} from "lucide-react";

const INSTITUTIONAL_DRIVE_URL =
  "https://drive.google.com/drive/folders/1HkaucPe1FhnyhaZbLqoZJF7Qp-s5yYq8";

function parsePlanResource(url: string | null | undefined): {
  type: "pdf" | "drive_file" | "drive_folder" | "none";
  embedUrl: string;
  originalUrl: string;
} {
  const raw = (url || "").trim();
  if (!raw) return { type: "none", embedUrl: "", originalUrl: "" };

  const folderMatch = raw.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch) {
    return { type: "drive_folder", embedUrl: "", originalUrl: raw };
  }

  const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch) {
    return {
      type: "drive_file",
      embedUrl: `https://drive.google.com/file/d/${fileMatch[1]}/preview`,
      originalUrl: raw,
    };
  }

  const openIdMatch = raw.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
  if (openIdMatch) {
    return {
      type: "drive_file",
      embedUrl: `https://drive.google.com/file/d/${openIdMatch[1]}/preview`,
      originalUrl: raw,
    };
  }

  if (/docs\.google\.com\//i.test(raw)) {
    const previewUrl = raw.replace(/\/(edit|view)(\?.*)?$/i, "/preview");
    return { type: "drive_file", embedUrl: previewUrl, originalUrl: raw };
  }

  return { type: "pdf", embedUrl: raw, originalUrl: raw };
}

// Helper para calcular fechas sugeridas de una semana escolar (Ciclo Sierra 2026-2027 inicia 21 Sep 2026)
function getSuggestedWeekDates(weekNumber: number): { start: string; end: string; label: string } {
  const baseDate = new Date(2026, 8, 21); // 21 Septiembre 2026
  const daysOffset = (weekNumber - 1) * 7;
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() + daysOffset);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4); // Viernes

  const format = (d: Date) => d.toISOString().split("T")[0];
  const formatHuman = (d: Date) =>
    d.toLocaleDateString("es-EC", { day: "numeric", month: "short" });

  return {
    start: format(startDate),
    end: format(endDate),
    label: `${formatHuman(startDate)} al ${formatHuman(endDate)}`,
  };
}

export default function PlanificacionesSemanalesPage() {
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [courses, setCourses] = useState<Curso[]>([]);
  const [subjects, setSubjects] = useState<Asignatura[]>([]);
  const [teachers, setTeachers] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Usuario activo en sesión
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("docente");
  const [currentUserName, setCurrentUserName] = useState<string>("Docente");

  // Filtros
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>("ALL");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modales
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [planToReplace, setPlanToReplace] = useState<Planificacion | null>(null);
  const [activePlanForView, setActivePlanForView] = useState<Planificacion | null>(null);
  const [isFullscreenViewer, setIsFullscreenViewer] = useState<boolean>(false);

  // Estados de subida / reemplazo
  const [uploadSourceMode, setUploadSourceMode] = useState<"storage" | "drive">("storage");
  const [driveUrlInput, setDriveUrlInput] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carga de datos iniciales
  const loadInitialData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Obtener usuario activo
      let email = "";
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) email = authData.user.email;
      } catch (e) {}

      if (!email && typeof window !== "undefined") {
        email =
          sessionStorage.getItem("escuela_user_email") ||
          localStorage.getItem("escuela_user_email") ||
          "";
      }

      let activeTeacherId = "";
      let activeRole = "docente";

      if (email) {
        const { data: uData } = await supabase
          .from("perfiles_usuarios")
          .select("id, nombres_completos, rol, correo")
          .eq("correo", email.trim().toLowerCase())
          .single();

        if (uData) {
          const profile = uData as any;
          activeTeacherId = profile.id;
          activeRole = profile.rol || "docente";
          setCurrentUserId(profile.id);
          setCurrentUserRole(profile.rol);
          setCurrentUserName(profile.nombres_completos || "Docente");
        }
      }

      // 2. Cargar cursos, asignaturas, docentes y planificaciones
      const [coursesRes, subjectsRes, teachersRes, plansRes] = await Promise.all([
        supabase.from("cursos").select("*").order("orden"),
        supabase.from("asignaturas").select("*").order("nombre"),
        supabase.from("perfiles_usuarios").select("*").eq("rol", "docente").order("nombres_completos"),
        supabase
          .from("planificaciones")
          .select("*, curso:cursos(id, nombre), asignatura:asignaturas(id, nombre), docente:perfiles_usuarios!docente_id(id, nombres_completos, correo, rol)")
          .order("semana_numero", { ascending: false })
          .order("updated_at", { ascending: false }),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data as unknown as Curso[]);
      if (subjectsRes.data) setSubjects(subjectsRes.data as unknown as Asignatura[]);
      if (teachersRes.data) setTeachers(teachersRes.data as unknown as PerfilUsuario[]);

      if (plansRes.error) throw plansRes.error;

      if (plansRes.data) {
        const loadedPlans = plansRes.data as unknown as Planificacion[];
        setPlanificaciones(loadedPlans);
        if (loadedPlans.length > 0 && !activePlanForView) {
          setActivePlanForView(loadedPlans[0]);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar planificaciones:", err);
      setLoadError(err?.message || "No se pudieron cargar las planificaciones desde Supabase.");
      showToast("Error al conectar con Supabase: " + (err?.message || "Error de red"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrado de planificaciones
  const filteredPlans = useMemo(() => {
    return planificaciones.filter((p) => {
      const matchesSearch =
        searchTerm === "" ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.curso?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.asignatura?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.docente?.nombres_completos?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWeek =
        selectedWeekFilter === "ALL" || String(p.semana_numero) === selectedWeekFilter;

      const matchesCourse =
        selectedCourseFilter === "ALL" || p.curso_id === selectedCourseFilter;

      const matchesSubject =
        selectedSubjectFilter === "ALL" || p.asignatura_id === selectedSubjectFilter;

      const matchesStatus =
        selectedStatusFilter === "ALL" || p.estado === selectedStatusFilter;

      return matchesSearch && matchesWeek && matchesCourse && matchesSubject && matchesStatus;
    });
  }, [
    planificaciones,
    searchTerm,
    selectedWeekFilter,
    selectedCourseFilter,
    selectedSubjectFilter,
    selectedStatusFilter,
  ]);

  // Manejo de subida de nueva planificación (Híbrido: Supabase Storage o Google Drive)
  const handleUploadNewPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const semana_numero = parseInt(String(formData.get("semana_numero")), 10);
    const curso_id = String(formData.get("curso_id"));
    const asignatura_id = String(formData.get("asignatura_id"));
    const fecha_inicio = String(formData.get("fecha_inicio"));
    const fecha_fin = String(formData.get("fecha_fin"));
    const titulo = String(formData.get("titulo") || "").trim();
    const docente_id = String(formData.get("docente_id") || currentUserId);

    try {
      const courseObj = courses.find((c) => c.id === curso_id);
      const subjectObj = subjects.find((s) => s.id === asignatura_id);
      let finalDocumentUrl = "";

      if (uploadSourceMode === "drive") {
        const rawDriveUrl = driveUrlInput.trim();
        if (!rawDriveUrl || !/^https?:\/\/(drive|docs)\.google\.com\//i.test(rawDriveUrl)) {
          setUploadError(
            "Ingresa un enlace válido de Google Drive o Google Docs (ej. https://drive.google.com/file/d/...)."
          );
          setIsUploading(false);
          return;
        }
        finalDocumentUrl = rawDriveUrl;
      } else {
        const file = formData.get("pdf_file") as File;
        if (!file || file.size === 0) {
          setUploadError("Debes seleccionar un archivo PDF válido.");
          setIsUploading(false);
          return;
        }

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          setUploadError("Solo se permiten archivos en formato PDF.");
          setIsUploading(false);
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          setUploadError("El archivo no debe exceder los 10 MB reglamentarios.");
          setIsUploading(false);
          return;
        }

        const safeCourse = (courseObj?.nombre || "Curso").replace(/[^a-zA-Z0-9]/g, "_");
        const safeSubject = (subjectObj?.nombre || "Materia").replace(/[^a-zA-Z0-9]/g, "_");
        const timestamp = Date.now();
        const storagePath = `semana_${semana_numero}/${safeCourse}/${safeSubject}/Plan_Sem_${semana_numero}_v1_${timestamp}.pdf`;

        const { error: storageErr } = await supabase.storage
          .from("planificaciones")
          .upload(storagePath, file, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (storageErr) throw storageErr;

        const { data: publicUrlData } = supabase.storage
          .from("planificaciones")
          .getPublicUrl(storagePath);

        finalDocumentUrl = publicUrlData.publicUrl;
      }

      // Guardar registro en tabla planificaciones
      const newPlanPayload: any = {
        docente_id: docente_id || currentUserId || teachers[0]?.id,
        curso_id,
        asignatura_id,
        semana_numero,
        fecha_inicio,
        fecha_fin,
        titulo: titulo || `Planificación Semana ${semana_numero} - ${subjectObj?.nombre || ""}`,
        archivo_url: finalDocumentUrl,
        estado: "ENVIADO" as EstadoPlanificacion,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let insertRes = await (supabase.from("planificaciones") as any)
        .insert([{ ...newPlanPayload, version: 1 }])
        .select("*, curso:cursos(id, nombre), asignatura:asignaturas(id, nombre), docente:perfiles_usuarios!docente_id(id, nombres_completos, correo, rol)")
        .single();

      if (insertRes.error && insertRes.error.message.includes("version")) {
        insertRes = await (supabase.from("planificaciones") as any)
          .insert([newPlanPayload])
          .select("*, curso:cursos(id, nombre), asignatura:asignaturas(id, nombre), docente:perfiles_usuarios!docente_id(id, nombres_completos, correo, rol)")
          .single();
      }

      if (insertRes.error) throw insertRes.error;

      showToast(
        uploadSourceMode === "drive"
          ? `Enlace de Google Drive vinculado a Semana ${semana_numero}`
          : `Planificación PDF para Semana ${semana_numero} subida con éxito`,
        "success"
      );
      setShowUploadModal(false);
      setDriveUrlInput("");
      await loadInitialData();
      if (insertRes.data) setActivePlanForView(insertRes.data as unknown as Planificacion);
    } catch (err: any) {
      console.error("Error en subida/vinculación de planificacion:", err);
      setUploadError("Fallo al guardar en Supabase: " + (err.message || "Error desconocido"));
    } finally {
      setIsUploading(false);
    }
  };

  // Manejo de reemplazo / actualización de documento existente
  const handleReplaceExistingPlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!planToReplace) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("pdf_file") as File;
    const observaciones = String(formData.get("observaciones_revision") || "").trim();

    if (!file || file.size === 0) {
      setUploadError("Selecciona el nuevo archivo PDF para reemplazar el anterior.");
      setIsUploading(false);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Solo se admiten documentos en formato PDF.");
      setIsUploading(false);
      return;
    }

    try {
      const currentVersion = (planToReplace as any).version || 1;
      const nextVersion = currentVersion + 1;
      const safeCourse = (planToReplace.curso?.nombre || "Curso").replace(/[^a-zA-Z0-9]/g, "_");
      const safeSubject = (planToReplace.asignatura?.nombre || "Materia").replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = Date.now();
      const storagePath = `semana_${planToReplace.semana_numero}/${safeCourse}/${safeSubject}/Plan_Sem_${planToReplace.semana_numero}_v${nextVersion}_${timestamp}.pdf`;

      // 1. Subir nueva versión a Storage
      const { error: storageErr } = await supabase.storage
        .from("planificaciones")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (storageErr) throw storageErr;

      // 2. Obtener nueva URL pública directa
      const { data: publicUrlData } = supabase.storage
        .from("planificaciones")
        .getPublicUrl(storagePath);

      const newPublicUrl = publicUrlData.publicUrl;

      // 3. Actualizar registro en base de datos
      const updatePayload: any = {
        archivo_url: newPublicUrl,
        updated_at: new Date().toISOString(),
        estado: "ENVIADO" as EstadoPlanificacion,
        observaciones_revision: observaciones || planToReplace.observaciones_revision || null,
      };

      let updateRes = await (supabase.from("planificaciones") as any)
        .update({ ...updatePayload, version: nextVersion })
        .eq("id", planToReplace.id)
        .select("*, curso:cursos(id, nombre), asignatura:asignaturas(id, nombre), docente:perfiles_usuarios!docente_id(id, nombres_completos, correo, rol)")
        .single();

      if (updateRes.error && updateRes.error.message.includes("version")) {
        updateRes = await (supabase.from("planificaciones") as any)
          .update(updatePayload)
          .eq("id", planToReplace.id)
          .select("*, curso:cursos(id, nombre), asignatura:asignaturas(id, nombre), docente:perfiles_usuarios!docente_id(id, nombres_completos, correo, rol)")
          .single();
      }

      if (updateRes.error) throw updateRes.error;

      showToast(`Documento reemplazado con éxito (Versión ${nextVersion})`, "success");
      setShowReplaceModal(false);
      setPlanToReplace(null);
      await loadInitialData();
      if (updateRes.data) setActivePlanForView(updateRes.data as unknown as Planificacion);
    } catch (err: any) {
      console.error("Error al reemplazar PDF:", err);
      setUploadError("Error en actualización: " + (err.message || "Fallo en Storage"));
    } finally {
      setIsUploading(false);
    }
  };

  // Copiar URL pública para testing de App Android
  const copyPublicUrl = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showToast("URL pública copiada. Lista para PlanificacionesScreen.kt en Android.", "info");
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  // Generar array de 40 semanas
  const weekNumbers = Array.from({ length: 40 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Notificación Toast */}
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
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toast.type === "info" && <Check className="w-4 h-4 text-blue-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <School className="w-4 h-4" />
            <span>Gestión Curricular • Ciclo 2026-2027</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Planificaciones Curriculares por Semana
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Carga y actualización de microplanificaciones PDF con control de versiones en Supabase Storage y consumo en Android (PlanificacionesScreen.kt).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={INSTITUTIONAL_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Repositorio Drive Institucional</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={() => {
              setUploadError(null);
              setUploadSourceMode("storage");
              setDriveUrlInput("");
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Planificación PDF</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Filtro por Semana */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Semana Académica:
          </label>
          <select
            value={selectedWeekFilter}
            onChange={(e) => setSelectedWeekFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          >
            <option value="ALL">Todas las Semanas</option>
            {weekNumbers.map((w) => {
              const dates = getSuggestedWeekDates(w);
              return (
                <option key={w} value={String(w)}>
                  Semana {w} ({dates.label})
                </option>
              );
            })}
          </select>
        </div>

        {/* Filtro por Curso */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Grado / Curso:
          </label>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          >
            <option value="ALL">Todos los Cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Asignatura */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Materia / Asignatura:
          </label>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          >
            <option value="ALL">Todas las Materias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Estado de Revisión:
          </label>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="APROBADO">Aprobados</option>
            <option value="ENVIADO">Enviados (En Revisión)</option>
            <option value="OBSERVADO">Observados / Corrección</option>
            <option value="BORRADOR">Borrador</option>
          </select>
        </div>

        {/* Búsqueda general */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Buscar Título o Docente:
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ej. Convivencia, Ciencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Grid Split-Screen: Lista a la Izquierda y Visor PDF a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Listado de Planificaciones (5 Columnas) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-700">
              Documentos ({filteredPlans.length})
            </span>
            <span className="text-slate-400 text-[11px]">
              {selectedWeekFilter !== "ALL" ? `Semana ${selectedWeekFilter}` : "Todas las semanas"}
            </span>
          </div>

          {loading ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-700 mb-2" />
              <p className="text-xs">Cargando repositorio de planificaciones...</p>
            </div>
          ) : loadError ? (
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
              <p className="text-xs font-bold text-rose-900">{loadError}</p>
              <button
                onClick={loadInitialData}
                className="mt-3 px-4 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800"
              >
                Reintentar
              </button>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No hay planificaciones con los filtros seleccionados</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes subir el primer documento PDF haciendo clic en &ldquo;Subir Planificación PDF&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredPlans.map((plan) => {
                const isSelected = activePlanForView?.id === plan.id;
                const version = (plan as any).version || 1;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setActivePlanForView(plan)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider">
                          Semana {plan.semana_numero}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            plan.estado === "APROBADO"
                              ? "bg-emerald-100 text-emerald-800"
                              : plan.estado === "OBSERVADO"
                              ? "bg-amber-100 text-amber-800"
                              : plan.estado === "ENVIADO"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {plan.estado}
                        </span>
                        {version > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[9px] font-bold">
                            v{version}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString("es-EC") : ""}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2 leading-snug">
                      {plan.titulo}
                    </h4>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                        <span className="font-semibold text-blue-800">{plan.curso?.nombre}</span>
                        <span>•</span>
                        <span className="truncate">{plan.asignatura?.nombre}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <span>{plan.docente?.nombres_completos?.split(" ")[0]}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Visor de PDF Integrado (7 Columnas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[780px]">
          {activePlanForView ? (
            <>
              {/* Barra superior de detalles del documento */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white text-[10px] font-black">
                      Semana {activePlanForView.semana_numero}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 truncate">
                      {activePlanForView.curso?.nombre} • {activePlanForView.asignatura?.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
                      v{(activePlanForView as any).version || 1}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 truncate">
                    {activePlanForView.titulo}
                  </h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Docente: <strong className="text-slate-600">{activePlanForView.docente?.nombres_completos}</strong> •
                    Periodo: {activePlanForView.fecha_inicio} al {activePlanForView.fecha_fin}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyPublicUrl(activePlanForView.archivo_url || "")}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-200 transition-colors"
                    title="Copiar URL pública consumida por App Android"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={activePlanForView.archivo_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-200 transition-colors"
                    title="Descargar o abrir PDF en nueva pestaña"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => {
                      setPlanToReplace(activePlanForView);
                      setShowReplaceModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold transition-colors shadow-xs"
                    title="Reemplazar y actualizar el archivo PDF de esta semana"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Actualizar PDF</span>
                  </button>
                </div>
              </div>

              {/* Contenedor del Visor Híbrido (PDF Supabase / Google Drive) */}
              <div className="flex-1 bg-slate-100 p-2 relative">
                {(() => {
                  const resource = parsePlanResource(activePlanForView.archivo_url);
                  if (resource.type === "none") {
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-12 h-12 mb-2 text-slate-300" />
                        <p className="text-xs font-medium">Este registro no tiene archivo asociado.</p>
                      </div>
                    );
                  }

                  if (resource.type === "drive_folder") {
                    return (
                      <div className="w-full h-full flex items-center justify-center p-6">
                        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                            <FolderOpen className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Carpeta de Google Drive
                            </span>
                            <h4 className="text-base font-black text-slate-900 mt-2">
                              {activePlanForView.titulo}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {activePlanForView.curso?.nombre} • {activePlanForView.asignatura?.nombre}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Docente: {activePlanForView.docente?.nombres_completos || "Docente Titular"}
                            </p>
                          </div>
                          <a
                            href={resource.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow transition-colors"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>Abrir Carpeta en Google Drive</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="w-full h-full flex flex-col gap-2">
                      {resource.type === "drive_file" && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                          <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Vista previa integrada de Google Drive</span>
                          </span>
                          <a
                            href={resource.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors"
                          >
                            <span>Abrir en Google Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      <iframe
                        src={resource.embedUrl}
                        className="w-full flex-1 rounded-xl border border-slate-200 bg-white"
                        title={`Visor: ${activePlanForView.titulo}`}
                        allow="autoplay"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Pie con estado de revision y observaciones */}
              <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Estado actual:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      activePlanForView.estado === "APROBADO"
                        ? "bg-emerald-100 text-emerald-800"
                        : activePlanForView.estado === "OBSERVADO"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {activePlanForView.estado}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  URL compatible con pantalla Android: <code className="font-mono text-blue-700">PlanificacionesScreen.kt</code>
                </div>
              </div>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400">
              <Eye className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Selecciona una planificación</p>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en cualquier semana del panel izquierdo para previsualizar el documento PDF curricular.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBIR NUEVA PLANIFICACION PDF                                      */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Subir Planificación Curricular Semanal
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewPlan} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Semana */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semana Académica: *
                  </label>
                  <select
                    name="semana_numero"
                    required
                    defaultValue="6"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10);
                      const dates = getSuggestedWeekDates(num);
                      const startInput = document.getElementById("input_fecha_inicio") as HTMLInputElement;
                      const endInput = document.getElementById("input_fecha_fin") as HTMLInputElement;
                      if (startInput) startInput.value = dates.start;
                      if (endInput) endInput.value = dates.end;
                    }}
                  >
                    {weekNumbers.map((w) => {
                      const d = getSuggestedWeekDates(w);
                      return (
                        <option key={w} value={w}>
                          Semana {w} ({d.label})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Docente autor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Docente Responsable:
                  </label>
                  <select
                    name="docente_id"
                    defaultValue={currentUserId || teachers[0]?.id || ""}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombres_completos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fechas de inicio y fin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Inicio: *
                  </label>
                  <input
                    id="input_fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    required
                    defaultValue={getSuggestedWeekDates(6).start}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Fin: *
                  </label>
                  <input
                    id="input_fecha_fin"
                    name="fecha_fin"
                    type="date"
                    required
                    defaultValue={getSuggestedWeekDates(6).end}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Curso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grado / Curso: *
                  </label>
                  <select
                    name="curso_id"
                    required
                    defaultValue={courses[0]?.id || ""}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asignatura */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Materia / Asignatura: *
                  </label>
                  <select
                    name="asignatura_id"
                    required
                    defaultValue={subjects[0]?.id || ""}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título de la Planificación */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título o Eje Temático: *
                  </label>
                  <input
                    name="titulo"
                    type="text"
                    required
                    placeholder="Ej. Semana 6 - Nociones espaciales, hábitos saludables y pictogramas"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>

                {/* Selector de Origen Híbrido: Supabase Storage o Google Drive */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Origen del Documento: *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadSourceMode("storage");
                        setUploadError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        uploadSourceMode === "storage"
                          ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir archivo PDF (Supabase)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadSourceMode("drive");
                        setUploadError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        uploadSourceMode === "drive"
                          ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Vincular desde Google Drive</span>
                    </button>
                  </div>
                </div>

                {uploadSourceMode === "storage" ? (
                  <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seleccionar Documento PDF (Máx. 10 MB): *
                    </label>
                    <input
                      name="pdf_file"
                      type="file"
                      accept="application/pdf,.pdf"
                      required={uploadSourceMode === "storage"}
                      className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-700 file:text-white hover:file:bg-blue-800 text-slate-600 w-full"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      El archivo se guardará en el bucket &ldquo;planificaciones&rdquo; de Supabase Storage con acceso directo para la App Android.
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2 bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Enlace de Archivo o Carpeta de Google Drive: *
                    </label>
                    <input
                      name="drive_url"
                      type="url"
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      required={uploadSourceMode === "drive"}
                      placeholder="https://drive.google.com/file/d/.../view o .../folders/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <p className="text-[10px] text-slate-500">
                      La URL se guardará en <code className="font-mono text-blue-700">archivo_url</code> para visualizarla en la web y abrirla desde <code className="font-mono text-blue-700">PlanificacionesScreen.kt</code> en Android.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {uploadSourceMode === "drive" ? "Vinculando..." : "Subiendo a Storage..."}
                      </span>
                    </>
                  ) : (
                    <>
                      {uploadSourceMode === "drive" ? (
                        <Link2 className="w-4 h-4" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>
                        {uploadSourceMode === "drive" ? "Vincular y Guardar" : "Subir y Guardar"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REEMPLAZAR / ACTUALIZAR ARCHIVO PDF (VERSIONAMIENTO)               */}
      {/* ========================================================================= */}
      {showReplaceModal && planToReplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/60">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Actualizar Planificación (Versión {((planToReplace as any).version || 1) + 1})
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Reemplazo de documento en Supabase Storage
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setPlanToReplace(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceExistingPlan} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">Semana:</span>{" "}
                  <strong className="text-slate-900">Semana {planToReplace.semana_numero}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Curso / Materia:</span>{" "}
                  <strong className="text-slate-900">{planToReplace.curso?.nombre} - {planToReplace.asignatura?.nombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Versión previa:</span>{" "}
                  <span className="font-mono text-slate-700">v{(planToReplace as any).version || 1}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nuevo Archivo PDF: *
                </label>
                <input
                  name="pdf_file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-900 hover:file:bg-amber-600 text-slate-600 w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Se subirá como una nueva versión en Supabase Storage y se actualizará automáticamente la URL pública.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de la Actualización (opcional):
                </label>
                <textarea
                  name="observaciones_revision"
                  rows={2}
                  placeholder="Detalles de corrección pedagógica o ampliación curricular..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplaceModal(false);
                    setPlanToReplace(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Reemplazar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
