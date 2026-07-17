"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function forgotPassword(formData: FormData) {

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();


  if (!email) {
    redirect("/forgot-password?message=Email is required");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${process.env.APP_URL}/reset-password`,
    }
  );

  // Always return same response to prevent email enumeration
  redirect(
    "/forgot-password?message=If that email exists, a reset link has been sent"
  );
}
