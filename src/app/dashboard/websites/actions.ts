"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeWebsiteUrl } from "@/lib/utils/url";
import { runPassiveScan } from "@/lib/scanner/passive";

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
    redirect(`/dashboard/websites/new?message=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("websites").insert({
    user_id: user.id,
    url: normalized.url,
    domain: normalized.domain,
    label: label || null,
  });

  if (error) {
    redirect(`/dashboard/websites/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");

  redirect("/dashboard/websites");
}

export async function startPassiveScan(formData: FormData) {
  const websiteId = String(formData.get("website_id") ?? "");

  if (!websiteId) {
    redirect("/dashboard/websites?message=Website ID missing");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, url, domain")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .single();

  if (websiteError || !website) {
    redirect("/dashboard/websites?message=Website not found");
  }

  const { data: scanJob, error: jobError } = await supabase
    .from("scan_jobs")
    .insert({
      website_id: website.id,
      user_id: user.id,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !scanJob) {
    redirect(
      `/dashboard/websites?message=${encodeURIComponent(
        jobError?.message ?? "Could not create scan job"
      )}`
    );
  }

  let scanResultId = "";

  try {
    const scan = await runPassiveScan(website.url);

    const { data: scanResult, error: resultError } = await supabase
      .from("scan_results")
      .insert({
        scan_job_id: scanJob.id,
        website_id: website.id,
        user_id: user.id,
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

    if (resultError || !scanResult) {
      throw new Error(resultError?.message ?? "Could not save scan result");
    }

    scanResultId = scanResult.id;

    if (scan.findings.length > 0) {
      const { error: findingsError } = await supabase.from("scan_findings").insert(
        scan.findings.map((finding) => ({
          scan_result_id: scanResult.id,
          user_id: user.id,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          recommendation: finding.recommendation,
          evidence: finding.evidence ?? {},
        }))
      );

      if (findingsError) {
        throw new Error(findingsError.message);
      }
    }

    await supabase
      .from("scan_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanJob.id)
      .eq("user_id", user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";

    await supabase
      .from("scan_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanJob.id)
      .eq("user_id", user.id);

    redirect(`/dashboard/websites?message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath(`/dashboard/scans/${scanResultId}`);

  redirect(`/dashboard/scans/${scanResultId}`);
}
