export type ComparableFinding = {
  title: string;
  category?: string | null;
  severity?: string | null;
  description?: string | null;
  recommendation?: string | null;
};

export type ScoreComparison = {
  overallChange: number;
  securityChange: number;
  privacyChange: number;
  trustChange: number;
};

export type FindingComparison = {
  newFindings: ComparableFinding[];
  fixedFindings: ComparableFinding[];
  unchangedFindings: ComparableFinding[];
};

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function compareScores(current: {
  overall_score?: number | null;
  security_score?: number | null;
  privacy_score?: number | null;
  trust_score?: number | null;
}, previous: {
  overall_score?: number | null;
  security_score?: number | null;
  privacy_score?: number | null;
  trust_score?: number | null;
}): ScoreComparison {
  return {
    overallChange: Number(current.overall_score ?? 0) - Number(previous.overall_score ?? 0),
    securityChange: Number(current.security_score ?? 0) - Number(previous.security_score ?? 0),
    privacyChange: Number(current.privacy_score ?? 0) - Number(previous.privacy_score ?? 0),
    trustChange: Number(current.trust_score ?? 0) - Number(previous.trust_score ?? 0),
  };
}

export function compareFindings(
  currentFindings: ComparableFinding[],
  previousFindings: ComparableFinding[]
): FindingComparison {
  const currentMap = new Map(
    currentFindings.map((finding) => [normalizeTitle(finding.title), finding])
  );

  const previousMap = new Map(
    previousFindings.map((finding) => [normalizeTitle(finding.title), finding])
  );

  const newFindings = currentFindings.filter(
    (finding) => !previousMap.has(normalizeTitle(finding.title))
  );

  const fixedFindings = previousFindings.filter(
    (finding) => !currentMap.has(normalizeTitle(finding.title))
  );

  const unchangedFindings = currentFindings.filter(
    (finding) => previousMap.has(normalizeTitle(finding.title))
  );

  return {
    newFindings,
    fixedFindings,
    unchangedFindings,
  };
}

export function changeLabel(change: number) {
  if (change > 0) return `+${change}`;
  return String(change);
}

export function changeTone(change: number) {
  if (change > 0) return "improved";
  if (change < 0) return "dropped";
  return "unchanged";
}