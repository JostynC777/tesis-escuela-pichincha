"use client";

import React, { useState } from "react";
import { BookOpen, Users, Clock, CheckCircle2, ChevronRight, X, School, Sparkles, GraduationCap } from "lucide-react";

export interface BasicEducationLevel {
  id: string;
  category: "Educación Inicial" | "Preparatoria" | "Básica Elemental" | "Básica Media" | "Básica Superior";
  name: string;
  sublevel: string;
  grades: string;
  ageRange: string;
  description: string;
  studentCount: number;
  parallelCount: string;
  schedule: string;
  highlights: string[];
  curriculumFocus: string[];
}

export const BASIC_EDUCATION_LEVELS: BasicEducationLevel[] = [
  {
    id: "lvl-inicial",
    category: "Educación Inicial",
    name: "Educación Inicial (Inicial 1 e Inicial 2)",
    sublevel: "Inicial 1 y 2",
    grades: "Niños y niñas de 3 a 4 años",
    ageRange: "3 a 4 años",
    description: "Ambiente lúdico y afectivo en la Escuela Pichincha, centrado en el desarrollo de la autonomía personal, estimulación temprana del lenguaje, motricidad y socialización con sus primeros compañeros en Lloa.",
    studentCount: 26,
    parallelCount: "2 Cursos (Inicial 1 e Inicial 2)",
    schedule: "07:30 AM - 12:00 PM",
    highlights: [
      "Rincones de juego-trabajo y rincones de lectura infantil",
      "Estimulación del lenguaje oral y fonética lúdica",
      "Desarrollo de la motricidad fina y coordinación motriz",
      "Ración diaria del Programa de Alimentación Escolar MinEduc",
    ],
    curriculumFocus: [
      "Expresión corporal y motricidad",
      "Comprensión y expresión del lenguaje",
      "Convivencia armónica y afectividad",
      "Relaciones lógico-matemáticas tempranas",
    ],
  },
  {
    id: "lvl-preparatoria",
    category: "Preparatoria",
    name: "Preparatoria (1.º EGB)",
    sublevel: "1.º Grado EGB",
    grades: "Primer Grado de Educación General Básica",
    ageRange: "5 años",
    description: "Etapa de transición pedagógica que inicia formalmente la lectoescritura mediante el método fonético, nociones espaciales, cuantificadores numéricos y la integración a la vida escolar comunitaria de Lloa.",
    studentCount: 8,
    parallelCount: "1 Curso (1.º EGB)",
    schedule: "07:15 AM - 12:30 PM",
    highlights: [
      "Iniciación fonética a la lectura y escritura",
      "Cuantificación y nociones numéricas del 1 al 20",
      "Desarrollo socioafectivo y valores cívicos escolares",
      "Expresión plástica, canto y rondas tradicionales",
    ],
    curriculumFocus: [
      "Descubrimiento y comprensión del medio natural y cultural",
      "Identidad, autonomía y convivencia",
      "Comprensión y expresión artística",
      "Educación física y motricidad integral",
    ],
  },
  {
    id: "lvl-elemental",
    category: "Básica Elemental",
    name: "Subnivel Básica Elemental",
    sublevel: "2do, 3ro y 4to Grado EGB",
    grades: "Segundo, Tercer y Cuarto Grado de Básica",
    ageRange: "6 a 8 años",
    description: "Consolidación de la lectura comprensiva, escritura correcta, operaciones matemáticas de suma, resta y multiplicación básica, fomentando el amor por la naturaleza y la geografía de la parroquia Lloa.",
    studentCount: 45,
    parallelCount: "3 Cursos (2.º, 3.º y 4.º EGB)",
    schedule: "07:15 AM - 12:45 PM",
    highlights: [
      "Lectura comprensiva, caligrafía y ortografía básica",
      "Operaciones aritméticas y resolución de problemas cotidianos",
      "Ciencias Naturales enfocadas en la flora y fauna de Lloa",
      "Textos escolares gratuitos y cuadernos de trabajo MinEduc",
    ],
    curriculumFocus: [
      "Lengua y Literatura: Comprensión y producción de textos",
      "Matemáticas: Suma, resta, tablas de multiplicar y geometría",
      "Ciencias Naturales: El cuerpo humano, los seres vivos y su entorno",
      "Estudios Sociales: La familia, la escuela y la comunidad de Lloa",
    ],
  },
  {
    id: "lvl-media",
    category: "Básica Media",
    name: "Subnivel Básica Media",
    sublevel: "5to, 6to y 7mo Grado EGB",
    grades: "Quinto, Sexto y Séptimo Grado de Básica",
    ageRange: "9 a 11 años",
    description: "Desarrollo del pensamiento reflexivo, comprensión analítica de textos, operaciones con fracciones y decimales, proyectos escolares interdisciplinarios y rescate de la historia e identidad nacional.",
    studentCount: 35,
    parallelCount: "3 Cursos (5.º, 6.º y 7.º EGB)",
    schedule: "07:15 AM - 12:45 PM",
    highlights: [
      "Redacción de composiciones y resúmenes de lectura",
      "Fracciones, números decimales y cálculo mental",
      "Proyectos escolares comunitarios y huerto escolar",
      "Iniciación al idioma inglés y competencias digitales",
    ],
    curriculumFocus: [
      "Lengua y Literatura: Textos informativos y literarios",
      "Matemáticas: Operaciones combinadas, fracciones y estadística",
      "Ciencias Naturales: Ecosistemas andinos, agua y energía",
      "Estudios Sociales: Historia del Ecuador y geografía nacional",
    ],
  },
  {
    id: "lvl-superior",
    category: "Básica Superior",
    name: "Subnivel Básica Superior",
    sublevel: "8vo, 9no y 10mo Grado EGB",
    grades: "Octavo, Noveno y Décimo Grado de Básica",
    ageRange: "12 a 14 años",
    description: "Etapa culminante de la educación básica en la Escuela Pichincha: preparación sólida en álgebra elemental, ciencias experimentales, pensamiento crítico y orientación vocacional hacia el bachillerato.",
    studentCount: 32,
    parallelCount: "3 Cursos (8.º, 9.º y 10.º EGB)",
    schedule: "07:15 AM - 13:00 PM",
    highlights: [
      "Álgebra básica, ecuaciones de primer grado y geometría",
      "Laboratorio escolar de ciencias naturales y experimentos",
      "Ensayos argumentativos, oratoria y debate escolar",
      "Orientación vocacional y acompañamiento integral del DECE",
    ],
    curriculumFocus: [
      "Lengua y Literatura: Pensamiento crítico y literatura universal",
      "Matemáticas: Álgebra, funciones y probabilidad",
      "Ciencias Naturales: Biología celular, química básica y física",
      "Estudios Sociales: Democracia, deberes, derechos y ciudadanía",
    ],
  },
];

