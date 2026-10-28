// ==========================================
// ESCUELA DE EDUCACIÓN BÁSICA "PICHINCHA"
// Parroquia Rural Lloa - Quito, Pichincha, Ecuador
// Código AMIE: 17H01429 | Distrito Educativo 17D01
// ==========================================

export interface SchoolLevel {
  id: string;
  name: string;
  sublevel: string;
  grades: string;
  ageRange: string;
  description: string;
  studentCount: number;
  icon: string;
  color: string;
  highlights: string[];
}

export interface ParentAnnouncement {
  id: string;
  title: string;
  category: "Urgente" | "Académico" | "Comunidad" | "Alimentación";
  targetGrade: string;
  publishDate: string;
  summary: string;
  issuer: string;
  important?: boolean;
}

export interface StudentGradeRecord {
  id: string;
  studentCode: string;
  studentName: string;
  gradeAndSection: string;
  parentName: string;
  parentPhone: string;
  trimestre1: number; // 0 - 10
  trimestre2: number; // 0 - 10
  trimestre3: number; // 0 - 10
  promedioAnual: number;
  asistenciaPorcentaje: number;
  escalaMinEduc: "DAR" | "AAR" | "PAAR" | "NAAR";
  alertaRiesgo: "normal" | "moderado" | "critico";
  motivoAlerta?: string;
}

export interface SchoolClassInfo {
  id: string;
  code: string;
  name: string;
  sublevel: string;
  parallel: string;
  tutorName: string;
  studentCount: number;
  room: string;
  averageGrade: number;
  attendanceRate: number;
}

export interface RiskStudentReport {
  id: string;
  name: string;
  grade: string;
  parallel: string;
  promedio: number;
  asistencia: number;
  nivelRiesgo: "critico" | "moderado" | "estable";
  causaRiesgo: string;
  seguimientoDECE: string;
  tutor: string;
  telefonoContacto: string;
}

// 1. NIVELES DE EDUCACIÓN GENERAL BÁSICA (MinEduc Ecuador)
export const SCHOOL_LEVELS: SchoolLevel[] = [
  {
    id: "lvl-inicial",
    name: "Educación Inicial",
    sublevel: "Subnivel Inicial 2",
    grades: "Niños y niñas de 3 a 4 años",
    ageRange: "3 a 4 años",
    description: "Desarrollo de la autonomía, estimulación del lenguaje, expresión corporal, motricidad y alimentación escolar diaria en Lloa.",
    studentCount: 38,
    icon: "Baby",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    highlights: ["Rincones de juego-trabajo", "Estimulación temprana del lenguaje", "Motricidad fina y sensorial", "Alimentación escolar MinEduc"],
  },
  {
    id: "lvl-preparatoria",
    name: "Preparatoria",
    sublevel: "1er Grado EGB",
    grades: "Primer Grado de Educación General Básica",
    ageRange: "5 años",
    description: "Iniciación fonética a la lectoescritura, nociones espaciales y cuantitativas, convivencia armónica y rondas tradicionales.",
    studentCount: 42,
    icon: "BookOpen",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    highlights: ["Iniciación fonética a la lectura", "Nociones numéricas del 1 al 20", "Valores escolares y convivencia", "Expresión plástica y artística"],
  },
  {
    id: "lvl-elemental",
    name: "Básica Elemental",
    sublevel: "Subnivel Elemental",
    grades: "2do, 3ro y 4to Grado EGB",
    ageRange: "6 a 8 años",
    description: "Consolidación de la lectura comprensiva, operaciones matemáticas básicas (suma, resta, multiplicación) y ciencias del entorno natural de Lloa.",
    studentCount: 115,
    icon: "BookOpen",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    highlights: ["Lectura comprensiva y caligrafía", "Operaciones matemáticas cotidianas", "Ciencias naturales del entorno andino", "Textos escolares gratuitos"],
  },
  {
    id: "lvl-media",
    name: "Básica Media",
    sublevel: "Subnivel Medio",
    grades: "5to, 6to y 7mo Grado EGB",
    ageRange: "9 a 11 años",
    description: "Pensamiento lógico reflexivo, operaciones con fracciones y decimales, proyectos escolares interdisciplinarios e historia del Ecuador.",
    studentCount: 128,
    icon: "GraduationCap",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    highlights: ["Comprensión lectora analítica", "Fracciones, decimales y geometría", "Proyectos escolares y huerto", "Iniciación al idioma inglés"],
  },
  {
    id: "lvl-superior",
    name: "Básica Superior",
    sublevel: "Subnivel Superior",
    grades: "8vo, 9no y 10mo Grado EGB",
    ageRange: "12 a 14 años",
    description: "Álgebra elemental, laboratorio de ciencias experimentales, ensayos argumentativos, formación cívica y orientación vocacional hacia el bachillerato.",
    studentCount: 135,
    icon: "Award",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    highlights: ["Álgebra y resolución de ecuaciones", "Laboratorio de ciencias naturales", "Lectura crítica y oratoria", "Orientación vocacional DECE"],
  },
];

