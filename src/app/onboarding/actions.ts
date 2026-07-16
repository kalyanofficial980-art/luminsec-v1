"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function completeOnboarding(formData: FormData) {
  const fullName = clean(formData.get("full_name"));
  const businessName = clean(formData.get("business_name"));
  const websiteUrlInput = clean(formData.get("website_url"));
  const accountType = clean(formData.get("account_type"));

  if (!allowedAccountTypes.includes(accountType)) {
    redirect("/onboarding?message=Please choose your account type");
  }

  let websiteUrl: string | null = null;

  try {
    websiteUrl = normalizeWebsiteUrl(websiteUrlInput);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid website URL";
    redirect(`/onboarding?message=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName || null,
    business_name: businessName || null,
    website_url: websiteUrl,
    account_type: accountType,
    onboarding_completed: true,
    role: "user",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/onboarding?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  redirect("/dashboard");
}


