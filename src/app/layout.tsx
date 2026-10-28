import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Escuela de Educación Básica Pichincha | Lloa - Ecuador",
  description: "Portal institucional, gestión docente de calificaciones por trimestres, control de asistencia y analítica de alerta temprana para la prevención de la deserción escolar.",
  keywords: ["Escuela Pichincha", "Lloa", "Educación Básica", "Ecuador", "MinEduc", "Gestión Escolar"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth bg-slate-50">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen selection:bg-blue-600 selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
