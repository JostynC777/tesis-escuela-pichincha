"use client";

import React, { useState, useEffect } from "react";
import { StudentGradeRecord } from "@/lib/mockData";
import { formatGrade, getMinEducGradeScale } from "@/lib/utils";
import { X, Save, Calculator, AlertCircle, School } from "lucide-react";

interface GradeEditorModalProps {
  student: StudentGradeRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: StudentGradeRecord) => void;
}

export function GradeEditorModal({
  student,
  isOpen,
  onClose,
  onSave,
}: GradeEditorModalProps) {
  const [t1, setT1] = useState<number>(0);
  const [t2, setT2] = useState<number>(0);
  const [t3, setT3] = useState<number>(0);
  const [motivo, setMotivo] = useState<string>("");

  useEffect(() => {
    if (student) {
      setT1(student.trimestre1);
      setT2(student.trimestre2);
      setT3(student.trimestre3);
      setMotivo(student.motivoAlerta || "");
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // MinEduc calculation: Average of the three trimesters over 10 points
  const calculatedPromedio = Number(((t1 + t2 + t3) / 3).toFixed(2));
  const scale = getMinEducGradeScale(calculatedPromedio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const alertaRiesgo: "normal" | "moderado" | "critico" =
      calculatedPromedio < 6.0
        ? "critico"
        : calculatedPromedio < 7.0
        ? "moderado"
        : "normal";

    onSave({
      ...student,
      trimestre1: Number(t1),
      trimestre2: Number(t2),
      trimestre3: Number(t3),
      promedioAnual: calculatedPromedio,
      escalaMinEduc: scale.code,
      alertaRiesgo,
      motivoAlerta: motivo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase text-blue-700 block">
              Registro Trimestral de Calificaciones (MinEduc)
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {student.studentName}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Cód: {student.studentCode} • {student.gradeAndSection}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                1er Trimestre
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={t1}
                onChange={(e) => setT1(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-center text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 text-center block mt-1">Sobre 10 pts</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                2do Trimestre
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={t2}
                onChange={(e) => setT2(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-center text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 text-center block mt-1">Sobre 10 pts</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                3er Trimestre
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={t3}
                onChange={(e) => setT3(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-center text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
                required
              />
              <span className="text-[10px] text-slate-400 text-center block mt-1">Sobre 10 pts</span>
            </div>
          </div>

          {/* Real-time calculated Promedio Anual */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Promedio Anual Automático:
                </span>
                <span className="text-xl font-mono font-black text-slate-900">
                  {formatGrade(calculatedPromedio)} / 10.00
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${scale.badgeClass}`}>
                {scale.label}
              </span>
              {calculatedPromedio < 7.0 && (
                <span className="text-[10px] text-rose-600 font-bold block mt-1">
                  Requiere Refuerzo Pedagógico
                </span>
              )}
            </div>
          </div>

          {/* Observations & Reinforcement */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Observaciones del Docente / Plan de Refuerzo Académico:
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Estudiante requiere refuerzo en cálculo y lectura en casa..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:border-blue-600 focus:bg-white outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Calificaciones Trimestrales</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
