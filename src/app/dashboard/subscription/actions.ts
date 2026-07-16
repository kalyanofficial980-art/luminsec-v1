"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function requestPlanChange(formData: FormData) {
  const planId = clean(formData.get("plan_id"));
  const message = clean(formData.get("message"));

  if (!planId) {
    redirect("/dashboard/subscription?message=Plan is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) {
    redirect("/dashboard/subscription?message=Plan not found");
  }

  const { error } = await supabase.from("subscription_requests").insert({
    user_id: user.id,
    requested_plan_id: planId,
    message: message || null,
    status: "pending",
  });

  if (error) {
    redirect(
      `/dashboard/subscription?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");

  redirect(
    "/dashboard/subscription?message=Plan request submitted. Upgrade is manual for now.",
  );
}
