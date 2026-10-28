"use client";

import React from "react";
import { PARENT_ANNOUNCEMENTS } from "@/lib/mockData";
import { Bell, Calendar, Users, AlertCircle, ArrowUpRight, School } from "lucide-react";

export function NewsAndEvents() {
  return (
    <section id="comunicados" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3 border border-amber-200">
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>Cartelera Informativa Oficial</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Comunicados para Padres de Familia
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Manténgase informado sobre las convocatorias a comités de aula, entrega de libretas trimestrales, colación escolar y actividades comunitarias en Lloa.
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Actualizado por la Secretaría del Plantel
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PARENT_ANNOUNCEMENTS.map((ann) => (
            <div
              key={ann.id}
              className={`rounded-2xl p-6 border transition-all bg-white shadow-sm hover:shadow-md flex flex-col justify-between ${
                ann.important ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
              }`}
            >
              <div>
                {/* Header pills */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        ann.category === "Urgente"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : ann.category === "Alimentación"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : ann.category === "Académico"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {ann.category}
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium">
                      {ann.targetGrade}
                    </span>
                  </div>

                  <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {ann.publishDate}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                  {ann.title}
                </h3>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {ann.summary}
                </p>
              </div>

              {/* Issuer footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <School className="w-3.5 h-3.5 text-blue-700" />
                  {ann.issuer}
                </span>

                <span className="font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5">
                  Ver detalle oficial <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