// 2. COMUNICADOS OFICIALES PARA PADRES DE FAMILIA
export const PARENT_ANNOUNCEMENTS: ParentAnnouncement[] = [
  {
    id: "not-1",
    title: "Convocatoria a Entrega de Libretas de Calificaciones del 1er Trimestre",
    category: "Académico",
    targetGrade: "Todos los grados (1ro a 10mo EGB)",
    publishDate: "28 de Octubre, 2026",
    summary: "Se convoca a las madres, padres de familia y representantes legales a la reunión presencial de entrega de libretas de calificaciones y reporte de desempeño del Primer Trimestre. La asistencia es de carácter obligatorio.",
    issuer: "Dirección y Comité de Docentes Tutores",
    important: true,
  },
  {
    id: "not-2",
    title: "Distribución del Programa de Alimentación Escolar (Colación MinEduc)",
    category: "Alimentación",
    targetGrade: "Inicial a 7mo de Básica",
    publishDate: "24 de Octubre, 2026",
    summary: "Se informa a la comunidad educativa que el día jueves se realizará la entrega de las raciones de leche fortificada y barras de cereales nutritivas correspondientes a la remesa mensual del Ministerio de Educación.",
    issuer: "Comisión de Salud y Nutrición Escolar",
  },
  {
    id: "not-3",
    title: "Gran Minga Comunitaria de Adecentamiento y Mantenimiento de Aulas",
    category: "Comunidad",
    targetGrade: "Comité Central de Padres de Familia",
    publishDate: "18 de Octubre, 2026",
    summary: "Con el objetivo de mantener en óptimas condiciones las áreas verdes y aulas de nuestra querida escuela, invitamos a los representantes a la minga parroquial de fin de semana con herramientas de limpieza.",
    issuer: "Directorio de Padres de Familia - Lloa",
  },
  {
    id: "not-4",
    title: "Campaña de Vacunación Escolar en Convenio con el Centro de Salud de Lloa",
    category: "Urgente",
    targetGrade: "Estudiantes de 5 a 9 años",
    publishDate: "15 de Octubre, 2026",
    summary: "Brigada médica del Ministerio de Salud Pública (MSP) visitará la institución para la aplicación de refuerzos del esquema regular de vacunación infantil. Favor enviar el carnet de salud firmado.",
    issuer: "Departamento de Consejería Estudiantil (DECE)",
    important: true,
  },
];

