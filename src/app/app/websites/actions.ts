"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeWebsiteUrl } from "@/lib/utils/url";

export async function addWebsite(formData: FormData) {
  const rawUrl = String(formData.get("url") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let normalized;

  try {
    normalized = normalizeWebsiteUrl(rawUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid website URL";
    redirect(`/app/websites/new?message=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("websites").insert({
    user_id: user.id,
    url: normalized.url,
    domain: normalized.domain,
    label: label || null,
  });

  if (error) {
    redirect(`/app/websites/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/websites");

  redirect("/app/websites");
}
