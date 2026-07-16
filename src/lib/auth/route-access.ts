import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfile, type DashboardProfile } from "@/lib/auth/profile";
import { userCanAccessFeature } from "@/lib/subscription/feature-access";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type DashboardAuthContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
    email?: string;
  };
  profile: DashboardProfile;
};

export function getDashboardHomeForProfile(_profile: DashboardProfile) {
  return "/dashboard";
}

export async function requireDashboardUser(): Promise<DashboardAuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, business_name, website_url, role, account_type, onboarding_completed",
    )
    .eq("id", user.id)
    .maybeSingle();

  const profile = normalizeProfile(profileData);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? undefined,
    },
    profile,
  };
}

export async function requireAdmin() {
  const context = await requireDashboardUser();

  if (context.profile.role !== "admin") {
    redirect("/dashboard/upgrade-required?feature=admin");
  }

  return context;
}

export async function requireAgencyAccess() {
  const context = await requireDashboardUser();

  if (context.profile.role === "admin") {
    return context;
  }

  const allowed = await userCanAccessFeature(
    context.supabase,
    context.user.id,
    "agency_mode",
  );

  if (!allowed) {
    redirect("/dashboard/upgrade-required?feature=agency_mode");
  }

  return context;
}


