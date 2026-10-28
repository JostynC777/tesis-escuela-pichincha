# Escuela de Educación Básica "Pichincha" (Lloa, Quito)
## Sistema de Gestión Escolar, Calificaciones Trimestrales & Analítica de Deserción

> **Institución Fiscal de Educación General Básica (EGB)**  
> **Ubicación:** Parroquia Rural Lloa, Cantón Quito, Provincia de Pichincha, Ecuador  
> **Distrito Educativo:** 17D01 | Código AMIE: 17H01429  
> **Tecnologías:** Next.js (App Router), TypeScript, Tailwind CSS (Diseño institucional luminoso), Lucide React, Recharts.

---

## 🚀 Inicio Rápido

Para ejecutar el servidor local de desarrollo:

```bash
npm run dev
```

Abra su navegador en: [http://localhost:3000](http://localhost:3000)

Para compilar para producción:

```bash
npm run build
npm run start
```

---

## 🏛️ Áreas Funcionales del Sistema

### 1. Portal Público (`/`)
- **Identidad Institucional:** Escuela de Educación Básica "Pichincha", ubicada en las faldas del volcán Guagua Pichincha en la parroquia rural de Lloa.
- **Sección de Comunicados para Padres de Familia (`NewsAndEvents.tsx`):** Avisos oficiales sobre entrega de libretas trimestrales, programa de alimentación escolar MinEduc (leche y colación), mingas comunitarias de padres y campañas de vacunación infantil con el Centro de Salud de Lloa.
- **Información sobre los Niveles de Educación Básica (`AcademicOffering.tsx`):**
  - *Educación Inicial y Preparatoria (4 a 5 años)*
  - *Básica Elemental (2do a 4to Grado EGB - 6 a 8 años)*
  - *Básica Media (5to a 7mo Grado EGB - 9 a 11 años)*
  - *Básica Superior (8vo a 10mo Grado EGB - 12 a 14 años)*
- **Consulta de Matrícula Escolar (`CertificateValidator.tsx`):** Verificación rápida de la matrícula ordinaria por número de cédula del estudiante.
- **Portal de Acceso Seguro:** Enlace visible y destacado hacia `/login`.

---

### 2. Panel Administrativo y Docente (`/login` y `/dashboard`)

#### 🔐 Acceso al Portal (`/login`)
Acceso rápido en 1 clic para demostración:
- 👨‍🏫 **Docente Tutora:** Lic. María Elena Guamán (5to Grado EGB "A")
- 🏛️ **Rectorado / Dirección:** Mgs. Gonzalo Tipán
- 👨‍👩‍👦 **Padre de Familia / Representante:** Sr. Segundo Toapanta

#### 📝 Módulo de Calificaciones Trimestrales (`/dashboard/teacher`)
- **Tabla de Notas sobre 10 puntos:** Desglose por **1er Trimestre**, **2do Trimestre**, **3er Trimestre** y **Promedio Anual** con cálculo automático.
- **Escala Oficial MinEduc Ecuador:**
  - 🟢 **DAR** (9.00 - 10.00 pts): Domina los Aprendizajes Requeridos.
  - 🔵 **AAR** (7.00 - 8.99 pts): Alcanza los Aprendizajes Requeridos.
  - 🟡 **PAAR** (4.01 - 6.99 pts): Próximo a Alcanzar los Aprendizajes (*Alerta de Refuerzo Pedagógico*).
  - 🔴 **NAAR** (≤ 4.00 pts): No Alcanza los Aprendizajes (*Riesgo Crítico*).
- **Modal de Edición Interactiva:** Permite modificar notas de los trimestres con recálculo en tiempo real del promedio anual.

#### 📱 Módulo de Asistencia QR (`/dashboard/teacher`)
- Generador dinámico de código QR para la toma rápida de asistencia matutina en el aula.
- PIN de respaldo manual de 4 dígitos.
- Registro en un clic de *Presente*, *Atraso* y *Falta* con reporte a Inspección.

#### 📊 Analítica de Riesgo & Rectorado (`/dashboard/analytics`)
- **Visualizaciones con Recharts:**
  - `BarChart`: Promedio general de la escuela por asignatura (Matemáticas, Lengua y Literatura, Ciencias Naturales, Estudios Sociales, etc.) vs. la meta mínima de aprobación del MinEduc (7.00 pts).
  - `AreaChart`: Evolución mensual de asistencia por subnivel escolar (Inicial, Elemental, Media, Superior).
- **Sistema de Alerta Temprana de Deserción Escolar (< 7.0/10):**
  - Semáforo (*Rojo / Amarillo / Verde*) para identificar a niñas y niños en riesgo académico o de abandono en la parroquia rural.
  - Botones de acción institucional: *"Activar Visita Domiciliaria DECE"*, *"Plan de Refuerzo de Tareas"* y *"Reconocimiento a la Familia"*.

---

## 🎨 Paleta de Colores
- **Diseño Institucional Luminoso:** Blancos puros (`#FFFFFF`), fondos grises claros (`#F8FAFC`, `#F1F5F9`), textos legibles en azul marino y gris oscuro (`#0F172A`, `#1E293B`).
- **Azules Institucionales:** `#1E3A8A`, `#1D4ED8`, `#2563EB`, `#EFF6FF`.
- **Acentos Funcionales:** Esmeralda (`#059669`), Ámbar (`#D97706`) y Rojo carmesí (`#DC2626`).
- **Modo Oscuro:** Desactivado por defecto.
