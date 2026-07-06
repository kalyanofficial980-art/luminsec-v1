"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/route-access";

const allowedStatuses = ["requested", "in_review", "approved", "rejected", "delivered"] as const;

type VerifiedReportAdminStatus = (typeof allowedStatuses)[number];

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function updateVerifiedReportRequestAction(formData: FormData) {
  const requestId = clean(formData.get("request_id"));
  const status = clean(formData.get("status")) as VerifiedReportAdminStatus;
  const adminNotes = clean(formData.get("admin_notes"));

  if (!requestId || !allowedStatuses.includes(status)) {
    redirect("/dashboard/admin/verified-reports?message=Request and valid status are required");
  }

  const { supabase, user } = await requireAdmin();

  const updatePayload: Record<string, string | null> = {
    status,
    admin_notes: adminNotes || null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    delivered_at: status === "delivered" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("verified_report_requests")
    .update(updatePayload)
    .eq("id", requestId);

  if (error) {
    redirect(`/dashboard/admin/verified-reports?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/admin/verified-reports");
  revalidatePath("/dashboard/scans");

  redirect(`/dashboard/admin/verified-reports?message=${encodeURIComponent(`Verified report marked ${status}`)}`);
}