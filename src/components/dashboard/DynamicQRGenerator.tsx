"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Radio,
  Calendar,
  AlertTriangle,
  UserCheck,
  XCircle,
} from "lucide-react";

interface DynamicQRGeneratorProps {
  classNameTitle: string;
  classCode: string;
}

export function DynamicQRGenerator({ classNameTitle, classCode }: DynamicQRGeneratorProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [token, setToken] = useState<string>("5291");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeDate, setActiveDate] = useState<string>("");

  // Attendance states for the classroom
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, name: "Mateo Toapanta", state: "presente", time: "07:15 AM" },
    { id: 2, name: "Doménica Chiluisa", state: "presente", time: "07:12 AM" },
    { id: 3, name: "Jostyn Quishpe", state: "atraso", time: "07:32 AM" },
    { id: 4, name: "Camila Pillajo", state: "falta", time: "Sin registro" },
    { id: 5, name: "Kevin Criollo", state: "presente", time: "07:18 AM" },
    { id: 6, name: "Dayana Tipán", state: "presente", time: "07:20 AM" },
    { id: 7, name: "Brayan Sangucho", state: "presente", time: "07:14 AM" },
    { id: 8, name: "Evelyn Cuichán", state: "falta", time: "Sin registro" },
  ]);

  const generateQRCode = async () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setToken(randomPin);

    const payload = JSON.stringify({
      institucion: "Escuela Pichincha - Lloa",
      aula: classCode,
      fecha: new Date().toISOString().slice(0, 10),
      pin: randomPin,
      validez: "Jornada Matutina 2026",
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStatus = (id: number) => {
    setAttendanceList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState =
            item.state === "presente"
              ? "atraso"
              : item.state === "atraso"
              ? "falta"
              : "presente";
          return { ...item, state: nextState };
        }
        return item;
      })
    );
  };

  const presentesCount = attendanceList.filter((a) => a.state === "presente").length;
  const atrasosCount = attendanceList.filter((a) => a.state === "atraso").length;
  const faltasCount = attendanceList.filter((a) => a.state === "falta").length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      
      {/* Header */}
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

      {/* Main Grid: QR Container & Attendance List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* QR Card Container */}
        <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
          <span className="text-xs font-bold text-slate-700 mb-1">
            Código QR de Asistencia Diaria
          </span>
          <p className="text-[11px] text-slate-500 mb-4 max-w-xs">
            Proyecte este código en el aula o escanee con la tablet docente para registrar la presencia de los estudiantes al ingresar.
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

          {/* Backup PIN */}
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

        {/* Student Attendance Quick Tally & List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Counters bar */}
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

          {/* Quick List */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3">
              <span>Registro de Asistencia del Aula (Clic para cambiar estado):</span>
              <span className="text-slate-500 font-normal">{attendanceList.length} Alumnos en nómina</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
                      st.state === "presente"
                        ? "bg-emerald-100 text-emerald-800"
                        : st.state === "atraso"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {st.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 p-2 bg-blue-50/60 rounded-xl border border-blue-100">
            <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>
              Las faltas injustificadas se reportan automáticamente al informe de Inspección y al DECE al cierre de la primera hora de clase (07:45 AM).
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
