"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, School, BookOpen, Users, Award, ShieldCheck, Heart, MapPin } from "lucide-react";

export interface PortalPublicStats {
  totalEstudiantes: number;
  totalCursos: number;
  totalDocentes: number;
}

interface HeroSectionProps {
  stats?: PortalPublicStats;
}

export function HeroSection({ stats }: HeroSectionProps) {
  const totalEstudiantes = stats?.totalEstudiantes ?? 176;
  const totalCursos = stats?.totalCursos ?? 15;
  const totalDocentes = stats?.totalDocentes ?? 21;

  return (
    <section id="inicio" className="relative pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold shadow-sm">
              <School className="w-4 h-4 text-blue-700" />
              <span>Institución Educativa Fiscal • AMIE 17H01429 • Parroquia Lloa</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Formando el futuro de{" "}
              <span className="text-blue-700 underline decoration-blue-300 decoration-wavy">
                Lloa
              </span>{" "}
              con calidez y excelencia
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              La <strong>Escuela de Educación Básica &quot;Pichincha&quot;</strong> brinda formación integral y gratuita
              a {totalEstudiantes} estudiantes en {totalCursos} cursos activos (desde Educación Inicial hasta Bachillerato Técnico),
              con evaluación MINEDUC 70/10/20, asistencia híbrida QR y seguimiento DECE.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-md hover:shadow-lg transition-all text-sm group"
              >
                <span>Ingresar al Portal Escolar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/portal#comunicados"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-sm transition-all text-sm"
              >
                <span>Avisos para Padres de Familia</span>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Educación Fiscal 100% Gratuita</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Alimentación y Textos MinEduc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Comunidad Activa de Lloa</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-amber-400 to-emerald-600" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                    Ficha Técnica Escolar
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    E.E.B. &quot;Pichincha&quot;
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  Año Lectivo 2026 - 2027
                </span>
              </div>

              <div className="mt-5 space-y-3.5 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Régimen Escolar:</span>
                    <span className="text-slate-600">Sierra - Amazonía • Modalidad Presencial Matutina</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Matrícula Oficial:</span>
                    <span className="text-slate-600">
                      {totalEstudiantes} estudiantes distribuidos en {totalCursos} cursos activos
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Evaluación MINEDUC 70/10/20 y DECE:</span>
                    <span className="text-slate-600">Asistencia híbrida QR y alertas tempranas DECE</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Distrito Educativo 17D01 • AMIE 17H01429</span>
                <Link
                  href="/login"
                  className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group"
                >
                  <span>Portal Docente</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-800">{totalEstudiantes}</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Estudiantes Matriculados</div>
            <div className="text-[11px] text-slate-500">Matrícula oficial en Lloa</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{totalCursos} Cursos</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Oferta Académica Activa</div>
            <div className="text-[11px] text-slate-500">Inicial, EGB y Bachillerato</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-700">{totalDocentes}</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Docentes Institucionales</div>
            <div className="text-[11px] text-slate-500">100% gratuidad fiscal MinEduc</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">70 / 10 / 20</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Evaluación MINEDUC</div>
            <div className="text-[11px] text-slate-500">Asistencia QR y seguimiento DECE</div>
          </div>
        </div>
      </div>
    </section>
  );
}
