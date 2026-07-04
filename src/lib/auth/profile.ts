export type UserRole = "user" | "admin";
export type AccountType = "small_business" | "freelancer_agency" | "testing" | null;

export type DashboardProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  website_url: string | null;
  role: UserRole;
  account_type: AccountType;
  onboarding_completed: boolean;
};

export function accountTypeLabel(accountType: AccountType) {
  if (accountType === "small_business") return "Small business";
  if (accountType === "freelancer_agency") return "Freelancer / agency";
  if (accountType === "testing") return "Testing";
  return "Not selected";
}

export function isAdmin(profile: Pick<DashboardProfile, "role"> | null | undefined) {
  return profile?.role === "admin";
}

export function isAgencyAccount(profile: Pick<DashboardProfile, "account_type" | "role"> | null | undefined) {
  return profile?.account_type === "freelancer_agency" || profile?.role === "admin";
}

export function normalizeProfile(input: Partial<DashboardProfile> | null | undefined): DashboardProfile | null {
  if (!input?.id) {
    return null;
  }

  return {
    id: input.id,
    email: input.email ?? null,
    full_name: input.full_name ?? null,
    business_name: input.business_name ?? null,
    website_url: input.website_url ?? null,
    role: input.role === "admin" ? "admin" : "user",
    account_type:
      input.account_type === "small_business" ||
      input.account_type === "freelancer_agency" ||
      input.account_type === "testing"
        ? input.account_type
        : null,
    onboarding_completed: Boolean(input.onboarding_completed),
  };
}