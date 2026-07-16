"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/route-access";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function requestVerifiedPaidReportAction(formData: FormData) {
  const scanId = clean(formData.get("scan_id"));
  const customerMessage = clean(formData.get("customer_message"));

  if (!scanId) {
    redirect("/dashboard/scans?message=Scan is required");
  }

  const { supabase, user, profile } = await requireDashboardUser();

  let scanQuery = supabase
    .from("scan_results")
    .select("id, user_id")
    .eq("id", scanId);

  if (profile.role !== "admin") {
    scanQuery = scanQuery.eq("user_id", user.id);
  }

  const { data: scan } = await scanQuery.maybeSingle();

  if (!scan) {
    redirect("/dashboard/scans?message=Scan not found");
  }

  const ownerId = String(scan.user_id || user.id);

  const { data: existingRequest } = await supabase
    .from("verified_report_requests")
    .select("id, status")
    .eq("scan_result_id", scan.id)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (existingRequest) {
    redirect(
      `/dashboard/scans/${scan.id}/verified-report?message=Verified report request already exists`,
    );
  }

  const { error } = await supabase.from("verified_report_requests").insert({
    user_id: ownerId,
    scan_result_id: scan.id,
    status: "requested",
    customer_message: customerMessage || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/dashboard/scans/${scan.id}/verified-report?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/dashboard/scans/${scan.id}/verified-report`);
  revalidatePath("/dashboard/admin/verified-reports");

  redirect(
    `/dashboard/scans/${scan.id}/verified-report?message=Verified paid report requested`,
  );
}
