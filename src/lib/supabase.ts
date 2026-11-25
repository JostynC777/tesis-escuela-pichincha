import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// ============================================================================
// ESCUELA DE EDUCACIÓN BÁSICA "PICHINCHA"
// Inicialización del Cliente Supabase (PostgreSQL)
// ============================================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-pichincha.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Verificación de configuración en modo desarrollo
if (
  process.env.NODE_ENV === "development" &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  if (typeof window !== "undefined") {
    console.warn(
      "[Supabase Pichincha] Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas en .env.local. El cliente opera en modo contingencia/mock."
    );
  }
}

/**
 * Cliente oficial de Supabase con tipado estricto según database.types.ts
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
