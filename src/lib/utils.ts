import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGrade(num: number): string {
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

export function getMinEducGradeScale(grade: number): {
  code: "DAR" | "AAR" | "PAAR" | "NAAR";
  label: string;
  badgeClass: string;
  textClass: string;
} {
  if (grade >= 9.0) {
    return {
      code: "DAR",
      label: "Domina los Aprendizajes (DAR)",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      textClass: "text-emerald-700 font-semibold",
    };
  } else if (grade >= 7.0) {
    return {
      code: "AAR",
      label: "Alcanza los Aprendizajes (AAR)",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      textClass: "text-blue-700 font-semibold",
    };
  } else if (grade >= 4.01) {
    return {
      code: "PAAR",
      label: "Próximo a Alcanzar (PAAR)",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      textClass: "text-amber-700 font-semibold",
    };
  } else {
    return {
      code: "NAAR",
      label: "No Alcanza los Aprendizajes (NAAR)",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      textClass: "text-rose-700 font-semibold",
    };
  }
}

export function getAttendanceIndicator(percentage: number): {
  label: string;
  badgeClass: string;
} {
  if (percentage >= 85) {
    return {
      label: "Asistencia Regular",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  } else if (percentage >= 75) {
    return {
      label: "Alerta de Inasistencia",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  } else {
    return {
      label: "Riesgo de Abandono",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
}