// 3. CURSOS / PARALELOS DISPONIBLES EN LA ESCUELA
export const SCHOOL_CLASSES: SchoolClassInfo[] = [
  {
    id: "cls-5a",
    code: "5TO-EGB-A",
    name: "5to Grado de Educación General Básica",
    sublevel: "Básica Media",
    parallel: "Paralelo A",
    tutorName: "Lic. María Elena Guamán",
    studentCount: 28,
    room: "Aula Bloque 2 - Planta Alta",
    averageGrade: 7.9,
    attendanceRate: 91.2,
  },
  {
    id: "cls-6a",
    code: "6TO-EGB-A",
    name: "6to Grado de Educación General Básica",
    sublevel: "Básica Media",
    parallel: "Paralelo A",
    tutorName: "Prof. Milton Carlos Alomoto",
    studentCount: 26,
    room: "Aula Bloque 2 - Planta Baja",
    averageGrade: 8.2,
    attendanceRate: 93.5,
  },
  {
    id: "cls-7b",
    code: "7MO-EGB-B",
    name: "7mo Grado de Educación General Básica",
    sublevel: "Básica Media",
    parallel: "Paralelo B",
    tutorName: "Lic. Rosa Elvira Chiluisa",
    studentCount: 29,
    room: "Aula Bloque 3",
    averageGrade: 7.4,
    attendanceRate: 86.8,
  },
];

// 4. REGISTRO DE NOTAS POR TRIMESTRES (5to Grado "A" - Ejemplo Realista)
// Escala oficial MinEduc:
// DAR (9.00 - 10.00): Domina los aprendizajes requeridos
// AAR (7.00 - 8.99): Alcanza los aprendizajes requeridos
// PAAR (4.01 - 6.99): Próximo a alcanzar los aprendizajes (En riesgo)
// NAAR (<= 4.00): No alcanza los aprendizajes (Riesgo crítico)
export const INITIAL_STUDENT_GRADES: StudentGradeRecord[] = [
  {
    id: "std-01",
    studentCode: "EST-LLOA-2026-01",
    studentName: "Mateo Sebastián Toapanta Pillajo",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Segundo Toapanta (Padre)",
    parentPhone: "0984123891",
    trimestre1: 8.5,
    trimestre2: 8.8,
    trimestre3: 9.0,
    promedioAnual: 8.77,
    asistenciaPorcentaje: 96,
    escalaMinEduc: "AAR",
    alertaRiesgo: "normal",
  },
  {
    id: "std-02",
    studentCode: "EST-LLOA-2026-02",
    studentName: "Doménica Estefanía Chiluisa Morales",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Carmen Morales (Madre)",
    parentPhone: "0995671243",
    trimestre1: 9.6,
    trimestre2: 9.4,
    trimestre3: 9.8,
    promedioAnual: 9.6,
    asistenciaPorcentaje: 98,
    escalaMinEduc: "DAR",
    alertaRiesgo: "normal",
  },
  {
    id: "std-03",
    studentCode: "EST-LLOA-2026-03",
    studentName: "Jostyn Alexander Quishpe Guamán",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Rosa Guamán (Madre)",
    parentPhone: "0987345612",
    trimestre1: 6.2,
    trimestre2: 6.5,
    trimestre3: 6.8,
    promedioAnual: 6.5,
    asistenciaPorcentaje: 74,
    escalaMinEduc: "PAAR",
    alertaRiesgo: "moderado",
    motivoAlerta: "Dificultad en comprensión lectora y operaciones de división. Inasistencias recurrentes por apoyo en faenas agrícolas.",
  },
  {
    id: "std-04",
    studentCode: "EST-LLOA-2026-04",
    studentName: "Camila Andrea Pillajo Alomoto",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Martha Alomoto (Madre)",
    parentPhone: "0991283746",
    trimestre1: 5.0,
    trimestre2: 4.8,
    trimestre3: 5.4,
    promedioAnual: 5.07,
    asistenciaPorcentaje: 65,
    escalaMinEduc: "PAAR",
    alertaRiesgo: "critico",
    motivoAlerta: "Alto ausentismo injustificado. No presenta tareas del plan de refuerzo. Riesgo inminente de reprobación y deserción escolar.",
  },
  {
    id: "std-05",
    studentCode: "EST-LLOA-2026-05",
    studentName: "Kevin Patricio Criollo Simbaña",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Manuel Criollo (Padre)",
    parentPhone: "0982394812",
    trimestre1: 7.8,
    trimestre2: 8.0,
    trimestre3: 8.2,
    promedioAnual: 8.0,
    asistenciaPorcentaje: 92,
    escalaMinEduc: "AAR",
    alertaRiesgo: "normal",
  },
  {
    id: "std-06",
    studentCode: "EST-LLOA-2026-06",
    studentName: "Dayana Marisol Tipán Cando",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Gloria Cando (Madre)",
    parentPhone: "0994857123",
    trimestre1: 6.8,
    trimestre2: 6.9,
    trimestre3: 7.1,
    promedioAnual: 6.93,
    asistenciaPorcentaje: 78,
    escalaMinEduc: "PAAR",
    alertaRiesgo: "moderado",
    motivoAlerta: "Promedio acumulado menor a 7.0. Se asignó tutoría de refuerzo los días martes y jueves en Matemáticas.",
  },
  {
    id: "std-07",
    studentCode: "EST-LLOA-2026-07",
    studentName: "Brayan Andrés Sangucho Tipantuña",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Luis Sangucho (Padre)",
    parentPhone: "0983149582",
    trimestre1: 8.9,
    trimestre2: 9.1,
    trimestre3: 9.0,
    promedioAnual: 9.0,
    asistenciaPorcentaje: 95,
    escalaMinEduc: "DAR",
    alertaRiesgo: "normal",
  },
  {
    id: "std-08",
    studentCode: "EST-LLOA-2026-08",
    studentName: "Evelyn Nicole Cuichán Ramos",
    gradeAndSection: "5to EGB - Paralelo A",
    parentName: "Teresa Ramos (Madre)",
    parentPhone: "0996781290",
    trimestre1: 4.5,
    trimestre2: 4.2,
    trimestre3: 4.6,
    promedioAnual: 4.43,
    asistenciaPorcentaje: 58,
    escalaMinEduc: "PAAR",
    alertaRiesgo: "critico",
    motivoAlerta: "Inasistencias prolongadas. Caso derivado al Departamento de Consejería Estudiantil (DECE) y visita domiciliaria programada.",
  },
];

