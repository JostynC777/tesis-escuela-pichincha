import { Navbar } from "@/components/Navbar";
import { HeroSection, PortalPublicStats } from "@/components/HeroSection";
import { AcademicOffering } from "@/components/AcademicOffering";
import { NewsAndEvents } from "@/components/NewsAndEvents";
import { CertificateValidator } from "@/components/CertificateValidator";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

const DEFAULT_PORTAL_STATS: PortalPublicStats = {
  totalEstudiantes: 176,
  totalCursos: 15,
  totalDocentes: 21,
};

async function getPortalStats(): Promise<PortalPublicStats> {
  try {
    const { data, error } = await (supabase as any).rpc("get_portal_public_stats");
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as {
        total_estudiantes?: number;
        total_cursos?: number;
        total_docentes?: number;
      };
      return {
        totalEstudiantes: Number(row.total_estudiantes) || DEFAULT_PORTAL_STATS.totalEstudiantes,
        totalCursos: Number(row.total_cursos) || DEFAULT_PORTAL_STATS.totalCursos,
        totalDocentes: Number(row.total_docentes) || DEFAULT_PORTAL_STATS.totalDocentes,
      };
    }
  } catch {
    // Fallback seguro a cifras oficiales institucionales
  }
  return DEFAULT_PORTAL_STATS;
}

export default async function PublicPortalPage() {
  const stats = await getPortalStats();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1">
        <HeroSection stats={stats} />
        <AcademicOffering />
        <NewsAndEvents />
        <CertificateValidator />
      </main>

      <Footer />
    </div>
  );
}
