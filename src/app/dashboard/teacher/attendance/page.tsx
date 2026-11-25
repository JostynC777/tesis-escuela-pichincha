"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { Curso, Estudiante } from "@/types/database.types";
import {
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  School,
  ArrowLeft,
  Calendar,
  Save,
  Download,
  AlertCircle,
  Radio,
  FileSpreadsheet,
  Check,
  UserCheck,
  Info,
  Smartphone,
  Wifi,
  Filter,
  Loader2,
} from "lucide-react";

export type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "ATRASO" | "JUSTIFICADO";
export type MetodoAsistencia = "QR" | "MANUAL";

export interface StudentRowState {
  id: string; // ID del estudiante
  cedula: string;
  nombres: string;
  apellidos: string;
  nombres_completos: string;
  codigo_qr: string;
  curso_id: string;
  curso_nombre?: string;
  asistencia_id?: string;
  estado: EstadoAsistencia;
  metodo: MetodoAsistencia;
  hora: string | null;
  dispositivo: string;
  recienActualizado?: boolean;
}

export default function HybridAttendancePage() {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [studentsState, setStudentsState] = useState<StudentRowState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de Realtime y sincronización
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estado del generador QR de sesión docente
  const [qrActive, setQrActive] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Cargar cursos desde Supabase
  useEffect(() => {
    async function loadCourses() {
      try {
        const { data, error } = await supabase.from("cursos").select("*").order("orden");
        if (data && data.length > 0) {
          const cList = data as unknown as Curso[];
          setCourses(cList);
          // Por defecto seleccionar 5.º EGB si existe o el primero
          const defaultCourse = cList.find((c) => c.nombre.includes("5")) || cList[0];
          setSelectedCourseId(defaultCourse.id);
        }
      } catch (e) {
        console.error("Error al cargar cursos:", e);
      }
    }
    loadCourses();
  }, []);

  // 2. Cargar nómina de estudiantes y asistencias del día actual para el curso seleccionado
  const fetchAttendanceData = async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);

    try {
      // Consultar estudiantes del curso
      const { data: studentsData, error: stErr } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("curso_id", courseId)
        .order("apellidos");

      if (stErr) throw stErr;

      // Consultar asistencias registradas hoy para este curso
      const { data: attendanceData, error: atErr } = await supabase
        .from("asistencias")
        .select("*")
        .eq("curso_id", courseId)
        .eq("fecha", todayIso);

      if (atErr) throw atErr;

      const attendanceMap = new Map<string, any>();
      (attendanceData || []).forEach((att: any) => {
        attendanceMap.set(att.estudiante_id, att);
      });

      const selectedCourse = courses.find((c) => c.id === courseId);
      const rows: StudentRowState[] = (studentsData || []).map((st: any) => {
        const existingAtt = attendanceMap.get(st.id);
        return {
          id: st.id,
          cedula: st.cedula,
          nombres: st.nombres,
          apellidos: st.apellidos,
          nombres_completos: `${st.apellidos} ${st.nombres}`,
          codigo_qr: st.codigo_qr || `PICH-${st.cedula}`,
          curso_id: st.curso_id,
          curso_nombre: selectedCourse?.nombre || "Curso Asignado",
          asistencia_id: existingAtt ? existingAtt.id : undefined,
          estado: existingAtt ? (existingAtt.estado as EstadoAsistencia) : "AUSENTE",
          metodo: existingAtt ? (existingAtt.metodo as MetodoAsistencia) : "MANUAL",
          hora: existingAtt?.hora ? String(existingAtt.hora).slice(0, 8) : null,
          dispositivo: existingAtt?.dispositivo_origen || "Web",
        };
      });

      setStudentsState(rows);
    } catch (err: any) {
      console.error("Error al cargar asistencias:", err);
      triggerToast("Error al sincronizar asistencias: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchAttendanceData(selectedCourseId);
    }
  }, [selectedCourseId, courses, todayIso]);

  // 3. Suscripción a Supabase Realtime para la tabla 'asistencias'
  useEffect(() => {
    if (!selectedCourseId) return;

    const channel = supabase
      .channel(`asistencias-live-${selectedCourseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "asistencias",
        },
        (payload: any) => {
          const newOrUpdated = payload.new;
          if (!newOrUpdated) return;

          // Verificar si corresponde a la fecha de hoy
          if (newOrUpdated.fecha === todayIso) {
            setStudentsState((prev) =>
              prev.map((student) => {
                if (student.id === newOrUpdated.estudiante_id) {
                  return {
                    ...student,
                    asistencia_id: newOrUpdated.id,
                    estado: newOrUpdated.estado as EstadoAsistencia,
                    metodo: newOrUpdated.metodo as MetodoAsistencia,
                    hora: newOrUpdated.hora ? String(newOrUpdated.hora).slice(0, 8) : null,
                    dispositivo: newOrUpdated.dispositivo_origen || "App Android",
                    recienActualizado: true,
                  };
                }
                return student;
              })
            );

            const source = newOrUpdated.dispositivo_origen?.includes("com.jcumbajin")
              ? "App Android"
              : "Dispositivo";

            const msg = `Escaneo QR detectado en tiempo real desde ${source} (${newOrUpdated.estado})`;
            setLastRealtimeEvent(msg);
            triggerToast(msg);

            // Quitar el pulso visual despues de 3 segundos
            setTimeout(() => {
              setStudentsState((prev) =>
                prev.map((s) => (s.id === newOrUpdated.estudiante_id ? { ...s, recienActualizado: false } : s))
              );
            }, 3000);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCourseId, todayIso]);

  // Generador QR de sesión para proyectar en aula
  const generateQRCode = async () => {
    const courseObj = courses.find((c) => c.id === selectedCourseId);
    const uniqueSessionId = `LLOA-${(courseObj?.nombre || "CURSO").replace(/[^a-zA-Z0-9]/g, "")}-${Math.floor(100000 + Math.random() * 900000)}`;
    setSessionToken(uniqueSessionId);
    setTimeLeft(60);
    setIsExpired(false);
    setQrActive(true);

    const payload = JSON.stringify({
      institucion: "Escuela de Educacion Basica Pichincha",
      amie: "17H01429",
      parroquia: "Lloa",
      curso_id: selectedCourseId,
      curso: courseObj?.nombre || "5.º EGB",
      sesionId: uniqueSessionId,
      fecha: todayIso,
      validoHastaSegundos: 60,
    });

    try {
      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#1E3A8A",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Error al generar codigo QR institucional:", err);
    }
  };

  useEffect(() => {
    if (qrActive && !isExpired) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrActive, isExpired, sessionToken]);

  // Marcar estado de asistencia manualmente desde la web y guardar en Supabase
  const handleUpdateStudentStatus = async (
    studentId: string,
    nuevoEstado: EstadoAsistencia
  ) => {
    const currentTime = new Date().toTimeString().slice(0, 8);
    const targetStudent = studentsState.find((s) => s.id === studentId);
    if (!targetStudent) return;

    // Actualización optimista local
    setStudentsState((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              estado: nuevoEstado,
              metodo: "MANUAL",
              hora: nuevoEstado === "AUSENTE" ? null : currentTime,
              dispositivo: "Web Administrativa",
            }
          : s
      )
    );

    try {
      const payload: any = {
        estudiante_id: studentId,
        curso_id: selectedCourseId,
        fecha: todayIso,
        hora: currentTime,
        estado: nuevoEstado,
        metodo: "MANUAL",
        dispositivo_origen: "Web Administrativa",
      };

      const { error } = await (supabase.from("asistencias") as any).upsert([payload], {
        onConflict: "estudiante_id,fecha,curso_id",
      });

      if (error) throw error;
      triggerToast(`Asistencia de ${targetStudent.apellidos.split(" ")[0]} marcada como ${nuevoEstado}`);
    } catch (err: any) {
      console.error("Error al registrar asistencia:", err);
      triggerToast("Error al guardar en base de datos: " + err.message);
      // Revertir
      fetchAttendanceData(selectedCourseId);
    }
  };

  // Marcar a todos como Presentes (asistencia rápida de aula)
  const handleMarkAllPresent = async () => {
    if (studentsState.length === 0) return;
    setIsSaving(true);
    const currentTime = new Date().toTimeString().slice(0, 8);

    try {
      const records = studentsState.map((st) => ({
        estudiante_id: st.id,
        curso_id: selectedCourseId,
        fecha: todayIso,
        hora: currentTime,
        estado: "PRESENTE",
        metodo: "MANUAL",
        dispositivo_origen: "Web Directora",
      }));

      const { error } = await (supabase.from("asistencias") as any).upsert(records, {
        onConflict: "estudiante_id,fecha,curso_id",
      });

      if (error) throw error;
      triggerToast("Todos los estudiantes del curso han sido marcados como Presentes");
      await fetchAttendanceData(selectedCourseId);
    } catch (err: any) {
      console.error("Error en asistencia masiva:", err);
      triggerToast("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Métricas
  const total = studentsState.length;
  const presentes = studentsState.filter((s) => s.estado === "PRESENTE").length;
  const atrasos = studentsState.filter((s) => s.estado === "ATRASO").length;
  const ausentes = studentsState.filter((s) => s.estado === "AUSENTE").length;
  const qrCount = studentsState.filter((s) => s.metodo === "QR" && s.estado !== "AUSENTE").length;
  const tasaAsistencia = total > 0 ? Math.round(((presentes + atrasos) / total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Toast de Alerta */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera y Navegación */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/dashboard/teacher"
              className="hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Panel Docente</span>
            </Link>
            <span>/</span>
            <span className="text-blue-800 font-bold">Asistencia Híbrida Realtime</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Monitor de Asistencia en Tiempo Real
                </h1>
                {realtimeActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Realtime Conectado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    <Wifi className="w-3 h-3 text-slate-400" />
                    <span>Conectando...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">
                Escuela de Educacion Basica &quot;Pichincha&quot; • {todayFormatted}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleMarkAllPresent}
            disabled={isSaving || total === 0}
            className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Marcar Todos Presentes</span>
          </button>

          <button
            onClick={() => fetchAttendanceData(selectedCourseId)}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors"
            title="Refrescar nómina"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selector de Curso y Banner de Sincronizacion Movil */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-blue-700 shrink-0" />
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Seleccionar Grado / Curso:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 min-w-[220px]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Orden {c.orden})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs">
          <Smartphone className="w-5 h-5 text-blue-700 shrink-0" />
          <div>
            <span className="font-bold text-blue-950 block">
              Sincronización Bidireccional con App Android
            </span>
            <span className="text-[11px] text-blue-700">
              Escaneos desde <code className="font-mono font-bold">com.jcumbajin.sgapichincha</code> se reflejan al instante.
            </span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de Asistencia Diaria */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Matriculados
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{total}</span>
          <span className="text-[10px] text-slate-400">Total en curso</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Presentes
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{presentes}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">{tasaAsistencia}% asistencia</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Atrasos
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{atrasos}</span>
          <span className="text-[10px] text-slate-400">Llegadas tarde</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
            Ausentes
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{ausentes}</span>
          <span className="text-[10px] text-rose-500 font-semibold">Pendientes</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Escaneos QR
          </span>
          <span className="text-2xl font-black text-blue-800 mt-1 block">{qrCount}</span>
          <span className="text-[10px] text-blue-600 font-semibold">App Móvil</span>
        </div>
      </div>

      {/* Proyector de Código QR Dinámico en Pantalla de Aula */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Proyector de Aula • Código de Sesión Dinámico</span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">
            Generar Código QR de Aula para Proyección
          </h2>
          <p className="text-xs text-blue-200/90 max-w-xl">
            Proyecta este código en la pantalla del aula para que los estudiantes o el inspector escaneen con la app móvil y registren su ingreso con validez temporal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateQRCode}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <QrCode className="w-4 h-4 text-slate-900" />
            <span>{qrActive ? "Regenerar Código" : "Proyectar QR de Aula"}</span>
          </button>
        </div>
      </div>

      {/* Modal / Despliegue de Código QR Activo */}
      {qrActive && (
        <div className="p-6 bg-white rounded-2xl border-2 border-blue-600 shadow-xl flex flex-col items-center text-center animate-fade-in max-w-md mx-auto">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
            Código QR Institucional Dinámico
          </span>
          <div className="p-3 bg-white rounded-xl shadow-md border my-3">
            {qrDataUrl && <img src={qrDataUrl} alt="QR Sesion" className="w-56 h-56 object-contain" />}
          </div>
          <div className="text-xs font-mono font-bold text-slate-700 mb-1">
            Sesión: {sessionToken}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <Clock className="w-4 h-4" />
            <span>Expira en {timeLeft} segundos</span>
          </div>
        </div>
      )}

      {/* Tabla de Asistencia en Vivo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Nómina Diaria de Asistencia
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {studentsState.length} alumnos
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Fecha activa: {todayIso}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-700 mb-2" />
            <p className="text-xs">Sincronizando nómina desde Supabase...</p>
          </div>
        ) : studentsState.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No hay estudiantes en este curso</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Código QR (Android)</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4 text-right">Acción Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {studentsState.map((st, idx) => (
                  <tr
                    key={st.id}
                    className={`transition-all ${
                      st.recienActualizado
                        ? "bg-emerald-50 ring-2 ring-emerald-400 font-bold"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                      {st.apellidos} {st.nombres}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{st.cedula}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-blue-800 font-bold">
                      {st.codigo_qr}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                          st.estado === "PRESENTE"
                            ? "bg-emerald-100 text-emerald-800"
                            : st.estado === "ATRASO"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.estado === "PRESENTE"
                              ? "bg-emerald-600"
                              : st.estado === "ATRASO"
                              ? "bg-amber-600"
                              : "bg-rose-600"
                          }`}
                        />
                        {st.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-slate-600">
                        {st.metodo === "QR" ? (
                          <span className="text-blue-700 font-bold flex items-center gap-1">
                            <QrCode className="w-3 h-3" /> QR Móvil
                          </span>
                        ) : (
                          "Manual"
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {st.hora || "—"}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-slate-500 font-medium">
                      {st.dispositivo}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleUpdateStudentStatus(st.id, "PRESENTE")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            st.estado === "PRESENTE"
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800"
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => handleUpdateStudentStatus(st.id, "ATRASO")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            st.estado === "ATRASO"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800"
                          }`}
                        >
                          Atraso
                        </button>
                        <button
                          onClick={() => handleUpdateStudentStatus(st.id, "AUSENTE")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            st.estado === "AUSENTE"
                              ? "bg-rose-700 text-white"
                              : "bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-800"
                          }`}
                        >
                          Ausente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
