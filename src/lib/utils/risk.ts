export function getRiskLabel(riskLevel: string | null | undefined) {
  const labels: Record<string, string> = {
    good: "Good",
    needs_improvement: "Needs improvement",
    risky: "Risky",
    high_risk: "High risk",
    unknown: "Unknown",
  };

  return labels[riskLevel ?? "unknown"] ?? "Unknown";
}

export function getRiskBadgeClass(riskLevel: string | null | undefined) {
  const classes: Record<string, string> = {
    good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    needs_improvement: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    risky: "border-orange-400/30 bg-orange-400/10 text-orange-100",
    high_risk: "border-red-400/30 bg-red-400/10 text-red-100",
    unknown: "border-slate-400/30 bg-slate-400/10 text-slate-100",
  };

  return classes[riskLevel ?? "unknown"] ?? classes.unknown;
}

export function getScoreText(score: number | null | undefined) {
  if (typeof score !== "number") return "--";
  return String(score);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString();
}
