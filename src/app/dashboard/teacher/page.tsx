"use client";

import React, { useState } from "react";
import {
  SCHOOL_CLASSES,
  INITIAL_STUDENT_GRADES,
  StudentGradeRecord,
} from "@/lib/mockData";
import { DynamicQRGenerator } from "@/components/dashboard/DynamicQRGenerator";
import { GradeEditorModal } from "@/components/dashboard/GradeEditorModal";
import { EarlyWarningBadge } from "@/components/dashboard/EarlyWarningBadge";
import { formatGrade, getMinEducGradeScale } from "@/lib/utils";
import {
  School,
  ClipboardList,
  Search,
  Filter,
  Edit3,
  Download,
  Users,
  AlertTriangle,
  CheckCircle2,
  Phone,
  FileSpreadsheet,
} from "lucide-react";

export default function TeacherGradesDashboardPage() {
  const [classes] = useState(SCHOOL_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState(SCHOOL_CLASSES[0].id);
  const [students, setStudents] = useState<StudentGradeRecord[]>(INITIAL_STUDENT_GRADES);
  const [searchTerm, setSearchTerm] = useState("");
  const [scaleFilter, setScaleFilter] = useState("TODOS");

  // Modal
  const [editingStudent, setEditingStudent] = useState<StudentGradeRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleEditGrade = (student: StudentGradeRecord) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveGrade = (updated: StudentGradeRecord) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    setToastMessage(`Notas trimestrales actualizadas con éxito para ${updated.studentName}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (scaleFilter === "TODOS") return matchesSearch;
    return matchesSearch && s.escalaMinEduc === scaleFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Classroom Selection & Teacher Info */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Grado / Aula Asignada
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {currentClass.name} • {currentClass.parallel}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedClassId === cls.id
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cls.code}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Classroom Stats */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Docente Tutora:</span>
            <span className="font-bold text-slate-800">{currentClass.tutorName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Alumnos Matriculados:</span>
            <span className="font-bold text-blue-700">{currentClass.studentCount} estudiantes</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Promedio del Grado:</span>
            <span className="font-bold text-emerald-700">{currentClass.averageGrade} / 10.00 pts</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Asistencia Promedio:</span>
            <span className="font-bold text-slate-800">{currentClass.attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Generator Component */}
      <DynamicQRGenerator
        classNameTitle={currentClass.name}
        classCode={currentClass.code}
      />

      {/* Módulo de Calificaciones: Tabla Trimestral sobre 10 Puntos */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg font-black text-slate-900">
                Registro de Calificaciones por Trimestres (MinEduc)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Notas evaluadas sobre 10 puntos con cálculo automático del promedio anual y escala de aprendizajes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar alumno o representante..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:bg-white outline-none"
              />
            </div>

            {/* Scale Filter */}
            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium focus:border-blue-600 outline-none"
            >
              <option value="TODOS">Todas las Escalas</option>
              <option value="DAR">Solo DAR (9 - 10 pts)</option>
              <option value="AAR">Solo AAR (7 - 8.99 pts)</option>
              <option value="PAAR">Solo PAAR (4.01 - 6.99 pts)</option>
              <option value="NAAR">Solo NAAR (&le; 4 pts)</option>
            </select>

            {/* Export Mock Button */}
            <button
              onClick={() => alert("Descargando Acta Oficial de Calificaciones Trimestrales en formato MinEduc Excel/PDF...")}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Exportar Acta</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-3">Estudiante & Representante</th>
                <th className="py-3 px-3 text-center">1er Trimestre</th>
                <th className="py-3 px-3 text-center">2do Trimestre</th>
                <th className="py-3 px-3 text-center">3er Trimestre</th>
                <th className="py-3 px-3 text-center">Promedio Anual</th>
                <th className="py-3 px-3 text-center">Asistencia</th>
                <th className="py-3 px-3 text-center">Escala MinEduc</th>
                <th className="py-3 px-3 text-center">Alerta Temprana</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((std) => {
                const scale = getMinEducGradeScale(std.promedioAnual);

                return (
                  <tr
                    key={std.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {std.studentName}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {std.studentCode}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-blue-600" />
                          <span>{std.parentName} • {std.parentPhone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Trimestre 1 */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(std.trimestre1)}
                    </td>

                    {/* Trimestre 2 */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(std.trimestre2)}
                    </td>

                    {/* Trimestre 3 */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(std.trimestre3)}
                    </td>

                    {/* Promedio Anual */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-black text-sm text-slate-900 block">
                        {formatGrade(std.promedioAnual)}
                      </span>
                      <span className="text-[10px] text-slate-400">sobre 10 pts</span>
                    </td>

                    {/* Asistencia */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-mono font-bold text-xs ${
                        std.asistenciaPorcentaje >= 85
                          ? "text-emerald-700"
                          : std.asistenciaPorcentaje >= 75
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}>
                        {std.asistenciaPorcentaje}%
                      </span>
                    </td>

                    {/* Escala MinEduc */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scale.badgeClass}`}>
                        {scale.code}
                      </span>
                    </td>

                    {/* Alerta de Riesgo (Semáforo) */}
                    <td className="py-3.5 px-3 text-center">
                      <EarlyWarningBadge level={std.alertaRiesgo} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleEditGrade(std)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-700 text-blue-700 hover:text-white border border-blue-200 transition-all font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Grade Editor Modal */}
      <GradeEditorModal
        student={editingStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGrade}
      />

    </div>
  );
}
