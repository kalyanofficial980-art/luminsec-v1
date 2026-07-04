"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "0").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function addCustomerFeedback(formData: FormData) {
  const businessName = clean(formData.get("business_name"));
  const websiteUrl = clean(formData.get("website_url"));
  const contactChannel = clean(formData.get("contact_channel"));
  const leadType = clean(formData.get("lead_type"));
  const leadSource = clean(formData.get("lead_source"));
  const status = clean(formData.get("status")) || "not_contacted";
  const priority = clean(formData.get("priority")) || "medium";
  const expectedValue = numberValue(formData.get("expected_value"));
  const followUpDate = clean(formData.get("follow_up_date"));
  const objectionType = clean(formData.get("objection_type"));
  const feedback = clean(formData.get("feedback"));
  const objection = clean(formData.get("objection"));
  const nextStep = clean(formData.get("next_step"));
  const isPaidPilot = formData.get("is_paid_pilot") === "on";
  const demoCompleted = formData.get("demo_completed") === "on";
  const testimonialReceived = formData.get("testimonial_received") === "on";

  if (!businessName) {
    redirect("/dashboard/validation?message=Business name is required");
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
    lead_source: leadSource || null,
    status,
    priority,
    expected_value: expectedValue,
    follow_up_date: followUpDate || null,
    objection_type: objectionType || null,
    feedback: feedback || null,
    objection: objection || null,
    next_step: nextStep || null,
    is_paid_pilot: isPaidPilot,
    demo_completed: demoCompleted,
    testimonial_received: testimonialReceived,
    last_contacted_at: status === "contacted" || status === "replied" ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(`/dashboard/validation?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/validation");

  redirect("/dashboard/validation?message=CRM lead saved");
}

export async function updateLeadStatus(formData: FormData) {
  const leadId = clean(formData.get("lead_id"));
  const status = clean(formData.get("status"));
  const nextStep = clean(formData.get("next_step"));
  const followUpDate = clean(formData.get("follow_up_date"));
  const isPaidPilot = formData.get("is_paid_pilot") === "on";
  const demoCompleted = formData.get("demo_completed") === "on";
  const testimonialReceived = formData.get("testimonial_received") === "on";

  if (!leadId || !status) {
    redirect("/dashboard/validation?message=Lead and status are required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("customer_feedback")
    .update({
      status,
      next_step: nextStep || null,
      follow_up_date: followUpDate || null,
      is_paid_pilot: isPaidPilot,
      demo_completed: demoCompleted,
      testimonial_received: testimonialReceived,
      last_contacted_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/validation?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/validation");

  redirect("/dashboard/validation?message=Lead updated");
}