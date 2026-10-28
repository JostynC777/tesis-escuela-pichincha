"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  School,
  UserCheck,
  RotateCcw,
  LogIn,
  ArrowRight,
  FileCheck,
} from "lucide-react";

interface VerificationStudent {
  cedula: string;
  name: string;
  grade: string;
  parallel: string;
  tutor: string;
  status: string;
  colacionEscolar: string;
}

const MOCK_REGISTER: Record<string, VerificationStudent> = {
  "1724893012": {
    cedula: "1724893012",
    name: "Toapanta Pillajo Mateo Sebastián",
    grade: "5to Grado de Educación General Básica",
    parallel: "Paralelo A - Jornada Matutina",
    tutor: "Lic. María Elena Guamán",
    status: "Matrícula Ordinaria Activa (2026 - 2027)",
    colacionEscolar: "Asignado y Entregado",
  },
  "1719823410": {
    cedula: "1719823410",
    name: "Chiluisa Morales Doménica Estefanía",
    grade: "5to Grado de Educación General Básica",
    parallel: "Paralelo A - Jornada Matutina",
    tutor: "Lic. María Elena Guamán",
    status: "Matrícula Ordinaria Activa (2026 - 2027)",
    colacionEscolar: "Asignado y Entregado",
  },
  "1729014523": {
    cedula: "1729014523",
    name: "Quishpe Guamán Jostyn Alexander",
    grade: "5to Grado de Educación General Básica",
    parallel: "Paralelo A - Jornada Matutina",
    tutor: "Lic. María Elena Guamán",
    status: "Matrícula Ordinaria Activa con Refuerzo DECE",
    colacionEscolar: "Asignado y Entregado",
  },
};

export function CertificateValidator() {
  const [cedulaInput, setCedulaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationStudent | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cedulaInput.trim();
    if (!clean) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    setTimeout(() => {
      const match = MOCK_REGISTER[clean];
      if (match) {
        setResult(match);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }, 600);
  };

  const handleQuickTest = (ced: string) => {
    setCedulaInput(ced);
    setLoading(true);
    setNotFound(false);
    setResult(null);

    setTimeout(() => {
      setResult(MOCK_REGISTER[ced]);
      setLoading(false);
    }, 400);
  };

  return (
    <section id="institucion" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Servicio a la Comunidad Educativa de Lloa</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Consulta de Matrícula Escolar
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Los padres de familia pueden verificar el estado de matrícula de su representado con el número de cédula de identidad.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cedulaInput}
                onChange={(e) => setCedulaInput(e.target.value)}
                placeholder="Ingrese número de cédula del estudiante (ej. 1724893012)"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-sm font-mono focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !cedulaInput.trim()}
              className="px-7 py-3.5 rounded-2xl font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Consultando..." : "Consultar Matrícula"}
            </button>
          </form>

          {/* Quick-test buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Cédulas de prueba:</span>
            <button
              type="button"
              onClick={() => handleQuickTest("1724893012")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 font-medium"
            >
              1724893012 (Mateo Toapanta)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest("1719823410")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 font-medium"
            >
              1719823410 (Doménica Chiluisa)
            </button>
            <button
              type="button"
              onClick={() => handleQuickTest("1729014523")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 font-medium"
            >
              1729014523 (Jostyn Quishpe)
            </button>
          </div>
        </div>

        {/* Verification result display */}
        {result && (
          <div className="mt-6 bg-white p-6 sm:p-7 rounded-3xl border border-blue-200 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {result.status}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {result.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setResult(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Grado y Sección:</span>
                <span className="font-bold text-slate-800">{result.grade} • {result.parallel}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Docente Tutor / Maestra:</span>
                <span className="font-bold text-slate-800">{result.tutor}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Cédula del Estudiante:</span>
                <span className="font-mono font-bold text-slate-800">{result.cedula}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Colación Escolar MinEduc:</span>
                <span className="font-bold text-emerald-700">{result.colacionEscolar}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">¿Desea ver las notas del 1er trimestre?</span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar al Portal de Calificaciones</span>
              </Link>
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="mt-6 bg-white p-6 rounded-3xl border border-rose-200 text-center animate-fadeIn shadow-sm">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-900">Estudiante No Encontrado</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 mb-3">
              No se encontró un registro activo con esa cédula para el año lectivo en curso. Verifique el número o acérquese a la secretaría del plantel.
            </p>
            <button
              onClick={() => setNotFound(false)}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Probar nuevamente
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
