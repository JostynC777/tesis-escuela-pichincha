"use client";

import React, { useState } from "react";
import {
  Camera,
  CheckCircle2,
  QrCode,
  Scan,
  KeyRound,
  RotateCcw,
  Clock,
  ShieldCheck,
  School,
} from "lucide-react";

export function QRScannerSimulator() {
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);
  const [successData, setSuccessData] = useState<{
    subject: string;
    code: string;
    timestamp: string;
    status: string;
  } | null>(null);

  const simulateScan = () => {
    setScanning(true);
    setSuccessData(null);

    setTimeout(() => {
      setScanning(false);
      setSuccessData({
        subject: "5to Grado de Educación General Básica 'A'",
        code: "ESC-PICHINCHA-LLOA-ASIST",
        timestamp: new Date().toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Presente a Tiempo • Jornada Matutina",
      });
    }, 1200);
  };

  const handleManualPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setSuccessData({
        subject: "5to Grado de Educación General Básica 'A'",
        code: `PIN-AULA-${pin}-VALIDADO`,
        timestamp: new Date().toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Asistencia Confirmada por PIN Docente",
      });
      setPin("");
    }, 800);
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
              Escáner de Asistencia Escolar Diaria
            </h3>
            <p className="text-xs text-slate-500">
              Escanee el código QR proyectado en el aula al inicio de la jornada escolar
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Escuela Pichincha • Lloa
        </span>
      </div>

      {!successData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          
          {/* Scanner Box */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[220px] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
              <Camera className={`w-10 h-10 ${scanning ? "text-blue-600 animate-pulse" : "text-slate-400"}`} />
              <div className="absolute bottom-3 text-[10px] font-bold text-slate-500 font-mono">
                {scanning ? "Detectando QR..." : "Cámara del aula lista"}
              </div>
            </div>

            <button
              onClick={simulateScan}
              disabled={scanning}
              className="mt-3.5 w-full max-w-[220px] py-2.5 rounded-xl font-bold text-xs text-white bg-blue-700 hover:bg-blue-800 shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Simular Escaneo de QR</span>
            </button>
          </div>

          {/* PIN Manual Input */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Registro con PIN Numérico del Aula
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Si la cámara no enfoca el proyector, ingrese el PIN de 4 dígitos proporcionado por la maestra tutora en la pizarra.
            </p>

            <form onSubmit={handleManualPin} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN del aula (ej. 5291)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-center tracking-widest text-sm font-bold text-slate-800 focus:border-blue-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!pin.trim() || scanning}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-all disabled:opacity-50"
              >
                Confirmar Asistencia con PIN
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              ¡Asistencia Registrada Exitosamente!
            </span>
            <h4 className="text-base font-black text-slate-900 mt-0.5">
              {successData.subject}
            </h4>
          </div>

          <div className="max-w-xs mx-auto p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Hora de ingreso:</span>
              <span className="font-bold font-mono">{successData.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado:</span>
              <span className="font-bold text-emerald-700">{successData.status}</span>
            </div>
          </div>

          <button
            onClick={() => setSuccessData(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Volver a escanear</span>
          </button>
        </div>
      )}

    </div>
  );
}