export function AcademicOffering() {
  const [selectedFilter, setSelectedFilter] = useState<string>("Todos");
  const [activeModalLevel, setActiveModalLevel] = useState<BasicEducationLevel | null>(null);

  const filters = [
    "Todos",
    "Educación Inicial",
    "Preparatoria",
    "Básica Elemental",
    "Básica Media",
    "Básica Superior",
  ];

  const filteredLevels = BASIC_EDUCATION_LEVELS.filter((level) => {
    if (selectedFilter === "Todos") return true;
    return level.category === selectedFilter;
  });

  return (
    <section id="niveles" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 border border-blue-200">
              <School className="w-3.5 h-3.5 text-blue-700" />
              <span>Ministerio de Educación del Ecuador • Régimen Sierra</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Niveles de Educación Básica • Escuela Pichincha
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Educación fiscal gratuita, integral y de calidad adaptada al contexto rural y comunitario de la parroquia Lloa, desde la primera infancia hasta 10mo de básica.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === filter
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* School Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLevels.map((level) => (
            <div
              key={level.id}
              className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Age & Sublevel pill */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full text-[11px]">
                    {level.sublevel}
                  </span>
                  <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {level.ageRange}
                  </span>
                </div>

                {/* Level Title */}
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-800 transition-colors mb-2">
                  {level.name}
                </h3>

                {/* Target Grades */}
                <div className="text-xs font-bold text-slate-700 mb-3 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {level.grades}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {level.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-1.5 mb-5">
                  {level.highlights.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    {level.studentCount} Alumnos
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {level.parallelCount}
                  </span>
                </div>

                <button
                  onClick={() => setActiveModalLevel(level)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Ver Plan de Estudio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Level Modal with Full Public School Information */}
      {activeModalLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModalLevel(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-2">
              {activeModalLevel.category} • {activeModalLevel.ageRange}
            </span>

            <h3 className="text-2xl font-black text-slate-900 mb-1">
              {activeModalLevel.name}
            </h3>

            <span className="text-xs font-bold text-slate-500 block mb-4">
              Escuela de Educación Básica &quot;Pichincha&quot; • Horario: {activeModalLevel.schedule}
            </span>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
              {activeModalLevel.description}
            </p>

            {/* Quick stats box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Matrícula Activa:</span>
                <span className="font-bold text-slate-800">{activeModalLevel.studentCount} Niños</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Organización:</span>
                <span className="font-bold text-slate-800">{activeModalLevel.parallelCount}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px]">Jornada:</span>
                <span className="font-bold text-blue-700">Matutina (Lloa)</span>
              </div>
            </div>

            {/* Curriculum areas */}
            <div className="space-y-2 mb-5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Áreas Curriculares y Destrezas Priorizadas:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {activeModalLevel.curriculumFocus.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* School benefits */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 mb-6 space-y-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                Beneficios Escolares Gratuitos (MinEduc):
              </span>
              <ul className="space-y-1 text-xs text-blue-800">
                {activeModalLevel.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-600">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModalLevel(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cerrar
              </button>
              <a
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow"
              >
                Consultar con la Tutora
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
