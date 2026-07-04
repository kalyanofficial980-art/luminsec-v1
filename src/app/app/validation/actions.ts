"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCustomerFeedback(formData: FormData) {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const contactChannel = String(formData.get("contact_channel") ?? "").trim();
  const leadType = String(formData.get("lead_type") ?? "").trim();
  const status = String(formData.get("status") ?? "not_contacted").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const objection = String(formData.get("objection") ?? "").trim();
  const nextStep = String(formData.get("next_step") ?? "").trim();
  const isPaidPilot = formData.get("is_paid_pilot") === "on";

  if (!businessName) {
    redirect("/app/validation?message=Business name is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("customer_feedback").insert({
    user_id: user.id,
    business_name: businessName,
    website_url: websiteUrl || null,
    contact_channel: contactChannel || null,
    lead_type: leadType || null,
    status,
    feedback: feedback || null,
    objection: objection || null,
    next_step: nextStep || null,
    is_paid_pilot: isPaidPilot,
  });

  if (error) {
    redirect(`/app/validation?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/validation");

  redirect("/app/validation?message=Customer validation note saved");
}