// ============================================================================
// ESCUELA DE EDUCACION BASICA "PICHINCHA" (LLOA - QUITO)
// Tipos TypeScript para Base de Datos Relacional (PostgreSQL / Supabase)
// ============================================================================

export type RolUsuario =
  | "ADMIN"
  | "DOCENTE"
  | "ESTUDIANTE"
  | "RECTORADO"
  | "DECE"
  | "admin"
  | "docente"
  | "estudiante"
  | "rectorado"
  | "dece";

export type EstadoAsistencia =
  | "PRESENTE"
  | "AUSENTE"
  | "JUSTIFICADO"
  | "ATRASO";

export type MetodoRegistroAsistencia =
  | "QR"
  | "MANUAL"
  | "QR_AUTOMATICO"
  | "MANUAL_DOCENTE"
  | "PENDIENTE"
  | "JUSTIFICADO_MEDICO";

export type EstadoAcademico =
  | "APROBADO"
  | "SUPLETORIO"
  | "REPROBADO";

export type NivelAlertaDECE =
  | "estable"
  | "moderado"
  | "critico";

export type EstadoPlanificacion =
  | "BORRADOR"
  | "ENVIADO"
  | "APROBADO"
  | "OBSERVADO";

// ============================================================================
// 1. ENTIDAD: PerfilUsuario
// ============================================================================
export interface PerfilUsuario {
  id: string;
  cedula?: string | null;
  nombres_completos: string;
  correo: string;
  rol: RolUsuario;
  telefono?: string | null;
  titulo_academico?: string | null;
  cargo?: string | null;
  carpeta_drive_url?: string | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// 2. ENTIDAD: Curso
// ============================================================================
export interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  especialidad?: string | null;
  orden: number;
  tutor_id?: string | null;
  created_at?: string;
  updated_at?: string;
  tutor?: PerfilUsuario | null;
}

// ============================================================================
// 3. ENTIDAD: Asignatura
// ============================================================================
export interface Asignatura {
  id: string;
  nombre: string;
  area: string;
  created_at?: string;
}

// ============================================================================
// 4. ENTIDAD: DocenteAsignaturaCurso
// ============================================================================
export interface DocenteAsignaturaCurso {
  id: string;
  docente_id: string;
  asignatura_id: string;
  curso_id: string;
  horas_semanales?: number;
  periodo_lectivo?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  docente?: PerfilUsuario;
  asignatura?: Asignatura;
  curso?: Curso;
}

// ============================================================================
// 5. ENTIDAD: Estudiante
// ============================================================================
export interface Estudiante {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  nombres_completos?: string;
  curso_id: string;
  tutor_id?: string | null;
  codigo_qr: string;
  nombre_representante?: string | null;
  telefono_representante?: string | null;
  alerta_dece?: NivelAlertaDECE;
  observacion_dece?: string | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
  curso?: Curso | null;
  tutor?: PerfilUsuario | null;
}

// ============================================================================
// 6. ENTIDAD: Asistencia
// ============================================================================
export interface Asistencia {
  id: string;
  estudiante_id: string;
  curso_id: string;
  docente_id?: string | null;
  asignatura_id?: string | null;
  fecha: string;
  hora: string;
  estado: EstadoAsistencia;
  metodo: MetodoRegistroAsistencia;
  codigo_qr_escaneado?: string | null;
  dispositivo_origen?: string | null;
  observacion?: string | null;
  created_at?: string;
  updated_at?: string;
  estudiante?: Estudiante;
  curso?: Curso;
}

// ============================================================================
// 7. ENTIDAD: Calificacion (Ponderacion MINEDUC 70/10/20)
// ============================================================================
export interface Calificacion {
  id: string;
  estudiante_id: string;
  curso_id: string;
  asignatura_id: string;
  docente_id: string;
  docente_asignatura_curso_id?: string | null;
  trimestre: number;
  nota_formativa: number;
  nota_proyecto: number;
  nota_sumativa: number;
  promedio_trimestral?: number;
  estado_academico?: EstadoAcademico;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
  estudiante?: Estudiante;
  asignatura?: Asignatura;
  curso?: Curso;
}

// ============================================================================
// 8. ENTIDAD: Planificacion
// ============================================================================
export interface Planificacion {
  id: string;
  docente_id: string;
  curso_id: string;
  asignatura_id: string;
  semana_numero: number;
  fecha_inicio: string;
  fecha_fin: string;
  titulo: string;
  archivo_url?: string | null;
  estado: EstadoPlanificacion;
  observaciones_revision?: string | null;
  revisado_por?: string | null;
  fecha_revision?: string | null;
  version?: number;
  created_at?: string;
  updated_at?: string;
  docente?: PerfilUsuario;
  curso?: Curso;
  asignatura?: Asignatura;
}

// ============================================================================
// SCHEMA GENERICO PARA EL CLIENTE SUPABASE (createClient<Database>)
// ============================================================================
export interface Database {
  public: {
    Tables: {
      perfiles_usuarios: {
        Row: PerfilUsuario;
        Insert: Partial<PerfilUsuario>;
        Update: Partial<PerfilUsuario>;
        Relationships: [];
      };
      cursos: {
        Row: Curso;
        Insert: Partial<Curso>;
        Update: Partial<Curso>;
        Relationships: [];
      };
      asignaturas: {
        Row: Asignatura;
        Insert: Partial<Asignatura>;
        Update: Partial<Asignatura>;
        Relationships: [];
      };
      docente_asignatura_curso: {
        Row: DocenteAsignaturaCurso;
        Insert: Partial<DocenteAsignaturaCurso>;
        Update: Partial<DocenteAsignaturaCurso>;
        Relationships: [];
      };
      estudiantes: {
        Row: Estudiante;
        Insert: Partial<Estudiante>;
        Update: Partial<Estudiante>;
        Relationships: [];
      };
      asistencias: {
        Row: Asistencia;
        Insert: Partial<Asistencia>;
        Update: Partial<Asistencia>;
        Relationships: [];
      };
      calificaciones: {
        Row: Calificacion;
        Insert: Partial<Calificacion>;
        Update: Partial<Calificacion>;
        Relationships: [];
      };
      planificaciones: {
        Row: Planificacion;
        Insert: Partial<Planificacion>;
        Update: Partial<Planificacion>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
