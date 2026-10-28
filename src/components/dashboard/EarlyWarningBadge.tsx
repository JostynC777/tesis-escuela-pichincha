import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface EarlyWarningBadgeProps {
  level: "critico" | "moderado" | "estable" | "normal" | "danger" | "warning" | "safe";
  label?: string;
  showIcon?: boolean;
}

export function EarlyWarningBadge({ level, label, showIcon = true }: EarlyWarningBadgeProps) {
  const isRed = level === "critico" || level === "danger";
  const isYellow = level === "moderado" || level === "warning";

  if (isRed) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
        <span>{label || "Riesgo Crítico (< 7.0)"}</span>
      </span>
    );
  }

  if (isYellow) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
        <span>{label || "Riesgo Moderado"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
      <span>{label || "Desempeño Regular (≥ 8.0)"}</span>
    </span>
  );
}
