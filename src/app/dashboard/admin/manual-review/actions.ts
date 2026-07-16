"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/route-access";

const allowedStatuses = ["pending", "approved", "rejected"] as const;

type ReviewStatus = (typeof allowedStatuses)[number];

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function updateFindingManualReviewAction(formData: FormData) {
  const findingId = cleanText(formData.get("finding_id"));
  const status = cleanText(
    formData.get("manual_review_status"),
  ) as ReviewStatus;
  const notes = cleanText(formData.get("manual_review_notes"));

  if (!findingId || !allowedStatuses.includes(status)) {
    redirect(
      "/dashboard/admin/manual-review?message=Finding and valid review status are required",
    );
  }

  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("scan_findings")
    .update({
      manual_review_status: status,
      manual_review_notes: notes || null,
      manual_reviewed_by: user.id,
      manual_reviewed_at: new Date().toISOString(),
      verified_for_paid_report: status === "approved",
    })
    .eq("id", findingId);

  if (error) {
    redirect(
      `/dashboard/admin/manual-review?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard/admin/manual-review");

  redirect(
    `/dashboard/admin/manual-review?message=${encodeURIComponent(`Finding marked ${status}`)}`,
  );
}
