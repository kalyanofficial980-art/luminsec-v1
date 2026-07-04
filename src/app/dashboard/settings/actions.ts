"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireDashboardUser } from "@/lib/auth/route-access";

const allowedAccountTypes = ["small_business", "freelancer_agency", "testing"];

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeWebsiteUrl(input: string) {
  const raw = input.trim();

  if (!raw) {
    return null;
  }

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS website URLs are supported");
  }

  url.hash = "";

  return url.toString();
}

export async function updateProfileSettings(formData: FormData) {
  const fullName = clean(formData.get("full_name"));
  const businessName = clean(formData.get("business_name"));
  const websiteUrlInput = clean(formData.get("website_url"));
  const accountType = clean(formData.get("account_type"));

  if (!allowedAccountTypes.includes(accountType)) {
    redirect("/dashboard/settings?message=Please choose a valid account type");
  }

  let websiteUrl: string | null = null;

  try {
    websiteUrl = normalizeWebsiteUrl(websiteUrlInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid website URL";
    redirect(`/dashboard/settings?message=${encodeURIComponent(message)}`);
  }

  const { supabase, user } = await requireDashboardUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      business_name: businessName || null,
      website_url: websiteUrl,
      account_type: accountType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard/settings?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  redirect("/dashboard/settings?message=Profile settings updated");
}

export async function updateReportSettings(formData: FormData) {
  const businessName = clean(formData.get("report_business_name"));
  const reportPreparedBy = clean(formData.get("report_prepared_by"));
  const contactEmail = clean(formData.get("contact_email"));
  const phone = clean(formData.get("phone"));
  const website = clean(formData.get("website"));
  const address = clean(formData.get("address"));
  const footerNote = clean(formData.get("footer_note"));

  const { supabase, user } = await requireDashboardUser();

  const { error } = await supabase
    .from("business_settings")
    .upsert(
      {
        user_id: user.id,
        business_name: businessName || null,
        report_prepared_by: reportPreparedBy || null,
        contact_email: contactEmail || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        footer_note: footerNote || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    redirect(`/dashboard/settings?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/scans");

  redirect("/dashboard/settings?message=Report settings updated");
}