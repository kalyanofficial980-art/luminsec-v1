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

export async function addAgencyClient(formData: FormData) {
  const clientName = clean(formData.get("client_name"));
  const contactName = clean(formData.get("contact_name"));
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const website = clean(formData.get("website"));
  const businessType = clean(formData.get("business_type"));
  const status = clean(formData.get("status")) || "prospect";
  const monthlyValue = numberValue(formData.get("monthly_value"));
  const notes = clean(formData.get("notes"));

  if (!clientName) {
    redirect("/dashboard/agency?message=Client name is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("agency_clients").insert({
    user_id: user.id,
    client_name: clientName,
    contact_name: contactName || null,
    email: email || null,
    phone: phone || null,
    website: website || null,
    business_type: businessType || null,
    status,
    monthly_value: monthlyValue,
    notes: notes || null,
  });

  if (error) {
    redirect(`/dashboard/agency?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agency");

  redirect("/dashboard/agency?message=Agency client saved");
}

export async function updateAgencyClient(formData: FormData) {
  const clientId = clean(formData.get("client_id"));
  const status = clean(formData.get("status")) || "prospect";
  const monthlyValue = numberValue(formData.get("monthly_value"));
  const notes = clean(formData.get("notes"));

  if (!clientId) {
    redirect("/dashboard/agency?message=Client is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("agency_clients")
    .update({
      status,
      monthly_value: monthlyValue,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/agency?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agency");

  redirect("/dashboard/agency?message=Agency client updated");
}

export async function assignWebsiteToClient(formData: FormData) {
  const websiteId = clean(formData.get("website_id"));
  const clientId = clean(formData.get("agency_client_id"));

  if (!websiteId) {
    redirect("/dashboard/agency?message=Website is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("websites")
    .update({
      agency_client_id: clientId || null,
    })
    .eq("id", websiteId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/agency?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/agency");
  revalidatePath("/dashboard/websites");

  redirect("/dashboard/agency?message=Website assignment updated");
}