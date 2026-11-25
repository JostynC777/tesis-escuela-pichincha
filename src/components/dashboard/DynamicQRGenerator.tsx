"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import {
  QrCode,
  RefreshCw,
  Clock,
  Users,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

interface DynamicQRGeneratorProps {
  courseId?: string;
  classNameTitle: string;
  classCode: string;
}

interface AttendanceStudentItem {
  id: string;
  name: string;
  codigoQr: string;
  state: "PRESENTE" | "ATRASO" | "AUSENTE" | "JUSTIFICADO";
  time: string;
}

export function DynamicQRGenerator({
  courseId,
  classNameTitle,
  classCode,
}: DynamicQRGeneratorProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [token, setToken] = useState<string>("5291");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeDate, setActiveDate] = useState<string>("");
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceStudentItem[]>([]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const generateQRCode = async () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setToken(randomPin);

    const payload = JSON.stringify({
      institucion: "Escuela Pichincha - Lloa",
      aula: classCode,
      curso_id: courseId || "",
      fecha: todayIso,
      pin: randomPin,
      validez: "Jornada Matutina",
    });

    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 240,
        margin: 1,
        color: {
          dark: "#1E3A8A",
          light: "#FFFFFF",
        },
      });
      setQrUrl(dataUrl);
    } catch (err) {
      console.error("QR Generation error", err);
    }
  };

  const loadCourseAttendance = useCallback(async () => {
    if (!courseId) {
      setAttendanceList([]);
      return;
    }
    setLoadingList(true);
    try {
      const [{ data: studentsData }, { data: attData }] = await Promise.all([
        supabase
          .from("estudiantes")
          .select("id, nombres, apellidos, nombres_completos, codigo_qr, cedula")
          .eq("curso_id", courseId)
          .eq("activo", true)
          .order("apellidos"),
        supabase
          .from("asistencias")
          .select("estudiante_id, estado, hora")
          .eq("curso_id", courseId)
          .eq("fecha", todayIso),
      ]);

      const attMap = new Map<string, { estado: string; hora: string }>();
      (attData || []).forEach((a: any) => {
        attMap.set(a.estudiante_id, {
          estado: a.estado,
          hora: a.hora ? String(a.hora).slice(0, 5) : "--:--",
        });
      });

      const items: AttendanceStudentItem[] = (studentsData || []).map((st: any) => {
        const existing = attMap.get(st.id);
        return {
          id: st.id,
          name: st.nombres_completos || `${st.apellidos} ${st.nombres}`,
          codigoQr: st.codigo_qr || `PICH-${st.cedula}`,
          state: (existing?.estado as AttendanceStudentItem["state"]) || "AUSENTE",
          time: existing?.hora || "Sin registro",
        };
      });

      setAttendanceList(items);
    } catch (err) {
      console.error("Error loading attendance list:", err);
    } finally {
      setLoadingList(false);
    }
  }, [courseId, todayIso]);

  useEffect(() => {
    setActiveDate(
      new Date().toLocaleDateString("es-EC", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    generateQRCode();
  }, [classCode]);

  useEffect(() => {
    loadCourseAttendance();
  }, [loadCourseAttendance]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStatus = async (studentId: string) => {
    if (!courseId) return;
    const current = attendanceList.find((i) => i.id === studentId);
    if (!current) return;

    const nextState: AttendanceStudentItem["state"] =
      current.state === "PRESENTE"
        ? "ATRASO"
        : current.state === "ATRASO"
        ? "AUSENTE"
        : "PRESENTE";

    const nowTime = new Date().toTimeString().slice(0, 8);
    setSavingId(studentId);

    setAttendanceList((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? { ...item, state: nextState, time: nowTime.slice(0, 5) }
          : item
      )
    );

    try {
      await (supabase.from("asistencias") as any).upsert(
        {
          estudiante_id: studentId,
          curso_id: courseId,
          fecha: todayIso,
          hora: nowTime,
          estado: nextState,
          metodo: "MANUAL",
          dispositivo_origen: "Web-Docente-Rapido",
        },
        { onConflict: "estudiante_id,fecha,curso_id" }
      );
    } catch (err) {
      console.error("Error updating attendance:", err);
    } finally {
      setSavingId(null);
    }
  };

  const presentesCount = attendanceList.filter((a) => a.state === "PRESENTE").length;
  const atrasosCount = attendanceList.filter((a) => a.state === "ATRASO").length;
  const faltasCount = attendanceList.filter((a) => a.state === "AUSENTE").length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-blue-100 text-blue-700">
              <QrCode className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Asistencia Escolar Rápida
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Jornada Matutina Activa
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {classNameTitle} ({classCode})
          </h3>
          <p className="text-xs text-slate-500 capitalize">{activeDate}</p>
        </div>

        <button
          onClick={generateQRCode}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
          <span>Regenerar Código</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-700 mb-1">
            Código QR de Asistencia Diaria
          </span>
          <p className="text-[11px] text-slate-500 mb-4 max-w-xs">
            Proyecte este código en el aula o escanee con la app móvil para registrar la presencia de los estudiantes al ingresar.
          </p>

          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-4">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Código QR Asistencia Escuela Pichincha"
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
            <div className="text-left">
              <span className="text-[11px] text-slate-500 block">Código PIN Manual del Aula:</span>
              <span className="font-mono text-xl font-black text-blue-800 tracking-wider">
                {token}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Presentes</span>
              <span className="text-2xl font-black text-emerald-700">{presentesCount}</span>
              <span className="text-[10px] text-emerald-600 block">A tiempo</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Atrasos</span>
              <span className="text-2xl font-black text-amber-700">{atrasosCount}</span>
              <span className="text-[10px] text-amber-600 block">Registrados</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Faltas</span>
              <span className="text-2xl font-black text-rose-700">{faltasCount}</span>
              <span className="text-[10px] text-rose-600 block">Alerta DECE</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
              <span>Registro de Asistencia del Aula (Clic para cambiar estado):</span>
              <span className="text-slate-500 font-normal">{attendanceList.length} Alumnos en nómina</span>
            </div>

            {loadingList ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Sincronizando nómina de asistencia...</span>
              </div>
            ) : attendanceList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-64 overflow-y-auto pr-1">
                {attendanceList.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleStatus(st.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 cursor-pointer shadow-sm transition-all"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-800 block truncate">{st.name}</span>
                      <span className="text-[10px] text-slate-400">{st.time}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        savingId === st.id
                          ? "bg-blue-100 text-blue-700"
                          : st.state === "PRESENTE"
                          ? "bg-emerald-100 text-emerald-800"
                          : st.state === "ATRASO"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {st.state}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  No hay estudiantes matriculados en este curso
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agregue estudiantes desde Gestión de Estudiantes para registrar asistencia.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-100">
            <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Los cambios de estado se guardan directamente en Supabase para el día {todayIso}.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
