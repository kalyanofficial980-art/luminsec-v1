"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveBusinessSettings(formData: FormData) {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const ownerName = String(formData.get("owner_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const reportFooterNote = String(formData.get("report_footer_note") ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("business_settings").upsert(
    {
      user_id: user.id,
      business_name: businessName || null,
      owner_name: ownerName || null,
      email: email || user.email || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      report_footer_note: reportFooterNote || null,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    redirect(`/dashboard/settings?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/scans");

  redirect("/dashboard/settings?message=Settings saved successfully");
}