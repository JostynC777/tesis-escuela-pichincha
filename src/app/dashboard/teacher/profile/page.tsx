"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  User,
  FileText,
  Download,
  ExternalLink,
  Eye,
  BookOpen,
  GraduationCap,
  School,
  Calendar,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  FileCheck,
  Search,
  Filter,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  Maximize2,
  Share2,
  Minimize2,
  Loader2,
} from "lucide-react";

// ============================================================================
// DATA CONTRACTS & MOCK DATA
// ============================================================================

interface DocumentoPlanificacion {
  id: string;
  titulo: string;
  subtitulo: string;
  periodo: string;
  categoria: "Planificación Semanal" | "Microplanificación" | "Adaptación" | "Evidencias";
  url: string;
  extension: "pdf" | "docx";
  tamano: string;
  fechaModificacion: string;
  insumosClave: string[];
}

// Mock Data: Recursos y Planificaciones de la MSc. Laura Simbaña (Escuela Pichincha - Lloa)
// Documentos vectoriales limpios priorizados al inicio, escaneados relegados al final
const DOCUMENTOS_DOCENTE: DocumentoPlanificacion[] = [
  {
    id: "doc-03",
    titulo: "Semana 6 - Planificación Inicial 1",
    subtitulo: "Convivencia armónica, hábitos de higiene y rondas",
    periodo: "Semana 6",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_6_inicial.pdf",
    extension: "pdf",
    tamano: "522 KB",
    fechaModificacion: "06 Oct 2026",
    insumosClave: ["Juego-trabajo", "Pictogramas escolares"],
  },
  {
    id: "doc-04",
    titulo: "Semana 7 - Mi entorno y mi familia",
    subtitulo: "Reconocimiento de la familia y el hogar en Lloa",
    periodo: "Semana 7",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_7_inicial.pdf",
    extension: "pdf",
    tamano: "562 KB",
    fechaModificacion: "13 Oct 2026",
    insumosClave: ["Árbol genealógico", "Colores primarios"],
  },
  {
    id: "doc-05",
    titulo: "Semana 8 - Los animalitos del páramo",
    subtitulo: "Fauna autóctona de Lloa, respeto animal y sonidos",
    periodo: "Semana 8",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_8_inicial.pdf",
    extension: "pdf",
    tamano: "519 KB",
    fechaModificacion: "20 Oct 2026",
    insumosClave: ["Discriminación auditiva", "Cuidado de la naturaleza"],
  },
  {
    id: "doc-06",
    titulo: "Semana 9 - Descubriendo las figuras geométricas",
    subtitulo: "Nociones espaciales, círculo, cuadrado y cuantificadores",
    periodo: "Semana 9",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_9_inicial.pdf",
    extension: "pdf",
    tamano: "537 KB",
    fechaModificacion: "27 Oct 2026",
    insumosClave: ["Nociones temporales", "Trazos preparatorios"],
  },
  {
    id: "doc-07",
    titulo: "Semana 10 - Mi alimentación saludable",
    subtitulo: "Frutas, verduras y consumo de la colación escolar MinEduc",
    periodo: "Semana 10",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_10_inicial.pdf",
    extension: "pdf",
    tamano: "473 KB",
    fechaModificacion: "03 Nov 2026",
    insumosClave: ["Nutrición infantil", "Lavado de manos"],
  },
  {
    id: "doc-08",
    titulo: "Semana 11 - Tradiciones y juegos de mi pueblo",
    subtitulo: "Juegos tradicionales y rondas populares de la parroquia",
    periodo: "Semana 11",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_11_inicial.pdf",
    extension: "pdf",
    tamano: "517 KB",
    fechaModificacion: "10 Nov 2026",
    insumosClave: ["Identidad andina", "Expresión musical lúdica"],
  },
  {
    id: "doc-01",
    titulo: "Planificación Trimestral Inicial y Preparatoria",
    subtitulo: "Experiencias de aprendizaje integradas para el 1er Trimestre (documento escaneado)",
    periodo: "1er Trimestre 2026-2027",
    categoria: "Microplanificación",
    url: "/documentos/planificacion_laura_simbana.pdf",
    extension: "pdf",
    tamano: "14.3 MB",
    fechaModificacion: "24 Oct 2026",
    insumosClave: ["Ámbitos de desarrollo", "Destrezas con criterio", "Rincón de lectura lúdica"],
  },
  {
    id: "doc-02",
    titulo: "Semana 6 - ¡Así soy yo!",
    subtitulo: "Identidad personal, autonomía y expresión corporal (documento escaneado)",
    periodo: "Semana 6",
    categoria: "Planificación Semanal",
    url: "/documentos/semana_6_asi_soy_yo.pdf",
    extension: "pdf",
    tamano: "14.3 MB",
    fechaModificacion: "06 Oct 2026",
    insumosClave: ["Esquema corporal", "Rondas infantiles andinas", "Motricidad fina"],
  },
];

