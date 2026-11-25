"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { getUserCourseScope } from "@/lib/roleScope";
import { Curso, Estudiante, PerfilUsuario, NivelAlertaDECE } from "@/types/database.types";
import { StudentIdCardModal, BatchCarnetPrintView } from "@/components/dashboard/StudentIdCard";
import {
  Users,
  Upload,
  UserPlus,
  Search,
  Filter,
  QrCode,
  Printer,
  Download,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpDown,
  RefreshCw,
  Eye,
  Check,
  X,
  FileDown,
} from "lucide-react";

interface ParsedStudentRow {
  index: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  curso_id: string;
  curso_nombre: string;
  tutor_id?: string | null;
  tutor_nombre?: string;
  codigo_qr: string;
  nombre_representante?: string;
  telefono_representante?: string;
  cuenta_institucional?: string;
  observacion?: string;
  valido: boolean;
  seleccionado: boolean;
  advertencia?: string;
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Estudiante[]>([]);
  const [courses, setCourses] = useState<Curso[]>([]);
  const [teachers, setTeachers] = useState<PerfilUsuario[]>([]);
  const [userRole, setUserRole] = useState<string>("docente");
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [selectedDeceFilter, setSelectedDeceFilter] = useState<string>("ALL");

  // Estados para modales
  const [showImporterModal, setShowImporterModal] = useState<boolean>(false);
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [activeStudentForCard, setActiveStudentForCard] = useState<any | null>(null);
  const [showBatchCarnetModal, setShowBatchCarnetModal] = useState<boolean>(false);
  const [studentToEdit, setStudentToEdit] = useState<Estudiante | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Estudiante | null>(null);

