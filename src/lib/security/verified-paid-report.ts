export type VerifiedReportStatus =
  "requested" | "in_review" | "approved" | "rejected" | "delivered" | "none";

export type VerifiedReportReadiness = {
  status: VerifiedReportStatus;
  label: string;
  readyForDelivery: boolean;
  approvedFindingCount: number;
  pendingFindingCount: number;
  rejectedFindingCount: number;
  totalFindingCount: number;
  verifiedPercent: number;
  notes: string[];
};

function text(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function normalizeVerifiedReportStatus(
  value: unknown,
): VerifiedReportStatus {
  const status = text(value).toLowerCase();

  if (status === "requested") return "requested";
  if (status === "in_review") return "in_review";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "delivered") return "delivered";

  return "none";
}

export function verifiedReportStatusLabel(value: unknown) {
  const status = normalizeVerifiedReportStatus(value);

  const labels: Record<VerifiedReportStatus, string> = {
    requested: "Requested",
    in_review: "In review",
    approved: "Approved",
    rejected: "Rejected",
    delivered: "Delivered",
    none: "Not requested",
  };

  return labels[status];
}

export function verifiedReportStatusClass(value: unknown) {
  const status = normalizeVerifiedReportStatus(value);

  if (status === "approved" || status === "delivered") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/10 text-red-100";
  }

  if (status === "requested" || status === "in_review") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-slate-400/30 bg-slate-400/10 text-slate-200";
}

export function calculateVerifiedReportReadiness(input: {
  requestStatus?: unknown;
  totalFindingCount: number;
  approvedFindingCount: number;
  pendingFindingCount: number;
  rejectedFindingCount: number;
}): VerifiedReportReadiness {
  const status = normalizeVerifiedReportStatus(input.requestStatus);
  const totalFindingCount = Math.max(0, Number(input.totalFindingCount) || 0);
  const approvedFindingCount = Math.max(
    0,
    Number(input.approvedFindingCount) || 0,
  );
  const pendingFindingCount = Math.max(
    0,
    Number(input.pendingFindingCount) || 0,
  );
  const rejectedFindingCount = Math.max(
    0,
    Number(input.rejectedFindingCount) || 0,
  );

  const verifiedPercent =
    totalFindingCount > 0
      ? Math.round((approvedFindingCount / totalFindingCount) * 100)
      : 0;

  const readyForDelivery =
    (status === "approved" || status === "delivered") &&
    approvedFindingCount > 0 &&
    pendingFindingCount === 0;

  const notes = [
    "Verified paid reports should include only findings approved in manual review.",
    "Pending and rejected findings should not be presented as verified evidence.",
    "Approval means the report evidence was reviewed, not that the business is legally certified.",
    "This workflow is for paid pilot delivery, not payment collection, GST handling, or legal compliance certification.",
  ];

  return {
    status,
    label: verifiedReportStatusLabel(status),
    readyForDelivery,
    approvedFindingCount,
    pendingFindingCount,
    rejectedFindingCount,
    totalFindingCount,
    verifiedPercent,
    notes,
  };
}