// 5. ANALÍTICA DE RENDIMIENTO POR ASIGNATURA (Datos para Recharts)
export const SUBJECT_PERFORMANCE_DATA = [
  { materia: "Lengua y Lit.", promedio: 7.8, metaMinEduc: 7.0, aprobados: 88, enRiesgo: 12 },
  { materia: "Matemáticas", promedio: 6.9, metaMinEduc: 7.0, aprobados: 74, enRiesgo: 26 },
  { materia: "C. Naturales", promedio: 8.1, metaMinEduc: 7.0, aprobados: 92, enRiesgo: 8 },
  { materia: "E. Sociales", promedio: 8.4, metaMinEduc: 7.0, aprobados: 94, enRiesgo: 6 },
  { materia: "Ed. Artística", promedio: 9.2, metaMinEduc: 7.0, aprobados: 98, enRiesgo: 2 },
  { materia: "Ed. Física", promedio: 9.4, metaMinEduc: 7.0, aprobados: 100, enRiesgo: 0 },
];

// 6. TENDENCIA DE ASISTENCIA MENSUAL POR SUBNIVEL (Datos para Recharts)
export const MONTHLY_ATTENDANCE_DATA = [
  { mes: "Sep", Inicial: 95, Elemental: 94, Media: 92, Superior: 91 },
  { mes: "Oct", Inicial: 93, Elemental: 92, Media: 90, Superior: 89 },
  { mes: "Nov", Inicial: 91, Elemental: 90, Media: 88, Superior: 86 },
  { mes: "Dic", Inicial: 94, Elemental: 92, Media: 89, Superior: 88 },
  { mes: "Ene", Inicial: 90, Elemental: 88, Media: 85, Superior: 83 },
  { mes: "Feb", Inicial: 92, Elemental: 91, Media: 87, Superior: 86 },
];

