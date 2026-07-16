"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runPassiveScan } from "@/lib/scanner/passive";
import {
  canAddWebsite,
  canRunScan,
  encodeLimitMessage,
  getUserIsAdmin,
  getUserSubscriptionAccess,
  getUserUsageCounts,
} from "@/lib/subscription/enforce";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeWebsiteUrl(input: string) {
  const raw = input.trim();

  if (!raw) {
    throw new Error("Website URL is required");
  }

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS websites are supported");
  }

  url.hash = "";

  return url.toString();
}

export async function addWebsite(formData: FormData) {
  const name = clean(formData.get("name"));
  const websiteUrlInput = clean(formData.get("url"));

  let normalizedUrl = "";

  try {
    normalizedUrl = normalizeWebsiteUrl(websiteUrlInput);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid website URL";
    redirect(`/dashboard/websites/new?message=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdminUser = await getUserIsAdmin(supabase, user.id);

  if (!isAdminUser) {
    const access = await getUserSubscriptionAccess(supabase, user.id);
    const usage = await getUserUsageCounts(supabase, user.id);
    const decision = canAddWebsite(access, usage);

    if (!decision.allowed) {
      redirect(
        `/dashboard/subscription?message=${encodeLimitMessage(decision.message)}`,
      );
    }
  }

  const urlObject = new URL(normalizedUrl);
  const websiteName = name || urlObject.hostname;

  const { error } = await supabase.from("websites").insert({
    user_id: user.id,
    name: websiteName,
    url: normalizedUrl,
  });

  if (error) {
    redirect(
      `/dashboard/websites/new?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/agency");

  redirect("/dashboard/websites?message=Website added");
}

export async function startPassiveScan(formData: FormData) {
  const websiteId = clean(formData.get("website_id"));

  if (!websiteId) {
    redirect("/dashboard/websites?message=Website is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdminUser = await getUserIsAdmin(supabase, user.id);

  if (!isAdminUser) {
    const access = await getUserSubscriptionAccess(supabase, user.id);
    const usage = await getUserUsageCounts(supabase, user.id);
    const decision = canRunScan(access, usage);

    if (!decision.allowed) {
      redirect(
        `/dashboard/subscription?message=${encodeLimitMessage(decision.message)}`,
      );
    }
  }

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, url")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (websiteError || !website) {
    redirect("/dashboard/websites?message=Website not found");
  }

  const scan = await runPassiveScan(website.url);

  const { data: scanResult, error: scanError } = await supabase
    .from("scan_results")
    .insert({
      user_id: user.id,
      website_id: website.id,
      overall_score: scan.overallScore,
      security_score: scan.securityScore,
      privacy_score: scan.privacyScore,
      trust_score: scan.trustScore,
      risk_level: scan.riskLevel,
      summary: scan.summary,
      raw_result: scan.raw,
    })
    .select("id")
    .single();

  if (scanError || !scanResult) {
    redirect(
      `/dashboard/websites?message=${encodeURIComponent(scanError?.message || "Scan could not be saved")}`,
    );
  }

  if (scan.findings.length > 0) {
    const findingRows = scan.findings.map((finding) => ({
      scan_result_id: scanResult.id,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation,
      evidence: finding.evidence || null,
    }));

    const { error: findingsError } = await supabase
      .from("scan_findings")
      .insert(findingRows);

    if (findingsError) {
      redirect(
        `/dashboard/scans/${scanResult.id}?message=${encodeURIComponent(findingsError.message)}`,
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath("/dashboard/scans");
  revalidatePath("/dashboard/subscription");
  revalidatePath(`/dashboard/websites/${website.id}`);

  redirect(`/dashboard/scans/${scanResult.id}`);
}


