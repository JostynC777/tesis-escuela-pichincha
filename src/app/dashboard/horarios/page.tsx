"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import {
  CalendarClock,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  Eye,
  Users,
  GraduationCap,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";

interface HorarioRow {
  id: string;
  titulo: string;
  tipo: "estudiantes" | "docente";
  docente_id: string | null;
  formato: "pdf" | "excel";
  archivo_url: string;
  created_at: string;
  docente?: { id: string; nombres_completos: string } | null;
}

interface TeacherOption {
  id: string;
  nombres_completos: string;
}

function detectFormat(fileName: string, mimeType?: string): "pdf" | "excel" {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    return "pdf";
  }
  return "excel";
}

export default function HorariosClasesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [roleLoaded, setRoleLoaded] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("docente");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"estudiantes" | "docente">("estudiantes");
  const [horarios, setHorarios] = useState<HorarioRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<HorarioRow | null>(null);

  // Modal subir / reemplazar
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [editingHorario, setEditingHorario] = useState<HorarioRow | null>(null);
  const [formTipo, setFormTipo] = useState<"estudiantes" | "docente">("estudiantes");
  const [formDocenteId, setFormDocenteId] = useState<string>("");
  const [formTitulo, setFormTitulo] = useState<string>("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isDirective =
    roleLoaded &&
    (userRole === "directora" || userRole === "admin" || userRole === "rectorado");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const scope = await getUserCourseScope();
      const normRole = scope.rol.trim().toLowerCase();
      setUserRole(normRole);
      setCurrentUserId(scope.profileId);
      setRoleLoaded(true);

      const directive =
        normRole === "directora" || normRole === "admin" || normRole === "rectorado";

      // Fail-closed: si no es directivo, forzar pestaña estudiantes y nunca consultar horarios docentes
      if (!directive) {
        setActiveTab("estudiantes");
      }

      let horariosQuery = (supabase as any)
        .from("horarios")
        .select("*, docente:perfiles_usuarios!docente_id(id, nombres_completos)")
        .order("created_at", { ascending: false });

      if (!directive) {
        horariosQuery = horariosQuery.eq("tipo", "estudiantes");
      }

      const [horariosRes, teachersRes] = await Promise.all([
        horariosQuery,
        directive
          ? supabase
              .from("perfiles_usuarios")
              .select("id, nombres_completos")
              .eq("rol", "docente")
              .eq("activo", true)
              .order("nombres_completos")
          : Promise.resolve(null),
      ]);

      if (horariosRes?.error) throw horariosRes.error;

      const list = (horariosRes?.data || []) as HorarioRow[];
      setHorarios(list);

      if (teachersRes?.data) {
        const tList = teachersRes.data as TeacherOption[];
        setTeachers(tList);
        if (tList.length > 0 && !formDocenteId) {
          setFormDocenteId(tList[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error cargando horarios:", err);
      showToast("Error al cargar horarios: " + (err?.message || ""), "error");
    } finally {
      setLoading(false);
    }
  }, [formDocenteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seguridad adicional: si URL trae ?tab=docente o alguien intenta cambiar de pestaña sin ser directivo
  useEffect(() => {
    if (roleLoaded && !isDirective && activeTab === "docente") {
      setActiveTab("estudiantes");
    }
  }, [roleLoaded, isDirective, activeTab]);

  const visibleHorarios = useMemo(() => {
    const effectiveTab = isDirective ? activeTab : "estudiantes";
    return horarios.filter((h) => h.tipo === effectiveTab);
  }, [horarios, activeTab, isDirective]);

  useEffect(() => {
    if (visibleHorarios.length > 0) {
      if (!selectedHorario || !visibleHorarios.some((h) => h.id === selectedHorario.id)) {
        setSelectedHorario(visibleHorarios[0]);
      }
    } else {
      setSelectedHorario(null);
    }
  }, [visibleHorarios, selectedHorario]);

  const openUploadModal = (existing: HorarioRow | null = null) => {
    if (!isDirective) return;
    setFormError(null);
    setFormFile(null);
    if (existing) {
      setEditingHorario(existing);
      setFormTipo(existing.tipo);
      setFormDocenteId(existing.docente_id || teachers[0]?.id || "");
      setFormTitulo(existing.titulo);
    } else {
      setEditingHorario(null);
      setFormTipo(activeTab);
      setFormDocenteId(teachers[0]?.id || "");
      setFormTitulo("");
    }
    setShowUploadModal(true);
  };

  const handleSaveHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirective) return;
    setFormError(null);

    if (!formTitulo.trim()) {
      setFormError("Ingresa un título para el horario.");
      return;
    }
    if (formTipo === "docente" && !formDocenteId) {
      setFormError("Selecciona el docente al que pertenece este horario.");
      return;
    }
    if (!editingHorario && !formFile) {
      setFormError("Selecciona un archivo PDF o Excel (.pdf, .xlsx, .xls).");
      return;
    }

    if (formFile) {
      const lower = formFile.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
        setFormError("Solo se permiten archivos PDF (.pdf) o Excel (.xlsx, .xls).");
        return;
      }
    }

    setIsSaving(true);
    try {
      let archivoUrl = editingHorario?.archivo_url || "";
      let formato: "pdf" | "excel" = editingHorario?.formato || "pdf";

      if (formFile) {
        formato = detectFormat(formFile.name, formFile.type);
        const safeName = formFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${formTipo}/${Date.now()}_${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from("horarios")
          .upload(storagePath, formFile, {
            contentType: formFile.type || undefined,
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data: pubData } = supabase.storage
          .from("horarios")
          .getPublicUrl(storagePath);

        archivoUrl = pubData.publicUrl;
      }

      const payload: any = {
        titulo: formTitulo.trim(),
        tipo: formTipo,
        docente_id: formTipo === "docente" ? formDocenteId : null,
        formato,
        archivo_url: archivoUrl,
      };

      if (editingHorario) {
        const { error: updErr } = await (supabase as any)
          .from("horarios")
          .update(payload)
          .eq("id", editingHorario.id);
        if (updErr) throw updErr;
        showToast("Horario actualizado correctamente.", "success");
      } else {
        const { error: insErr } = await (supabase as any)
          .from("horarios")
          .insert([{ ...payload, subido_por: currentUserId || null }]);
        if (insErr) throw insErr;
        showToast("Horario publicado correctamente.", "success");
      }

      setShowUploadModal(false);
      setEditingHorario(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || "Error al guardar el horario en Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHorario = async (item: HorarioRow) => {
    if (!isDirective) return;
    try {
      const { error } = await (supabase as any)
        .from("horarios")
        .delete()
        .eq("id", item.id);
      if (error) throw error;

      // Intentar limpiar archivo en Storage si pertenece al bucket horarios
      const marker = "/storage/v1/object/public/horarios/";
      if (item.archivo_url.includes(marker)) {
        const path = item.archivo_url.split(marker)[1];
        if (path) {
          await supabase.storage.from("horarios").remove([decodeURIComponent(path)]);
        }
      }

      showToast("Horario eliminado correctamente.", "success");
      await loadData();
    } catch (err: any) {
      showToast("Error al eliminar horario: " + (err?.message || ""), "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
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

      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" />
            <span>Organización Académica • Escuela Pichincha</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Horarios de Clases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta y descarga de horarios oficiales en formato PDF y Excel.
          </p>
        </div>

        {isDirective && (
          <button
            onClick={() => openUploadModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Horario (PDF / Excel)</span>
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("estudiantes")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "estudiantes" || !isDirective
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Horario General de Estudiantes</span>
        </button>

        {isDirective && (
          <button
            type="button"
            onClick={() => setActiveTab("docente")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "docente"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Horarios por Docente</span>
          </button>
        )}
      </div>

      {/* Contenido Principal Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista izquierda */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-700 mb-2" />
              <p className="text-xs">Cargando horarios desde Supabase...</p>
            </div>
          ) : visibleHorarios.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
              <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">
                No hay horarios publicados en esta sección
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isDirective
                  ? 'Haz clic en "Subir Horario (PDF / Excel)" para cargar el primero.'
                  : "Dirección aún no ha publicado horarios generales."}
              </p>
            </div>
          ) : (
            visibleHorarios.map((item) => {
              const isSelected = selectedHorario?.id === item.id;
              const isPdf = item.formato === "pdf";
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedHorario(item)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isPdf
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mb-1 ${
                            isPdf
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isPdf ? "PDF" : "Excel"}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {item.titulo}
                        </h4>
                        {item.tipo === "docente" && item.docente?.nombres_completos && (
                          <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                            Docente: {item.docente.nombres_completos}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Publicado el{" "}
                          {new Date(item.created_at).toLocaleDateString("es-EC")}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={item.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Descargar archivo"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {isDirective && (
                        <>
                          <button
                            type="button"
                            onClick={() => openUploadModal(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Reemplazar / editar horario"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHorario(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Eliminar horario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Visor derecho */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          {selectedHorario ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    {selectedHorario.tipo === "docente"
                      ? `Horario Docente • ${selectedHorario.docente?.nombres_completos || ""}`
                      : "Horario General de Estudiantes"}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {selectedHorario.titulo}
                  </h3>
                </div>

                <a
                  href={selectedHorario.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </a>
              </div>

              <div className="flex-1 bg-slate-100 p-3">
                {selectedHorario.formato === "pdf" ? (
                  <iframe
                    src={selectedHorario.archivo_url}
                    className="w-full h-full rounded-xl border border-slate-200 bg-white"
                    title={selectedHorario.titulo}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Documento Excel (.xlsx / .xls)
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-2">
                          {selectedHorario.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Descargue el archivo de Excel para visualizarlo en Microsoft Excel o LibreOffice.
                        </p>
                      </div>
                      <a
                        href={selectedHorario.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Excel</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400">
              <Eye className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Selecciona un horario</p>
              <p className="text-xs text-slate-500 mt-1">
                Elige un documento del panel izquierdo para previsualizarlo o descargarlo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Subir / Reemplazar (solo directivos) */}
      {showUploadModal && isDirective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-black text-slate-900">
                  {editingHorario ? "Reemplazar Horario" : "Subir Nuevo Horario"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHorario} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Horario: *
                </label>
                <select
                  value={formTipo}
                  onChange={(e) =>
                    setFormTipo(e.target.value as "estudiantes" | "docente")
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="estudiantes">Horario General de Estudiantes</option>
                  <option value="docente">Horario por Docente</option>
                </select>
              </div>

              {formTipo === "docente" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Docente Asignado: *
                  </label>
                  <select
                    value={formDocenteId}
                    onChange={(e) => setFormDocenteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombres_completos}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Documento: *
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  required
                  placeholder="Ej. Horario General Jornada Matutina 2026-2027"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Archivo (PDF o Excel): {editingHorario ? "(opcional para reemplazar)" : "*"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  required={!editingHorario}
                  className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-700 file:text-white hover:file:bg-blue-800 text-slate-600 w-full"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Se almacenará en el bucket &ldquo;horarios&rdquo; de Supabase Storage.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{editingHorario ? "Guardar Cambios" : "Subir Horario"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
