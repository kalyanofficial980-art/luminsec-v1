"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/route-access";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function nextMonthIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export async function approveSubscriptionRequest(formData: FormData) {
  const requestId = clean(formData.get("request_id"));

  if (!requestId) {
    redirect("/dashboard/admin/subscriptions?message=Request is required");
  }

  const { supabase } = await requireAdmin();

  const { data: request, error: requestError } = await supabase
    .from("subscription_requests")
    .select("id, user_id, requested_plan_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    redirect(
      "/dashboard/admin/subscriptions?message=Subscription request not found",
    );
  }

  if (request.status !== "pending") {
    redirect(
      "/dashboard/admin/subscriptions?message=Request already processed",
    );
  }

  const { error: subscriptionError } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: request.user_id,
        plan_id: request.requested_plan_id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: nextMonthIso(),
        scans_used_this_period: 0,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (subscriptionError) {
    redirect(
      `/dashboard/admin/subscriptions?message=${encodeURIComponent(subscriptionError.message)}`,
    );
  }

  const { error: updateRequestError } = await supabase
    .from("subscription_requests")
    .update({
      status: "approved",
    })
    .eq("id", requestId);

  if (updateRequestError) {
    redirect(
      `/dashboard/admin/subscriptions?message=${encodeURIComponent(updateRequestError.message)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/admin/subscriptions");

  redirect(
    "/dashboard/admin/subscriptions?message=Subscription request approved",
  );
}

export async function rejectSubscriptionRequest(formData: FormData) {
  const requestId = clean(formData.get("request_id"));

  if (!requestId) {
    redirect("/dashboard/admin/subscriptions?message=Request is required");
  }

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("subscription_requests")
    .update({
      status: "rejected",
    })
    .eq("id", requestId);

  if (error) {
    redirect(
      `/dashboard/admin/subscriptions?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard/admin/subscriptions");

  redirect(
    "/dashboard/admin/subscriptions?message=Subscription request rejected",
  );
}

export async function manuallySetSubscription(formData: FormData) {
  const userId = clean(formData.get("user_id"));
  const planId = clean(formData.get("plan_id"));
  const status = clean(formData.get("status"));

  const allowedStatuses = [
    "trial",
    "active",
    "past_due",
    "cancelled",
    "expired",
  ];

  if (!userId || !planId || !allowedStatuses.includes(status)) {
    redirect(
      "/dashboard/admin/subscriptions?message=User, plan, and valid status are required",
    );
  }

  const { supabase } = await requireAdmin();

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("id", planId)
    .maybeSingle();

  if (!plan) {
    redirect("/dashboard/admin/subscriptions?message=Plan not found");
  }

  const periodEnd =
    status === "active" || status === "trial" ? nextMonthIso() : null;

  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      status,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    redirect(
      `/dashboard/admin/subscriptions?message=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard/admin/subscriptions");

  redirect(
    "/dashboard/admin/subscriptions?message=Subscription updated manually",
  );
}


