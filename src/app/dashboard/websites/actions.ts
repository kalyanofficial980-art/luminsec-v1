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
  url.hostname = url.hostname.toLowerCase();

  return url.toString();
}

function getDomain(input: string) {
  const url = new URL(input);
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevelFromScore(score: number) {
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

function normalizeRiskLevel(value: unknown, score: number) {
  const raw = String(value ?? "").toLowerCase();

  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("moderate")) return "medium";
  if (raw.includes("low")) return "low";

  return riskLevelFromScore(score);
}

function normalizeSeverity(value: unknown) {
  const raw = String(value ?? "info").toLowerCase();

  if (raw.includes("critical")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("moderate")) return "medium";
  if (raw.includes("low")) return "low";

  return "info";
}

export async function addWebsite(formData: FormData) {
  const name = clean(formData.get("name"));
  const websiteUrlInput = clean(formData.get("url"));

  let normalizedUrl = "";

  try {
    normalizedUrl = normalizeWebsiteUrl(websiteUrlInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid website URL";
    redirect(`/dashboard/websites/new?message=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const websiteDomain = getDomain(normalizedUrl);
  const websiteName = name || websiteDomain;

  const { data: existingWebsite } = await supabase
    .from("websites")
    .select("id")
    .eq("user_id", user.id)
    .eq("domain", websiteDomain)
    .maybeSingle();

  if (existingWebsite) {
    redirect("/dashboard/websites?message=Website already exists");
  }

  const isAdminUser = await getUserIsAdmin(supabase, user.id);

  if (!isAdminUser) {
    const access = await getUserSubscriptionAccess(supabase, user.id);
    const usage = await getUserUsageCounts(supabase, user.id);
    const decision = canAddWebsite(access, usage);

    if (!decision.allowed) {
      redirect(`/dashboard/subscription?message=${encodeLimitMessage(decision.message)}`);
    }
  }

  const { error } = await supabase.from("websites").insert({
    user_id: user.id,
    name: websiteName,
    url: normalizedUrl,
    domain: websiteDomain,
    status: "active",
  });

  if (error) {
    redirect(`/dashboard/websites/new?message=${encodeURIComponent(error.message)}`);
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
      redirect(`/dashboard/subscription?message=${encodeLimitMessage(decision.message)}`);
    }
  }

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, name, url, domain")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (websiteError || !website) {
    redirect("/dashboard/websites?message=Website not found");
  }

  let scan;

  try {
    scan = await runPassiveScan(website.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    redirect(`/dashboard/websites?message=${encodeURIComponent(message)}`);
  }

  const websiteDomain = website.domain || getDomain(website.url);
  const overallScore = clampScore(scan.overallScore);
  const securityScore = clampScore(scan.securityScore);
  const privacyScore = clampScore(scan.privacyScore);
  const trustScore = clampScore(scan.trustScore);
  const riskLevel = normalizeRiskLevel(scan.riskLevel, overallScore);

  const { data: scanResult, error: scanError } = await supabase
    .from("scan_results")
    .insert({
      user_id: user.id,
      website_id: website.id,
      scan_job_id: crypto.randomUUID(),
      url: website.url,
      domain: websiteDomain,
      status: "completed",
      overall_score: overallScore,
      score: overallScore,
      security_score: securityScore,
      privacy_score: privacyScore,
      trust_score: trustScore,
      risk_level: riskLevel,
      summary: scan.summary || "Passive website trust scan completed.",
      raw_result: scan.raw || {},
      raw: scan.raw || {},
      is_public: false,
    })
    .select("id")
    .single();

  if (scanError || !scanResult) {
    redirect(`/dashboard/websites?message=${encodeURIComponent(scanError?.message || "Scan could not be saved")}`);
  }

  if (scan.findings.length > 0) {
    const findingRows = scan.findings.map((finding) => ({
      user_id: user.id,
      website_id: website.id,
      scan_result_id: scanResult.id,
      scan_id: scanResult.id,
      category: String(finding.category || "general").toLowerCase(),
      severity: normalizeSeverity(finding.severity),
      title: finding.title || "Finding",
      description: finding.description || null,
      recommendation: finding.recommendation || null,
      evidence: finding.evidence || null,
    }));

    const { error: findingsError } = await supabase
      .from("scan_findings")
      .insert(findingRows);

    if (findingsError) {
      redirect(`/dashboard/scans/${scanResult.id}?message=${encodeURIComponent(findingsError.message)}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath("/dashboard/scans");
  revalidatePath("/dashboard/subscription");
  revalidatePath(`/dashboard/websites/${website.id}`);

  redirect(`/dashboard/scans/${scanResult.id}`);
}