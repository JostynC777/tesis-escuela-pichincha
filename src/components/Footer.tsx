import React from "react";
import Link from "next/link";
import { School, MapPin, Phone, Mail, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs sm:text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Institutional Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <School className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white block">
                  Escuela Pichincha
                </span>
                <span className="text-[11px] text-blue-400 font-semibold block">
                  Educación Básica • Lloa
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Institución pública fiscal comprometida con la niñez y las familias de la parroquia rural de Lloa. Formando ciudadanos con valores, ciencia y amor a la naturaleza.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Código AMIE: 17H01429 • Circuito Lloa</span>
            </div>
          </div>

          {/* Col 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Portal Institucional
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#inicio" className="hover:text-white transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/#niveles" className="hover:text-white transition-colors">
                  Niveles de Educación Básica
                </Link>
              </li>
              <li>
                <Link href="/#comunicados" className="hover:text-white transition-colors">
                  Comunicados a Padres de Familia
                </Link>
              </li>
              <li>
                <Link href="/#institucion" className="hover:text-white transition-colors">
                  Consulta de Matrícula
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Acceso a Docentes y Directivos
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Módulos del Sistema */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Sistema de Gestión
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard/teacher" className="hover:text-white transition-colors">
                  Módulo de Calificaciones Trimestrales
                </Link>
              </li>
              <li>
                <Link href="/dashboard/teacher" className="hover:text-white transition-colors">
                  Módulo de Asistencia QR
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="hover:text-white transition-colors">
                  Analítica de Riesgo & Rectorado
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Panel Administrativo General
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Ubicación y Contacto */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Ubicación en Lloa
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Calle Manuel Benítez y Pichincha, Parroquia Rural Lloa, Pichincha, Ecuador</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>(02) 287-3104 / Distrito 17D01</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>escuela.pichincha.lloa@educacion.gob.ec</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Escuela de Educación Básica &quot;Pichincha&quot;. Ministerio de Educación del Ecuador.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Al servicio de la niñez rural de Lloa</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
