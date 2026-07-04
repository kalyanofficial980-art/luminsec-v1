"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function submitContactLead(formData: FormData) {
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const companyName = clean(formData.get("company_name"));
  const websiteUrl = clean(formData.get("website_url"));
  const leadType = clean(formData.get("lead_type")) || "contact";
  const message = clean(formData.get("message"));
  const source = clean(formData.get("source")) || "website";

  if (!name || !email) {
    redirect("/contact?message=Name and email are required");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_leads").insert({
    name,
    email,
    phone: phone || null,
    company_name: companyName || null,
    website_url: websiteUrl || null,
    lead_type: leadType,
    message: message || null,
    source,
    status: "new",
  });

  if (error) {
    redirect(`/contact?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/contact?message=Thanks. Your request was submitted successfully.");
}

export async function submitPilotLead(formData: FormData) {
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const companyName = clean(formData.get("company_name"));
  const websiteUrl = clean(formData.get("website_url"));
  const leadType = clean(formData.get("lead_type")) || "pilot";
  const message = clean(formData.get("message"));
  const source = clean(formData.get("source")) || "pilot-page";

  if (!name || !email || !websiteUrl) {
    redirect("/pilot?message=Name, email, and website URL are required");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_leads").insert({
    name,
    email,
    phone: phone || null,
    company_name: companyName || null,
    website_url: websiteUrl,
    lead_type: leadType,
    message: message || null,
    source,
    status: "new",
  });

  if (error) {
    redirect(`/pilot?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/pilot?message=Pilot request submitted. We will review your website and contact you.");
}