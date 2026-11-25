"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Camera,
  CheckCircle2,
  QrCode,
  Scan,
  KeyRound,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface QRScannerSimulatorProps {
  onAttendanceRecorded?: () => void;
}

export function QRScannerSimulator({ onAttendanceRecorded }: QRScannerSimulatorProps) {
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    studentName: string;
    courseName: string;
    code: string;
    timestamp: string;
    status: string;
    alreadyRegistered?: boolean;
  } | null>(null);

  const registerAttendanceByCode = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    setScanning(true);
    setErrorMsg(null);
    setSuccessData(null);

    try {
      const cedulaOnly = clean.replace(/^PICH-/i, "");
      const { data: student, error: findErr } = await supabase
        .from("estudiantes")
        .select("id, cedula, nombres, apellidos, nombres_completos, codigo_qr, curso_id, curso:cursos(nombre)")
        .or(`codigo_qr.eq.${clean},cedula.eq.${cedulaOnly}`)
        .limit(1)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!student) {
        setErrorMsg(`No se encontró ningún estudiante con el código o cédula "${clean}".`);
        setScanning(false);
        return;
      }

      const st = student as any;
      const todayIso = new Date().toISOString().slice(0, 10);
      const nowTime = new Date().toTimeString().slice(0, 8);

      const { data: existing } = await supabase
        .from("asistencias")
        .select("id, estado, hora")
        .eq("estudiante_id", st.id)
        .eq("curso_id", st.curso_id)
        .eq("fecha", todayIso)
        .maybeSingle();

      if (existing) {
        setSuccessData({
          studentName: st.nombres_completos || `${st.nombres} ${st.apellidos}`,
          courseName: st.curso?.nombre || "Curso asignado",
          code: st.codigo_qr || `PICH-${st.cedula}`,
          timestamp: String((existing as any).hora || nowTime).slice(0, 5),
          status: `Ya registrado hoy (${(existing as any).estado}) — Sin duplicado`,
          alreadyRegistered: true,
        });
        setScanning(false);
        return;
      }

      const { error: insertErr } = await (supabase.from("asistencias") as any).insert({
        estudiante_id: st.id,
        curso_id: st.curso_id,
        fecha: todayIso,
        hora: nowTime,
        estado: "PRESENTE",
        metodo: "QR",
        codigo_qr_escaneado: st.codigo_qr || `PICH-${st.cedula}`,
        dispositivo_origen: "Web-QR-Scanner",
      });

      if (insertErr) throw insertErr;

      setSuccessData({
        studentName: st.nombres_completos || `${st.nombres} ${st.apellidos}`,
        courseName: st.curso?.nombre || "Curso asignado",
        code: st.codigo_qr || `PICH-${st.cedula}`,
        timestamp: nowTime.slice(0, 5),
        status: "PRESENTE • Registrado vía QR en Supabase",
      });
      setQrInput("");
      if (onAttendanceRecorded) onAttendanceRecorded();
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al registrar asistencia por QR.");
    } finally {
      setScanning(false);
    }
  };

  const simulateRandomScan = async () => {
    setScanning(true);
    setErrorMsg(null);
    try {
      const { data } = await supabase
        .from("estudiantes")
        .select("codigo_qr")
        .eq("activo", true)
        .limit(10);

      const list = (data || []) as { codigo_qr: string }[];
      if (list.length === 0) {
        setErrorMsg("No hay estudiantes registrados en Supabase para escanear.");
        setScanning(false);
        return;
      }
      const randomStudent = list[Math.floor(Math.random() * list.length)];
      await registerAttendanceByCode(randomStudent.codigo_qr);
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al consultar estudiantes.");
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerAttendanceByCode(qrInput);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Escáner QR de Carnet Estudiantil
            </h3>
            <p className="text-xs text-slate-500">
              Lea o ingrese el código PICH-&lt;cédula&gt; para registrar asistencia diaria sin duplicados
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Conectado a Supabase
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!successData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[220px] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              {scanning ? (
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              ) : (
                <Camera className="w-10 h-10 text-slate-400" />
              )}
              <div className="absolute bottom-3 text-[10px] font-bold text-slate-500 font-mono">
                {scanning ? "Validando en Supabase..." : "Lector QR listo"}
              </div>
            </div>

            <button
              onClick={simulateRandomScan}
              disabled={scanning}
              className="mt-3.5 w-full max-w-[220px] py-2.5 rounded-xl font-bold text-xs text-white bg-blue-700 hover:bg-blue-800 shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Probar Escaneo de Carnet</span>
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Ingreso Directo de Código QR o Cédula
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Escanee con lector USB o escriba el código del carnet estudiantil (ej. PICH-1726458910) para marcar su ingreso.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Ej. PICH-1726458910"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-center tracking-wider text-sm font-bold text-slate-800 focus:border-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!qrInput.trim() || scanning}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                Registrar PRESENTE por QR
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div
          className={`p-5 rounded-2xl border text-center space-y-3 animate-fadeIn ${
            successData.alreadyRegistered
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm ${
              successData.alreadyRegistered
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                successData.alreadyRegistered ? "text-amber-800" : "text-emerald-800"
              }`}
            >
              {successData.alreadyRegistered
                ? "Registro Previo Detectado"
                : "¡Asistencia Registrada Exitosamente!"}
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              {successData.studentName}
            </h4>
            <p className="text-xs text-slate-600 font-semibold">{successData.courseName}</p>
          </div>

          <div className="max-w-xs mx-auto p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Carnet QR:</span>
              <span className="font-bold font-mono">{successData.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hora de ingreso:</span>
              <span className="font-bold font-mono">{successData.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado:</span>
              <span
                className={`font-bold ${
                  successData.alreadyRegistered ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {successData.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => setSuccessData(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Escanear siguiente estudiante</span>
          </button>
        </div>
      )}
    </div>
  );
}
