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

export async function addManualPayment(formData: FormData) {
  const customerFeedbackId = clean(formData.get("customer_feedback_id"));
  const payerName = clean(formData.get("payer_name"));
  const payerEmail = clean(formData.get("payer_email"));
  const payerPhone = clean(formData.get("payer_phone"));
  const amount = numberValue(formData.get("amount"));
  const currency = clean(formData.get("currency")) || "INR";
  const paymentMethod = clean(formData.get("payment_method")) || "upi";
  const paymentStatus = clean(formData.get("payment_status")) || "pending";
  const paymentReference = clean(formData.get("payment_reference"));
  const paymentDate = clean(formData.get("payment_date"));
  const dueDate = clean(formData.get("due_date"));
  const notes = clean(formData.get("notes"));

  if (!payerName) {
    redirect("/dashboard/payments?message=Payer name is required");
  }

  if (amount <= 0) {
    redirect("/dashboard/payments?message=Amount must be greater than zero");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("manual_payments").insert({
    user_id: user.id,
    customer_feedback_id: customerFeedbackId || null,
    payer_name: payerName,
    payer_email: payerEmail || null,
    payer_phone: payerPhone || null,
    amount,
    currency,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    payment_reference: paymentReference || null,
    payment_date: paymentDate || null,
    due_date: dueDate || null,
    notes: notes || null,
  });

  if (error) {
    redirect(`/dashboard/payments?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");

  redirect("/dashboard/payments?message=Manual payment saved");
}

export async function updateManualPaymentStatus(formData: FormData) {
  const paymentId = clean(formData.get("payment_id"));
  const paymentStatus = clean(formData.get("payment_status"));
  const paymentReference = clean(formData.get("payment_reference"));
  const paymentDate = clean(formData.get("payment_date"));
  const notes = clean(formData.get("notes"));

  if (!paymentId || !paymentStatus) {
    redirect("/dashboard/payments?message=Payment and status are required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("manual_payments")
    .update({
      payment_status: paymentStatus,
      payment_reference: paymentReference || null,
      payment_date: paymentDate || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/payments?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");

  redirect("/dashboard/payments?message=Payment updated");
}