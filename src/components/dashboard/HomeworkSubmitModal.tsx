"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileCheck, CheckCircle2 } from "lucide-react";

export interface SchoolAssignment {
  id: number;
  materia: string;
  titulo: string;
  fecha: string;
  estado: string;
  nota?: string;
}

interface HomeworkSubmitModalProps {
  assignment: SchoolAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (assignmentId: number, fileName: string) => void;
}

export function HomeworkSubmitModal({
  assignment,
  isOpen,
  onClose,
  onSubmitSuccess,
}: HomeworkSubmitModalProps) {
  const [file, setFile] = useState<string>("tarea_escuela_pichincha.pdf");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      onSubmitSuccess(assignment.id, file);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              {assignment.materia}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Entrega de Tarea Escolar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="text-slate-900 font-bold text-sm">
            {assignment.titulo}
          </div>
          <div className="text-slate-500 text-[11px]">
            Plazo de entrega: <strong className="text-blue-700">{assignment.fecha}</strong>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Adjuntar Foto o Archivo de la Tarea (.jpg, .pdf)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors cursor-pointer group">
              <UploadCloud className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800 mb-1">
                {file ? file : "Haga clic o arrastre la foto del cuaderno aquí"}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Formato admitido: Foto de celular o PDF
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Nota o mensaje para la docente tutora (Opcional)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Estimada maestra, adjunto la foto del deber realizado..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:border-blue-600 focus:bg-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Confirmar Entrega</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