function formatCursoSinParalelo(rawCourse: string | undefined | null): string {
  if (!rawCourse) return "No Asignado";
  return rawCourse
    .replace(/\s*-\s*paralelo\s*[a-z0-9]/i, "")
    .replace(/\s*-\s*[a-z0-9]$/i, "")
    .replace(/\s+[a-z]$/i, "")
    .trim();
}

function getInitials(name: string | undefined | null): string {
  if (!name) return "DOC";
  const clean = name.replace(/^(msc\.|lic\.|ing\.|lcda\.|dr\.|dra\.|prof\.)\s+/i, "").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 0) return "DOC";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface DocenteProfile {
  id: string;
  nombres_completos: string;
  correo: string;
  rol: string;
  cargo?: string | null;
  telefono?: string | null;
  titulo_academico?: string | null;
  activo?: boolean;
}

interface DocenteAssignmentShort {
  id: string;
  materia: string;
  grado_paralelo: string;
}

export default function TeacherProfilePage() {
  // Identidad dinámica del docente desde Supabase
  const [teacherProfile, setTeacherProfile] = useState<DocenteProfile | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<DocenteAssignmentShort[]>([]);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Estado local para el documento activo en el visor iframe
  const [activeDocument, setActiveDocument] = useState<string>("/documentos/semana_6_inicial.pdf");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Carga de la identidad real del docente activo y sus asignaciones
  useEffect(() => {
    async function loadActiveDocente() {
      setLoadingProfile(true);
      setProfileError(null);

      try {
        let activeEmail = "";

        // 1. Consulta el usuario activo con Supabase Auth
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.email) {
            activeEmail = authData.user.email;
          }
        } catch (e) {}

        // 2. Consulta en cookie/sesión del navegador
        if (!activeEmail && typeof window !== "undefined") {
          activeEmail =
            sessionStorage.getItem("escuela_user_email") ||
            localStorage.getItem("escuela_user_email") ||
            "";
        }

        // 3. Fallback predeterminado si no hay sesión iniciada aún
        if (!activeEmail) {
          activeEmail = "mery.chicaiza@pichincha.edu.ec";
        }

        // Consulta real a perfiles_usuarios en Supabase
        const { data: userData, error: userError } = await supabase
          .from("perfiles_usuarios")
          .select("*")
          .eq("correo", activeEmail.trim().toLowerCase())
          .single();

        if (userError || !userData) {
          // Si el correo específico falló, intentar fallback a cualquier docente activo
          const { data: fallbackUser } = await supabase
            .from("perfiles_usuarios")
            .select("*")
            .eq("rol", "DOCENTE")
            .limit(1)
            .single();

          if (fallbackUser) {
            const profile = (fallbackUser as unknown) as DocenteProfile;
            setTeacherProfile(profile);
            await fetchDocenteAssignments(profile.id);
          } else {
            setProfileError("No se encontró el registro docente en Supabase.");
          }
          return;
        }

        const profile = (userData as unknown) as DocenteProfile;
        setTeacherProfile(profile);

        // Paso 2: Segunda consulta a asignaciones_docentes filtrando por docente_id
        await fetchDocenteAssignments(profile.id);

      } catch (err: any) {
        console.error("Error al cargar perfil del docente:", err);
        setProfileError("Error de conexión al cargar la identidad del docente.");
      } finally {
        setLoadingProfile(false);
      }
    }

    async function fetchDocenteAssignments(docenteId: string) {
      try {
        const { data: assignmentsData } = await supabase
          .from("asignaciones_docentes")
          .select("id, materia, grado_paralelo")
          .eq("docente_id", docenteId);

        if (assignmentsData && assignmentsData.length > 0) {
          setTeacherAssignments(assignmentsData as DocenteAssignmentShort[]);
        } else {
          setTeacherAssignments([]);
        }
      } catch (e) {
        console.error("Error al cargar asignaciones del docente:", e);
      }
    }

    loadActiveDocente();
  }, []);

  // Documento actualmente seleccionado
  const selectedDocObject = DOCUMENTOS_DOCENTE.find((doc) => doc.url === activeDocument);

  // Filtrado de documentos
  const filteredDocs = DOCUMENTOS_DOCENTE.filter((doc) => {
    const matchesSearch =
      doc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subtitulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.periodo.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "Todas") return matchesSearch;
    return matchesSearch && doc.categoria === selectedCategory;
  });

  // Formateo dinámico de asignaturas y cursos (ej. "Ciencias Naturales - 8.º EGB")
  const teachingAreas =
    teacherAssignments.length > 0
      ? teacherAssignments
          .map((a) => `${a.materia} - ${formatCursoSinParalelo(a.grado_paralelo)}`)
          .join(" • ")
      : teacherProfile?.cargo || "Docente Titular de Educación General Básica";

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href="/dashboard/teacher"
          className="hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Panel Docente</span>
        </Link>
        <span>/</span>
        <span className="text-blue-800 font-bold">Perfil Docente & Visor de Planificaciones</span>
      </div>

      {/* =====================================================================
          1. CABECERA (HEADER): TARJETA ATRACTIVA DEL DOCENTE (DINÁMICA)
      ====================================================================== */}
      {loadingProfile ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-200 shrink-0" />
              <div className="space-y-3">
                <div className="h-5 bg-slate-200 rounded-full w-48" />
                <div className="h-8 bg-slate-200 rounded-xl w-64" />
                <div className="h-4 bg-slate-200 rounded-lg w-72" />
                <div className="h-4 bg-slate-100 rounded-lg w-52" />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-blue-900">
              <Loader2 className="w-5 h-5 text-blue-700 animate-spin shrink-0" />
              <span className="text-xs font-bold">
                Sincronizando identidad docente y asignaciones desde Supabase...
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Top Decorative Institutional Strip */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            
            {/* Avatar and Primary Identity */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-md border-4 border-white shrink-0 uppercase select-none">
                {getInitials(teacherProfile?.nombres_completos)}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-blue-700" />
                    <span>Escuela de Educación Básica &quot;Pichincha&quot;</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    {teacherProfile?.activo !== false ? "Docente Titular Activa" : "Licencia"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-bold border border-slate-200">
                    {teacherProfile?.rol || "DOCENTE"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {teacherProfile?.nombres_completos || "Docente Institucional"}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Docente de <strong className="text-blue-900 font-bold">{teachingAreas}</strong>
                </p>

                {/* Institutional Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-700" />
                    {teacherProfile?.correo || "docente@pichincha.edu.ec"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Distrito 17D01 • AMIE: 17H01429
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Jornada Matutina (07:15 - 12:30)
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-center shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Planificaciones
                </span>
                <span className="text-2xl font-black font-mono text-blue-700">
                  {DOCUMENTOS_DOCENTE.length} Archivos
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">100% al día</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Curso Asignado
                </span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  {teacherAssignments.length > 0
                    ? formatCursoSinParalelo(teacherAssignments[0].grado_paralelo)
                    : "General"}
                </span>
                <span className="text-[10px] text-blue-800 font-semibold block truncate max-w-[120px] mx-auto">
                  {teacherAssignments.length > 0
                    ? teacherAssignments.map((a) => a.materia).join(", ")
                    : "Educación Básica"}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Validación DECE
                </span>
                <span className="text-lg font-black text-emerald-700 block mt-0.5">
                  Aprobado
                </span>
                <span className="text-[10px] text-slate-500 block">MinEduc 2026</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================================
          2. CONTENIDO PRINCIPAL: DISEÑO EN DOS COLUMNAS (30% / 70%)
      ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ===================================================================
            COLUMNA IZQUIERDA (30% de ancho): MIS PLANIFICACIONES Y RECURSOS
        =================================================================== */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          
          {/* Header of Left Column */}
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen className="w-4 h-4 text-blue-700" />
              <h2 className="text-base font-black text-slate-900">
                Mis Planificaciones y Recursos
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Seleccione un archivo para cargarlo en el visor interactivo.
            </p>
          </div>

          {/* Search and Category Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por semana o tema..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {["Todas", "Planificación Semanal", "Microplanificación"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Document List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const isSelected = activeDocument === doc.url;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDocument(doc.url)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-500 border-l-4 shadow-sm ring-1 ring-blue-300"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            doc.categoria === "Microplanificación"
                              ? "bg-indigo-100 text-indigo-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {doc.periodo}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {doc.tamano}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          isSelected
                            ? "bg-blue-700 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800"
                        }`}
                      >
                        {doc.extension.toUpperCase()}
                      </span>
                    </div>

                    <h3
                      className={`text-xs font-bold leading-snug line-clamp-2 ${
                        isSelected ? "text-blue-900 font-black" : "text-slate-800 group-hover:text-blue-700"
                      }`}
                    >
                      {doc.titulo}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {doc.subtitulo}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100">
                      <span>Modificado: {doc.fechaModificacion}</span>
                      <span className="flex items-center gap-0.5 font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                No se encontraron documentos con ese criterio de búsqueda.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 bg-blue-50/70 p-3 rounded-2xl border border-blue-100 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Documentos alojados en el repositorio local institucional de la Escuela Pichincha.
            </span>
          </div>

        </div>

        {/* ===================================================================
            COLUMNA DERECHA (70% de ancho): VISOR DE DOCUMENTOS INTERACTIVO
        =================================================================== */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
          
          {/* Header of Right Column */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-700" />
                <h2 className="text-base font-black text-slate-900">
                  Visor de Documentos Oficiales
                </h2>
                {selectedDocObject && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PDF Cargado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {selectedDocObject ? selectedDocObject.titulo : "Vista previa de la planificación pedagógica"}
              </p>
            </div>

            {/* Document Action Buttons */}
            {selectedDocObject && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                  title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-blue-700" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-blue-700" />
                  )}
                  <span className="hidden sm:inline">
                    {isFullscreen ? "Salir" : "Pantalla Completa"}
                  </span>
                </button>

                <a
                  href={activeDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                  <span className="hidden sm:inline">Nueva Pestaña</span>
                </a>

                <a
                  href={activeDocument}
                  download
                  className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  title="Descargar archivo PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
              </div>
            )}
          </div>

          {/* Active Document Metadata Strip */}
          {selectedDocObject && (
            <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{selectedDocObject.titulo}</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-800 font-semibold">{selectedDocObject.periodo}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>Ruta: {selectedDocObject.url}</span>
              </div>
            </div>
          )}

          {/* Visor / Iframe Container or Empty State */}
          <div
            className={`w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center ${
              isFullscreen
                ? "fixed inset-0 z-50 rounded-none border-0 h-screen w-screen bg-slate-950 p-2 sm:p-4"
                : "min-h-[850px]"
            }`}
          >
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-6 z-50 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 backdrop-blur-md"
              >
                <Minimize2 className="w-4 h-4 text-emerald-400" />
                <span>Salir de Pantalla Completa</span>
              </button>
            )}
            {activeDocument ? (
              <iframe
                src={`${activeDocument}#toolbar=1&navpanes=0&view=FitH&zoom=100`}
                width="100%"
                height={isFullscreen ? "100%" : "850px"}
                className={`border-0 w-full ${isFullscreen ? "h-full rounded-xl" : "rounded-md"}`}
                title={selectedDocObject ? selectedDocObject.titulo : "Visor de Documentos Pedagógicos"}
              />
            ) : (
              /* Empty State Elegante */
              <div className="p-12 text-center flex flex-col items-center justify-center max-w-md">
                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Visor de Documentos Vacío
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Seleccione un documento del panel lateral para visualizarlo.
                </p>
              </div>
            )}
          </div>

          {/* Footer of Visor */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Visor oficial de planificaciones curriculares • Escuela de Educación Básica &quot;Pichincha&quot;
            </span>
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Validado por Vicerrectorado Académico</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
