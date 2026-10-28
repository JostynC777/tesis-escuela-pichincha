"use client";

import React, { useState } from "react";
import Link from "next/link";
import { School, LogIn, Menu, X, BookOpen, Bell, MapPin, Shield } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Ministerial Bar */}
      <div className="bg-blue-900 text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">República del Ecuador</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200">Ministerio de Educación • Zona 9 • Distrito 17D01</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Parroquia Rural Lloa - Faldas del Guagua Pichincha</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* School Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md group-hover:bg-blue-800 transition-colors">
              <School className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-blue-950 tracking-tight group-hover:text-blue-700 transition-colors">
                  Escuela Pichincha
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Fiscal • AMIE 17H01429
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Escuela de Educación Básica • Lloa, Quito
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <Link
              href="/#inicio"
              className="hover:text-blue-700 transition-colors py-1 flex items-center gap-1.5"
            >
              Inicio
            </Link>
            <Link
              href="/#niveles"
              className="hover:text-blue-700 transition-colors py-1 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              Niveles de Básica
            </Link>
            <Link
              href="/#comunicados"
              className="hover:text-blue-700 transition-colors py-1 flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              Comunicados a Padres
            </Link>
            <Link
              href="/#institucion"
              className="hover:text-blue-700 transition-colors py-1 flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              Nuestra Escuela
            </Link>
          </nav>

          {/* Action Button: Acceso al Portal */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow-sm hover:shadow transition-all duration-200 border border-blue-800"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceso al Portal Seguro</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            href="/#inicio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          >
            Inicio Institucional
          </Link>
          <Link
            href="/#niveles"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          >
            Niveles de Educación Básica
          </Link>
          <Link
            href="/#comunicados"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          >
            Comunicados para Padres de Familia
          </Link>
          <Link
            href="/#institucion"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          >
            Nuestra Escuela en Lloa
          </Link>
          <div className="pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Acceso al Portal Seguro</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
