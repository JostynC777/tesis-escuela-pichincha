import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AcademicOffering } from "@/components/AcademicOffering";
import { NewsAndEvents } from "@/components/NewsAndEvents";
import { CertificateValidator } from "@/components/CertificateValidator";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Institutional Navbar */}
      <Navbar />

      {/* Main Public Portal Sections */}
      <main className="flex-1">
        <HeroSection />
        <AcademicOffering />
        <NewsAndEvents />
        <CertificateValidator />
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
