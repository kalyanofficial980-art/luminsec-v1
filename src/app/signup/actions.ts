"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const signupAttempts = new Map<string,{count:number,time:number}>();

export async function signup(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const now = Date.now();
  const limit = signupAttempts.get(email);

  if (limit && now - limit.time < 10 * 60 * 1000 && limit.count >= 5) {
    redirect("/signup?message=Too many signup attempts. Try again later.");
  }

  signupAttempts.set(email,{
    count: limit ? limit.count + 1 : 1,
    time: now
  });

  if (!email || !password) {
    redirect("/signup?message=Email and password are required");
  }

  if (password.length < 6) {
    redirect("/signup?message=Password must be at least 6 characters");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.APP_URL}/auth/callback`,
    },
  });

  if (error) {

    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      redirect(
      "/signup?message=Unable to create account. Please try another email."
    );
    }

    redirect(
      "/signup?message=Signup failed. Please try again later."
    );
  }

  redirect("/verify-email?message=Account created. Verify your email before login.");
}