  // Estados de importacion Excel
  const [excelRows, setExcelRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [importTargetCourse, setImportTargetCourse] = useState<string>("");
  const [importStats, setImportStats] = useState<{ total: number; validos: number; invalidos: number } | null>(null);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notificaciones Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar datos iniciales desde Supabase con filtrado estricto por rol
  const fetchData = async () => {
    setLoading(true);
    try {
      const scope = await getUserCourseScope();
      setUserRole(scope.rol);
      setIsAdminUser(scope.isAdmin);

      const [coursesRes, teachersRes] = await Promise.all([
        supabase.from("cursos").select("*, tutor:perfiles_usuarios(id, nombres_completos)").order("orden"),
        supabase.from("perfiles_usuarios").select("*").eq("rol", "docente").eq("activo", true).order("nombres_completos"),
      ]);

      const allCourses = (coursesRes.data || []) as unknown as Curso[];
      if (teachersRes.data) setTeachers(teachersRes.data as unknown as PerfilUsuario[]);

      const visibleCourses =
        scope.allowedCourseIds !== null
          ? allCourses.filter((c) => scope.allowedCourseIds!.includes(c.id))
          : allCourses;

      setCourses(visibleCourses);
      if (visibleCourses.length > 0 && !importTargetCourse) {
        setImportTargetCourse(visibleCourses[0].id);
      }

      if (scope.allowedCourseIds !== null && scope.allowedCourseIds.length === 0) {
        setStudents([]);
      } else {
        let studentsQuery = supabase
          .from("estudiantes")
          .select("*, curso:cursos(id, nombre, tutor_id), tutor:perfiles_usuarios(id, nombres_completos)")
          .order("apellidos");

        if (scope.allowedCourseIds !== null) {
          studentsQuery = studentsQuery.in("curso_id", scope.allowedCourseIds);
        }

        const studentsRes = await studentsQuery;
        if (studentsRes.data) setStudents(studentsRes.data as unknown as Estudiante[]);
      }
    } catch (err: any) {
      console.error("Error al cargar datos:", err);
      showToast("Error al sincronizar datos desde Supabase", "error");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = isAdminUser;

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado de estudiantes
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const fullName = `${st.apellidos} ${st.nombres} ${st.cedula} ${st.codigo_qr}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      const matchesCourse = selectedCourseFilter === "ALL" || st.curso_id === selectedCourseFilter;
      const matchesDece = selectedDeceFilter === "ALL" || st.alerta_dece === selectedDeceFilter;
      return matchesSearch && matchesCourse && matchesDece;
    });
  }, [students, searchTerm, selectedCourseFilter, selectedDeceFilter]);

  // Metricas de resumen
  const metrics = useMemo(() => {
    const total = students.length;
    const deceCritico = students.filter((s) => s.alerta_dece === "critico").length;
    const deceModerado = students.filter((s) => s.alerta_dece === "moderado").length;
    const conQR = students.filter((s) => !!s.codigo_qr).length;
    const cursosConAlumnos = new Set(students.map((s) => s.curso_id)).size;
    return { total, deceCritico, deceModerado, conQR, cursosConAlumnos };
  }, [students]);

  // Manejo de importacion Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!rawJson || rawJson.length === 0) {
          showToast("El archivo esta vacio o no tiene formato valido", "error");
          setIsProcessingFile(false);
          return;
        }

        // Detectar la fila de encabezados buscando 'CEDULA' o 'CÉDULA' o 'NOMBRES'
        let headerRowIndex = -1;
        let colCedula = -1;
        let colNombres = -1;
        let colApellidos = -1;
        let colNombresCompletos = -1;
        let colCuenta = -1;
        let colCurso = -1;
        let colRepresentante = -1;
        let colTelefono = -1;

        for (let i = 0; i < Math.min(rawJson.length, 15); i++) {
          const row = rawJson[i];
          for (let j = 0; j < row.length; j++) {
            const val = String(row[j]).trim().toUpperCase();
            if (val.includes("CÉDULA") || val.includes("CEDULA") || val === "IDENTIFICACION" || val === "ID") {
              headerRowIndex = i;
              colCedula = j;
            }
            if (val.includes("NOMBRES COMPLETOS") || val === "ESTUDIANTE" || val === "ALUMNO") {
              colNombresCompletos = j;
            } else if (val === "NOMBRES" || val === "NOMBRE") {
              colNombres = j;
            } else if (val === "APELLIDOS" || val === "APELLIDO") {
              colApellidos = j;
            }
            if (val.includes("CUENTA") || val.includes("CORREO") || val.includes("EMAIL")) {
              colCuenta = j;
            }
            if (val.includes("CURSO") || val.includes("GRADO")) {
              colCurso = j;
            }
            if (val.includes("REPRESENTANTE")) {
              colRepresentante = j;
            }
            if (val.includes("TELÉFONO") || val.includes("TELEFONO") || val.includes("CELULAR")) {
              colTelefono = j;
            }
          }
          if (headerRowIndex !== -1) break;
        }

        // Si no se detecto fila con encabezados explicitos, asumimos fila 0
        if (headerRowIndex === -1) {
          headerRowIndex = 0;
          colCedula = 1;
          colNombresCompletos = 2;
        }

        const parsedRows: ParsedStudentRow[] = [];
        const targetCourseObj = courses.find((c) => c.id === importTargetCourse);
        const targetCourseName = targetCourseObj ? targetCourseObj.nombre : "5.º EGB";
        const targetCourseTutorId = targetCourseObj?.tutor_id || null;
        const targetCourseTutorName = targetCourseObj?.tutor?.nombres_completos || "Docente Titular";

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          let rawCedula = colCedula !== -1 && row[colCedula] !== undefined ? String(row[colCedula]).trim() : "";
          // Limpiar caracteres especiales de la cedula
          rawCedula = rawCedula.replace(/[^0-9A-Za-z]/g, "");

          if (!rawCedula || rawCedula.length < 5) continue;

          let nombres = "";
          let apellidos = "";
          let observacion = "";

          // Comprobar si toda la fila contiene palabras como RETIRADO
          const rowText = row.join(" ").toUpperCase();
          const esRetirado = rowText.includes("RETIRADO");
          if (esRetirado) {
            observacion = "Estudiante marcado como RETIRADO en nomina oficial";
          }

          if (colNombresCompletos !== -1 && row[colNombresCompletos]) {
            const rawFull = String(row[colNombresCompletos]).trim();
            const words = rawFull.split(/\s+/).filter(Boolean);
            if (words.length >= 3) {
              apellidos = words.slice(0, 2).join(" ");
              nombres = words.slice(2).join(" ");
            } else if (words.length === 2) {
              apellidos = words[0];
              nombres = words[1];
            } else {
              apellidos = rawFull;
              nombres = "";
            }
          } else {
            nombres = colNombres !== -1 && row[colNombres] ? String(row[colNombres]).trim() : "";
            apellidos = colApellidos !== -1 && row[colApellidos] ? String(row[colApellidos]).trim() : "";
          }

          // Si el archivo incluye columna de curso, intentar emparejarlo
          let rowCourseId = importTargetCourse;
          let rowCourseName = targetCourseName;
          let rowTutorId = targetCourseTutorId;
          let rowTutorName = targetCourseTutorName;

          if (colCurso !== -1 && row[colCurso]) {
            const fileCourseName = String(row[colCurso]).trim();
            const matched = courses.find((c) =>
              c.nombre.toLowerCase().replace(/[^a-z0-9]/g, "") === fileCourseName.toLowerCase().replace(/[^a-z0-9]/g, "")
            );
            if (matched) {
              rowCourseId = matched.id;
              rowCourseName = matched.nombre;
              rowTutorId = matched.tutor_id || null;
              rowTutorName = matched.tutor?.nombres_completos || "Docente Titular";
            }
          }

          const cuenta = colCuenta !== -1 && row[colCuenta] ? String(row[colCuenta]).trim() : undefined;
          const representante = colRepresentante !== -1 && row[colRepresentante] ? String(row[colRepresentante]).trim() : undefined;
          const telefono = colTelefono !== -1 && row[colTelefono] ? String(row[colTelefono]).trim() : undefined;

          const esValida = rawCedula.length >= 9 && (nombres.length > 0 || apellidos.length > 0);
          const yaExiste = students.some((s) => s.cedula === rawCedula);

          parsedRows.push({
            index: parsedRows.length + 1,
            cedula: rawCedula,
            nombres: nombres || "POR_DEFINIR",
            apellidos: apellidos || "POR_DEFINIR",
            curso_id: rowCourseId,
            curso_nombre: rowCourseName,
            tutor_id: rowTutorId,
            tutor_nombre: rowTutorName,
            codigo_qr: `PICH-${rawCedula}`,
            nombre_representante: representante,
            telefono_representante: telefono,
            cuenta_institucional: cuenta,
            observacion: observacion || (yaExiste ? "Se actualizara (cedula ya existente)" : undefined),
            valido: esValida,
            seleccionado: esValida && !esRetirado,
            advertencia: yaExiste ? "Actualizacion de registro existente" : esRetirado ? "Estudiante retirado" : undefined,
          });
        }

        setExcelRows(parsedRows);
        const validos = parsedRows.filter((r) => r.valido).length;
        setImportStats({
          total: parsedRows.length,
          validos,
          invalidos: parsedRows.length - validos,
        });

        if (parsedRows.length === 0) {
          showToast("No se encontraron registros validos de estudiantes en el documento", "error");
        } else {
          showToast(`Se identificaron ${parsedRows.length} filas en el archivo`, "info");
        }
      } catch (err: any) {
        console.error("Error al procesar archivo:", err);
        showToast("Error al parsear el documento Excel: " + err.message, "error");
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Ejecucion de Upsert masivo a Supabase
  const executeMassUpsert = async () => {
    const selectedRows = excelRows.filter((r) => r.seleccionado && r.valido);
    if (selectedRows.length === 0) {
      showToast("Selecciona al menos un estudiante valido para importar", "error");
      return;
    }

    setIsSubmittingImport(true);
    try {
      const recordsToUpsert = selectedRows.map((r) => ({
        cedula: r.cedula,
        nombres: r.nombres,
        apellidos: r.apellidos,
        curso_id: r.curso_id,
        tutor_id: r.tutor_id || null,
        codigo_qr: r.codigo_qr,
        nombre_representante: r.nombre_representante || null,
        telefono_representante: r.telefono_representante || null,
        alerta_dece: "estable" as NivelAlertaDECE,
        activo: true,
      }));

      const { data, error } = await (supabase.from("estudiantes") as any)
        .upsert(recordsToUpsert, { onConflict: "cedula" })
        .select();

      if (error) throw error;

      showToast(`Se importaron exitosamente ${selectedRows.length} estudiantes a Supabase`, "success");
      setShowImporterModal(false);
      setExcelRows([]);
      setImportStats(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchData();
    } catch (err: any) {
      console.error("Error al guardar en Supabase:", err);
      showToast("Error en la insercion masiva: " + (err.message || "Fallo en base de datos"), "error");
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // Descargar plantilla Excel oficial
  const downloadTemplateExcel = () => {
    const wsData = [
      ["CÉDULA", "APELLIDOS", "NOMBRES", "CURSO", "REPRESENTANTE", "TELEFONO", "CUENTA INSTITUCIONAL"],
      ["1750995308", "AYMARA VIRACUCHA", "MARCO ANDRES", "5.º EGB", "Segundo Aymara", "0984123456", "ayvimaan16676509@estudiantes.edu.ec"],
      ["1755600911", "CACHAGO CORREA", "MATEO JOSE", "5.º EGB", "Maria Correa", "0995678901", "cacomajo1608123@estudiantes.edu.ec"],
      ["1754671442", "CARRERA CARRERA", "BRITANNY LISETH", "5.º EGB", "Martha Carrera", "0987345678", "cacabrli1525291@estudiantes.edu.ec"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nomina_Pichincha");
    XLSX.writeFile(wb, "Plantilla_Estudiantes_Escuela_Pichincha.xlsx");
    showToast("Plantilla descargada correctamente", "success");
  };

  // Manejo de guardado individual (creacion o edicion)
  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cedula = String(formData.get("cedula") || "").trim();
    const nombres = String(formData.get("nombres") || "").trim();
    const apellidos = String(formData.get("apellidos") || "").trim();
    const curso_id = String(formData.get("curso_id") || "").trim();
    const tutor_id = String(formData.get("tutor_id") || "").trim() || null;
    const nombre_representante = String(formData.get("nombre_representante") || "").trim() || null;
    const telefono_representante = String(formData.get("telefono_representante") || "").trim() || null;
    const alerta_dece = (String(formData.get("alerta_dece") || "estable")) as NivelAlertaDECE;
    const observacion_dece = String(formData.get("observacion_dece") || "").trim() || null;

    if (!cedula || !nombres || !apellidos || !curso_id) {
      showToast("Cédula, nombres, apellidos y curso son obligatorios", "error");
      return;
    }

    try {
      const codigo_qr = `PICH-${cedula}`;
      if (studentToEdit) {
        // Actualizar
        const { error } = await (supabase.from("estudiantes") as any)
          .update({
            cedula,
            nombres,
            apellidos,
            curso_id,
            tutor_id,
            codigo_qr,
            nombre_representante,
            telefono_representante,
            alerta_dece,
            observacion_dece,
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentToEdit.id);

        if (error) throw error;
        showToast("Estudiante actualizado correctamente", "success");
      } else {
        // Crear
        const { error } = await (supabase.from("estudiantes") as any).insert([
          {
            cedula,
            nombres,
            apellidos,
            curso_id,
            tutor_id,
            codigo_qr,
            nombre_representante,
            telefono_representante,
            alerta_dece,
            observacion_dece,
          },
        ]);

        if (error) throw error;
        showToast("Estudiante matriculado con exito", "success");
      }

      setShowStudentModal(false);
      setStudentToEdit(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al guardar estudiante:", err);
      showToast("Error al guardar: " + (err.message || "Conflicto con cedula duplicada"), "error");
    }
  };

  // Eliminar estudiante
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const { error } = await supabase.from("estudiantes").delete().eq("id", studentToDelete.id);
      if (error) throw error;
      showToast(`Estudiante ${studentToDelete.apellidos} eliminado`, "info");
      setShowDeleteModal(false);
      setStudentToDelete(null);
      await fetchData();
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      showToast("Error al eliminar estudiante: " + err.message, "error");
    }
  };

  // Obtener lista para carnet masivo segun filtro actual
  const studentsForBatchPrint = useMemo(() => {
    if (selectedCourseFilter !== "ALL") {
      return students
        .filter((s) => s.curso_id === selectedCourseFilter)
        .map((s) => ({
          id: s.id,
          cedula: s.cedula,
          nombres: s.nombres,
          apellidos: s.apellidos,
          codigo_qr: s.codigo_qr,
          curso_nombre: s.curso?.nombre || "Curso Asignado",
          tutor_nombre: s.tutor?.nombres_completos || "Docente Titular",
        }));
    }
    return filteredStudents.map((s) => ({
      id: s.id,
      cedula: s.cedula,
      nombres: s.nombres,
      apellidos: s.apellidos,
      codigo_qr: s.codigo_qr,
      curso_nombre: s.curso?.nombre || "Curso Asignado",
      tutor_nombre: s.tutor?.nombres_completos || "Docente Titular",
    }));
  }, [students, filteredStudents, selectedCourseFilter]);

  const currentCourseName = useMemo(() => {
    if (selectedCourseFilter === "ALL") return "Todos los Cursos";
    return courses.find((c) => c.id === selectedCourseFilter)?.nombre || "Curso";
  }, [selectedCourseFilter, courses]);

  return (
    <div className="space-y-6">
      {/* Toast de Notificaciones */}
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
          {toast.type === "error" && <XCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === "info" && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Gestion Institucional • Escuela Pichincha</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Nomina de Estudiantes y Carnets QR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Importacion masiva desde Excel/CSV, generacion de credenciales QR compatibles con la App Android y control curricular.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={downloadTemplateExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                title="Descargar formato Excel para rellenar nominas"
              >
                <FileDown className="w-4 h-4 text-slate-600" />
                <span>Plantilla Excel</span>
              </button>

              <button
                onClick={() => setShowImporterModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Importar desde Excel</span>
              </button>

              <button
                onClick={() => {
                  setStudentToEdit(null);
                  setShowStudentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Estudiante</span>
              </button>
            </>
          )}

          {studentsForBatchPrint.length > 0 && (
            <button
              onClick={() => setShowBatchCarnetModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-400 rounded-xl hover:bg-amber-500 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Carnets ({studentsForBatchPrint.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Matriculados
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">En la base de datos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Carnets QR Activos
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{metrics.conQR}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Listos para App Movil</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Alertas DECE
            </div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">
              {metrics.deceCritico + metrics.deceModerado}
            </div>
            <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
              {metrics.deceCritico} criticos • {metrics.deceModerado} moderados
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cursos con Alumnos
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-0.5">
              {metrics.cursosConAlumnos} / {courses.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Desde Inicial 1 a 3.º BT</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Busqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cédula, apellido o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Selector de Curso */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
            >
              {isAdmin ? (
                <option value="ALL">Todos los Cursos ({courses.length})</option>
              ) : courses.length > 1 ? (
                <option value="ALL">Mis Cursos ({courses.length})</option>
              ) : courses.length === 0 ? (
                <option value="ALL">Sin cursos asignados</option>
              ) : null}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Alerta DECE */}
          <select
            value={selectedDeceFilter}
            onChange={(e) => setSelectedDeceFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700"
          >
            <option value="ALL">Todas las Alertas</option>
            <option value="estable">Estable</option>
            <option value="moderado">Moderado</option>
            <option value="critico">Critico</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refrescar lista desde Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Listado de Alumnos Matriculados
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredStudents.length} {filteredStudents.length === 1 ? "alumno" : "alumnos"}
            </span>
          </div>
          {selectedCourseFilter !== "ALL" && (
            <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
              Filtrado por: {currentCourseName}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700 mb-2" />
            <p className="text-xs font-medium">Sincronizando nómina desde Supabase...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No se encontraron estudiantes</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Puedes subir un archivo Excel con las listas oficiales de la Escuela Pichincha o matricular estudiantes manualmente.
            </p>
            <button
              onClick={() => setShowImporterModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Excel Ahora</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Grado / Curso</th>
                  <th className="py-3 px-4">Docente Tutor(a)</th>
                  <th className="py-3 px-4">Código QR (Android)</th>
                  <th className="py-3 px-4">Alerta DECE</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 uppercase">
                        {st.apellidos} {st.nombres}
                      </div>
                      {st.nombre_representante && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rep: {st.nombre_representante} {st.telefono_representante ? `(${st.telefono_representante})` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{st.cedula}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-extrabold text-[11px]">
                        {st.curso?.nombre || "Sin Asignar"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.tutor?.nombres_completos || st.curso?.tutor_id ? (
                        <span className="font-semibold text-slate-700">
                          {st.tutor?.nombres_completos || "Docente Asignado"}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No asignado</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          setActiveStudentForCard({
                            id: st.id,
                            cedula: st.cedula,
                            nombres: st.nombres,
                            apellidos: st.apellidos,
                            codigo_qr: st.codigo_qr,
                            curso_nombre: st.curso?.nombre,
                            tutor_nombre: st.tutor?.nombres_completos,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors font-mono text-[10px] font-bold text-slate-700"
                        title="Ver y descargar carnet QR"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>{st.codigo_qr}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          st.alerta_dece === "critico"
                            ? "bg-rose-100 text-rose-800"
                            : st.alerta_dece === "moderado"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.alerta_dece === "critico"
                              ? "bg-rose-600"
                              : st.alerta_dece === "moderado"
                              ? "bg-amber-600"
                              : "bg-emerald-600"
                          }`}
                        />
                        {st.alerta_dece || "estable"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            setActiveStudentForCard({
                              id: st.id,
                              cedula: st.cedula,
                              nombres: st.nombres,
                              apellidos: st.apellidos,
                              codigo_qr: st.codigo_qr,
                              curso_nombre: st.curso?.nombre,
                              tutor_nombre: st.tutor?.nombres_completos,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="Ver carnet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setStudentToEdit(st);
                                setShowStudentModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Editar estudiante"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setStudentToDelete(st);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Eliminar estudiante"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: IMPORTADOR EXCEL (SHEETJS) CON PREVISUALIZACION Y MAPEO         */}
      {/* ========================================================================= */}
      {showImporterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Importador Inteligente de Nóminas Excel / CSV
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mapeo automático de columnas y upsert masivo en Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImporterModal(false);
                  setExcelRows([]);
                  setImportStats(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido / Pasos */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Selector de curso de destino y carga de archivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grado / Curso por Defecto:
                  </label>
                  <select
                    value={importTargetCourse}
                    onChange={(e) => setImportTargetCourse(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} • Tutor: {c.tutor?.nombres_completos || "Docente Titular"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Si el archivo no especifica el curso, se asignará a este grado automáticamente.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Documento de Lista (.xlsx, .xls o .csv):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-700 file:text-white hover:file:bg-blue-800 text-slate-600 w-full"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Compatible con formatos oficiales del MinEduc (No., Cédula, Nombres Completos, Cuenta).
                  </p>
                </div>
              </div>

              {/* Estado de carga */}
              {isProcessingFile && (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                  <p className="text-xs font-semibold">Procesando y validando filas del archivo...</p>
                </div>
              )}

              {/* Estadisticas de previsualizacion */}
              {importStats && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-blue-900">
                      Total detectados: {importStats.total}
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Validos para guardar: {excelRows.filter((r) => r.seleccionado).length}
                    </span>
                    {importStats.invalidos > 0 && (
                      <span className="text-rose-700 font-semibold">
                        Incompletos o vacios: {importStats.invalidos}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExcelRows((prev) => prev.map((r) => (r.valido ? { ...r, seleccionado: true } : r)))
                      }
                      className="text-[11px] font-bold text-blue-700 hover:underline"
                    >
                      Seleccionar todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setExcelRows((prev) => prev.map((r) => ({ ...r, seleccionado: false })))}
                      className="text-[11px] font-bold text-slate-600 hover:underline"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla de Previsualizacion */}
              {excelRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 z-10 text-slate-600 uppercase text-[9px] font-bold">
                      <tr className="border-b border-slate-200">
                        <th className="p-2.5 w-10 text-center">Incluir</th>
                        <th className="p-2.5">Cédula</th>
                        <th className="p-2.5">Apellidos</th>
                        <th className="p-2.5">Nombres</th>
                        <th className="p-2.5">Curso Mapeado</th>
                        <th className="p-2.5">Código QR a Generar</th>
                        <th className="p-2.5">Estado / Observación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelRows.map((row) => (
                        <tr
                          key={row.index}
                          className={`hover:bg-slate-50 transition-colors ${
                            !row.valido ? "bg-rose-50/50" : row.advertencia ? "bg-amber-50/40" : ""
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={row.seleccionado}
                              disabled={!row.valido}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setExcelRows((prev) =>
                                  prev.map((r) => (r.index === row.index ? { ...r, seleccionado: checked } : r))
                                );
                              }}
                              className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{row.cedula}</td>
                          <td className="p-2.5 font-bold uppercase">{row.apellidos}</td>
                          <td className="p-2.5 font-bold uppercase">{row.nombres}</td>
                          <td className="p-2.5 font-semibold text-blue-800">{row.curso_nombre}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-600">{row.codigo_qr}</td>
                          <td className="p-2.5">
                            {row.observacion ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                  row.observacion.includes("RETIRADO")
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {row.observacion}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                Valido
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pie / Acciones */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <div className="text-xs text-slate-500">
                {excelRows.filter((r) => r.seleccionado).length} estudiantes listos para upsert
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImporterModal(false);
                    setExcelRows([]);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeMassUpsert}
                  disabled={isSubmittingImport || excelRows.filter((r) => r.seleccionado).length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                >
                  {isSubmittingImport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar e Importar Nómina</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREAR / EDITAR ESTUDIANTE INDIVIDUAL                             */}
      {/* ========================================================================= */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {studentToEdit ? "Editar Estudiante" : "Matricular Nuevo Estudiante"}
              </h3>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentToEdit(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Cédula / Identificación: *
                  </label>
                  <input
                    name="cedula"
                    type="text"
                    required
                    defaultValue={studentToEdit?.cedula || ""}
                    placeholder="Ej. 1750995308"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellidos: *
                  </label>
                  <input
                    name="apellidos"
                    type="text"
                    required
                    defaultValue={studentToEdit?.apellidos || ""}
                    placeholder="Ej. AYMARA VIRACUCHA"
                    className="w-full px-3 py-2 text-xs font-bold uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombres: *
                  </label>
                  <input
                    name="nombres"
                    type="text"
                    required
                    defaultValue={studentToEdit?.nombres || ""}
                    placeholder="Ej. MARCO ANDRES"
                    className="w-full px-3 py-2 text-xs font-bold uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grado / Curso Asignado: *
                  </label>
                  <select
                    name="curso_id"
                    required
                    defaultValue={studentToEdit?.curso_id || courses[0]?.id || ""}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                    Docente Tutor:
                  </label>
                  <select
                    name="tutor_id"
                    defaultValue={studentToEdit?.tutor_id || ""}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Asignar según Curso</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombres_completos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Representante:
                  </label>
                  <input
                    name="nombre_representante"
                    type="text"
                    defaultValue={studentToEdit?.nombre_representante || ""}
                    placeholder="Ej. Segundo Aymara"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Contacto:
                  </label>
                  <input
                    name="telefono_representante"
                    type="text"
                    defaultValue={studentToEdit?.telefono_representante || ""}
                    placeholder="Ej. 0984123456"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de Alerta DECE:
                  </label>
                  <select
                    name="alerta_dece"
                    defaultValue={studentToEdit?.alerta_dece || "estable"}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="estable">Estable (Sin riesgo)</option>
                    <option value="moderado">Moderado (Seguimiento requerido)</option>
                    <option value="critico">Critico (Riesgo academico o vulnerabilidad)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observaciones DECE / Generales:
                  </label>
                  <textarea
                    name="observacion_dece"
                    rows={2}
                    defaultValue={studentToEdit?.observacion_dece || ""}
                    placeholder="Observaciones de adaptacion curricular o situacion familiar..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentModal(false);
                    setStudentToEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm"
                >
                  {studentToEdit ? "Guardar Cambios" : "Guardar Estudiante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRMACION DE ELIMINACION                                      */}
      {/* ========================================================================= */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              ¿Eliminar estudiante de la nómina?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Se eliminará a <strong className="text-slate-800">{studentToDelete.apellidos} {studentToDelete.nombres}</strong> (C.I. {studentToDelete.cedula}).
              Esta acción eliminará también sus asistencias y calificaciones registradas.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CARNET QR INDIVIDUAL                                             */}
      {/* ========================================================================= */}
      {activeStudentForCard && (
        <StudentIdCardModal
          student={activeStudentForCard}
          onClose={() => setActiveStudentForCard(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: IMPRESION MASIVA DE CARNETS DEL CURSO                            */}
      {/* ========================================================================= */}
      {showBatchCarnetModal && (
        <BatchCarnetPrintView
          students={studentsForBatchPrint}
          cursoNombre={currentCourseName}
          onClose={() => setShowBatchCarnetModal(false)}
        />
      )}
    </div>
  );
}
