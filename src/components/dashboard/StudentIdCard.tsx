"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Estudiante, Curso, PerfilUsuario } from "@/types/database.types";
import { Download, Printer, X, School, ShieldCheck } from "lucide-react";

interface StudentCardData {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  nombres_completos?: string;
  codigo_qr: string;
  curso_nombre?: string;
  tutor_nombre?: string;
}

interface StudentIdCardModalProps {
  student: StudentCardData | null;
  onClose: () => void;
}

export function StudentIdCardModal({ student, onClose }: StudentIdCardModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!student) return;
    const qrData = student.codigo_qr || `PICH-${student.cedula}`;
    QRCode.toDataURL(qrData, {
      width: 360,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error("Error generando QR:", err));
  }, [student]);

  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.download = `Carnet_${student.cedula}_${student.apellidos.replace(/\s+/g, "_")}.png`;
    link.href = qrUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:bg-white print:p-0 print:static">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none">
        {/* Cabecera del modal (oculta en impresion) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-800">
              Carnet Estudiantil Digital
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Carnet */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={cardRef}
            className="w-full max-w-[340px] bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white rounded-2xl shadow-lg overflow-hidden border border-blue-700/50 relative"
          >
            {/* Encabezado Institucional */}
            <div className="px-4 pt-4 pb-3 text-center border-b border-blue-700/40 bg-blue-950/40">
              <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-semibold mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>MINISTERIO DE EDUCACION</span>
              </div>
              <h4 className="text-xs font-black tracking-wider uppercase text-white">
                Escuela de Educacion Basica
              </h4>
              <h2 className="text-sm font-extrabold tracking-tight text-amber-300 uppercase">
                &ldquo;Pichincha&rdquo;
              </h2>
              <p className="text-[9px] text-blue-200/90 font-medium">
                Parroquia Rural Lloa • AMIE 17H01429
              </p>
            </div>

            {/* Area de Informacion del Estudiante */}
            <div className="p-4 flex flex-col items-center bg-white text-slate-800">
              {/* QR Container */}
              <div className="p-2 bg-white rounded-xl shadow-md border-2 border-slate-200 mb-3">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Estudiante ${student.cedula}`}
                    className="w-40 h-40 object-contain rounded"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium">
                    Generando QR...
                  </div>
                )}
              </div>

              {/* Codigo QR Texto compatible con App Android */}
              <div className="mb-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-700 tracking-wider">
                {student.codigo_qr || `PICH-${student.cedula}`}
              </div>

              {/* Datos del Estudiante */}
              <div className="w-full text-center space-y-1">
                <div className="text-sm font-extrabold text-slate-900 leading-tight uppercase">
                  {student.apellidos} {student.nombres}
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  C.I.: <span className="font-mono text-slate-900">{student.cedula}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-left text-[10px]">
                  <div>
                    <span className="text-slate-400 font-medium block">Grado / Curso:</span>
                    <span className="font-bold text-blue-800 block truncate">
                      {student.curso_nombre || "Sin Asignar"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Tutor(a):</span>
                    <span className="font-bold text-slate-700 block truncate">
                      {student.tutor_nombre || "Docente Titular"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del carnet */}
            <div className="px-4 py-2 bg-slate-900 text-center border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
              <span>Periodo 2026 - 2027</span>
              <span className="font-semibold text-amber-400">Lloa - Quito</span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 text-center print:hidden">
            Escanea este codigo con la aplicacion movil Android para registrar asistencia en tiempo real.
          </p>
        </div>

        {/* Acciones (ocultas en impresion) */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Descargar QR
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            Imprimir Carnet
          </button>
        </div>
      </div>
    </div>
  );
}

interface BatchCarnetPrintViewProps {
  students: StudentCardData[];
  cursoNombre: string;
  onClose: () => void;
}

export function BatchCarnetPrintView({ students, cursoNombre, onClose }: BatchCarnetPrintViewProps) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function generateAll() {
      const map: Record<string, string> = {};
      for (const st of students) {
        const payload = st.codigo_qr || `PICH-${st.cedula}`;
        try {
          map[st.id] = await QRCode.toDataURL(payload, {
            width: 280,
            margin: 1,
            color: { dark: "#0f172a", light: "#ffffff" },
          });
        } catch (e) {
          console.error(e);
        }
      }
      setQrMap(map);
    }
    if (students.length > 0) {
      generateAll();
    }
  }, [students]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 print:p-0 print:bg-white print:static">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl p-6 shadow-2xl print:shadow-none print:p-0">
        {/* Barra de control para impresion */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Impresion Masiva de Carnets: {cursoNombre}
            </h2>
            <p className="text-xs text-slate-500">
              Total estudiantes listos para impresion: {students.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Todos (PDF)
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
        </div>

        {/* Grilla de carnets para hoja A4 / Carta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
          {students.map((st) => (
            <div
              key={st.id}
              className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col justify-between print:break-inside-avoid print:border-slate-400"
            >
              <div className="bg-blue-900 text-white px-3 py-2 text-center">
                <div className="text-[8px] font-semibold text-blue-200 uppercase tracking-widest">
                  Escuela Basica Pichincha • Lloa
                </div>
                <div className="text-[10px] font-black text-amber-300 uppercase">
                  Carnet Estudiantil 2026 - 2027
                </div>
              </div>

              <div className="p-3 flex items-center gap-3">
                <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded p-1 flex-shrink-0 flex items-center justify-center">
                  {qrMap[st.id] ? (
                    <img src={qrMap[st.id]} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-slate-400">QR</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-extrabold text-slate-900 uppercase leading-snug line-clamp-2">
                    {st.apellidos} {st.nombres}
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                    CI: <span className="font-mono text-slate-900">{st.cedula}</span>
                  </div>
                  <div className="text-[9px] text-blue-700 font-bold mt-0.5 truncate">
                    {st.curso_nombre || cursoNombre}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-1">
                    {st.codigo_qr || `PICH-${st.cedula}`}
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 px-3 py-1 text-[8px] text-slate-500 flex justify-between border-t border-slate-200">
                <span>AMIE: 17H01429</span>
                <span>Distrito 17D01</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
