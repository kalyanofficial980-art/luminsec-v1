"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enablePublicReport(formData: FormData) {
  const scanId = String(formData.get("scan_id") ?? "").trim();

  if (!scanId) {
    redirect("/dashboard/scans");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scan, error: scanError } = await supabase
    .from("scan_results")
    .select("id, public_share_id")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (scanError || !scan) {
    redirect("/dashboard/scans");
  }

  const shareId = scan.public_share_id || crypto.randomUUID();

  const { error } = await supabase
    .from("scan_results")
    .update({
      is_public: true,
      public_share_id: shareId,
    })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/scans/${scanId}/share?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/scans/${scanId}`);
  revalidatePath(`/dashboard/scans/${scanId}/share`);
  revalidatePath(`/reports/${shareId}`);

  redirect(`/dashboard/scans/${scanId}/share?message=Public report link enabled`);
}

export async function disablePublicReport(formData: FormData) {
  const scanId = String(formData.get("scan_id") ?? "").trim();

  if (!scanId) {
    redirect("/dashboard/scans");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scan } = await supabase
    .from("scan_results")
    .select("public_share_id")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("scan_results")
    .update({
      is_public: false,
    })
    .eq("id", scanId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/scans/${scanId}/share?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/scans/${scanId}`);
  revalidatePath(`/dashboard/scans/${scanId}/share`);

  if (scan?.public_share_id) {
    revalidatePath(`/reports/${scan.public_share_id}`);
  }

  redirect(`/dashboard/scans/${scanId}/share?message=Public report link disabled`);
}