"use client";

import React, { useState } from "react";
import { formatGrade, getMinEducGradeScale } from "@/lib/utils";
import {
  School,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  UploadCloud,
  FileCheck,
  Heart,
  Phone,
} from "lucide-react";

export default function StudentFamilyDashboardPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      materia: "Matemáticas",
      titulo: "Ejercicios de Divisiones con dos cifras (Págs. 45 y 46)",
      fecha: "Mañana a las 07:15 AM",
      estado: "Pendiente",
    },
    {
      id: 2,
      materia: "Lengua y Literatura",
      titulo: "Lectura del cuento andino 'El Cóndor de Lloa' y resumen en el cuaderno",
      fecha: "Ayer",
      estado: "Entregado",
      nota: "10.00 / 10",
    },
    {
      id: 3,
      materia: "Ciencias Naturales",
      titulo: "Dibujo del ciclo del agua y el ecosistema del páramo de Pichincha",
      fecha: "Hace 3 días",
      estado: "Entregado",
      nota: "9.50 / 10",
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const materiasTrimestrales = [
    { nombre: "Lengua y Literatura", t1: 8.8, t2: 9.0, t3: 9.2, promedio: 9.0, asistencia: "98%" },
    { nombre: "Matemáticas", t1: 8.0, t2: 8.5, t3: 8.7, promedio: 8.4, asistencia: "96%" },
    { nombre: "Ciencias Naturales", t1: 9.2, t2: 9.4, t3: 9.5, promedio: 9.37, asistencia: "98%" },
    { nombre: "Estudios Sociales", t1: 8.5, t2: 8.8, t3: 9.0, promedio: 8.77, asistencia: "95%" },
    { nombre: "Educación Cultural y Artística", t1: 9.5, t2: 9.8, t3: 10.0, promedio: 9.77, asistencia: "100%" },
    { nombre: "Educación Física", t1: 9.5, t2: 9.5, t3: 9.8, promedio: 9.6, asistencia: "100%" },
  ];

  const handleDeliverTask = (taskId: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, estado: "Entregado" } : t))
    );
    setToastMessage("¡Tarea enviada a la docente tutora correctamente!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Student Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
              MT
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Estudiante Regular • 5to Grado EGB &quot;A&quot;
                </span>
                <span className="text-slate-400 text-xs font-mono hidden sm:inline">
                  RUDE: EST-LLOA-2026-01
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Mateo Sebastián Toapanta Pillajo
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Escuela de Educación Básica &quot;Pichincha&quot; • Tutora: Lic. María Elena Guamán
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Promedio Anual
              </span>
              <span className="text-2xl font-black font-mono text-blue-700">
                8.77
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block">Sobre 10 pts</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Asistencia Total
              </span>
              <span className="text-2xl font-black font-mono text-emerald-700">
                96%
              </span>
              <span className="text-[10px] text-slate-500 block">Regular en Lloa</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Colación Escolar
              </span>
              <span className="text-lg font-bold text-slate-800 block mt-1">
                Asignada
              </span>
              <span className="text-[10px] text-blue-700 font-semibold block">MinEduc</span>
            </div>
          </div>

        </div>
      </div>

      {/* Libreta de Calificaciones Trimestrales sobre 10 Puntos */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg font-black text-slate-900">
                Libreta Escolar de Calificaciones Trimestrales
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Escala de evaluación oficial del Ministerio de Educación: DAR (9-10), AAR (7-8.99), PAAR (4.01-6.99).
            </p>
          </div>

          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            Año Lectivo 2026 - 2027
          </span>
        </div>

        {/* Grades Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3 px-3">Asignatura del Currículo EGB</th>
                <th className="py-3 px-3 text-center">1er Trimestre</th>
                <th className="py-3 px-3 text-center">2do Trimestre</th>
                <th className="py-3 px-3 text-center">3er Trimestre</th>
                <th className="py-3 px-3 text-center">Promedio Anual</th>
                <th className="py-3 px-3 text-center">Escala MinEduc</th>
                <th className="py-3 px-3 text-center">Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiasTrimestrales.map((mat) => {
                const scale = getMinEducGradeScale(mat.promedio);

                return (
                  <tr key={mat.nombre} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {mat.nombre}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(mat.t1)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(mat.t2)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {formatGrade(mat.t3)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-sm text-blue-700">
                      {formatGrade(mat.promedio)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${scale.badgeClass}`}>
                        {scale.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                      {mat.asistencia}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tareas Escolares y Seguimiento para Padres */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-700" />
              <span>Tareas Escolares & Cuadernos de Trabajo</span>
            </h3>
            <p className="text-xs text-slate-500">
              Supervisión de actividades extracurriculares para padres de familia
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-700">{task.materia}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Plazo: {task.fecha}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{task.titulo}</h4>
                {task.nota && (
                  <span className="text-xs text-emerald-700 font-bold block mt-0.5">
                    Calificación asignada por la maestra: {task.nota}
                  </span>
                )}
              </div>

              <div>
                {task.estado === "Pendiente" ? (
                  <button
                    onClick={() => handleDeliverTask(task.id)}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Marcar como Hecha</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tarea Entregada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
