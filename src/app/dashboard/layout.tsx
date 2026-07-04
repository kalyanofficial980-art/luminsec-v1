import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile } from "@/lib/auth/profile";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, email, full_name, business_name, website_url, role, account_type, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const profile = normalizeProfile(profileData);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}