// 7. CASOS DE ALERTA TEMPRANA PARA EL RECTORADO / DECE (< 7.0 / DESERCIÓN)
export const DECE_RISK_STUDENTS: RiskStudentReport[] = [
  {
    id: "risk-01",
    name: "Camila Andrea Pillajo Alomoto",
    grade: "5to EGB",
    parallel: "A",
    promedio: 5.07,
    asistencia: 65,
    nivelRiesgo: "critico",
    causaRiesgo: "Ausentismo recurrente sin justificación médica ni de los padres. Calificaciones bajo la media mínima institucional.",
    seguimientoDECE: "Cita presencial con representante legal y compromiso pedagógico de nivelación.",
    tutor: "Lic. María Elena Guamán",
    telefonoContacto: "0991283746",
  },
  {
    id: "risk-02",
    name: "Evelyn Nicole Cuichán Ramos",
    grade: "5to EGB",
    parallel: "A",
    promedio: 4.43,
    asistencia: 58,
    nivelRiesgo: "critico",
    causaRiesgo: "Riesgo inminente de abandono escolar por situación socioeconómica vulnerable en zona alta de Lloa.",
    seguimientoDECE: "Visita domiciliaria del trabajador social y activación de apoyo con kits escolares y bienestar rural.",
    tutor: "Lic. María Elena Guamán",
    telefonoContacto: "0996781290",
  },
  {
    id: "risk-03",
    name: "Jostyn Alexander Quishpe Guamán",
    grade: "5to EGB",
    parallel: "A",
    promedio: 6.5,
    asistencia: 74,
    nivelRiesgo: "moderado",
    causaRiesgo: "Dificultad de cálculo en Matemáticas y retraso en entrega de cuadernos de trabajo.",
    seguimientoDECE: "Plan de refuerzo pedagógico en contraturno y seguimiento con docente tutor.",
    tutor: "Lic. María Elena Guamán",
    telefonoContacto: "0987345612",
  },
  {
    id: "risk-04",
    name: "Dayana Marisol Tipán Cando",
    grade: "5to EGB",
    parallel: "A",
    promedio: 6.93,
    asistencia: 78,
    nivelRiesgo: "moderado",
    causaRiesgo: "Promedio limítrofe (6.93). A punto de alcanzar el puntaje requerido de 7.00.",
    seguimientoDECE: "Refuerzo escolar en biblioteca y tutoría entre pares.",
    tutor: "Lic. María Elena Guamán",
    telefonoContacto: "0994857123",
  },
  {
    id: "risk-05",
    name: "Carlos Mateo Simbaña Pilatasig",
    grade: "7mo EGB",
    parallel: "B",
    promedio: 5.8,
    asistencia: 69,
    nivelRiesgo: "critico",
    causaRiesgo: "Pérdida de evaluaciones trimestrales en Matemáticas e Historia. Problemas de conectividad en casa.",
    seguimientoDECE: "Atención individualizada por el DECE distrital y entrega de material impreso físico.",
    tutor: "Lic. Rosa Elvira Chiluisa",
    telefonoContacto: "0985551234",
  },
  {
    id: "risk-06",
    name: "Mateo Sebastián Toapanta Pillajo",
    grade: "5to EGB",
    parallel: "A",
    promedio: 8.77,
    asistencia: 96,
    nivelRiesgo: "estable",
    causaRiesgo: "Desempeño académico satisfactorio y asistencia regular constante.",
    seguimientoDECE: "Felicitación académica al representante y estudiante en cuadro de honor.",
    tutor: "Lic. María Elena Guamán",
    telefonoContacto: "0984123891",
  },
];
