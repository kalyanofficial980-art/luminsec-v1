import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthLevel = "healthy" | "warning" | "error";

export type HealthCheck = {
  name: string;
  level: HealthLevel;
  message: string;
  detail?: string;
};

export type CountResult = {
  label: string;
  count: number | null;
  level: HealthLevel;
  message: string;
};

export function healthRank(level: HealthLevel) {
  if (level === "healthy") return 3;
  if (level === "warning") return 2;
  return 1;
}

export function overallHealth(checks: HealthCheck[]) {
  if (checks.some((check) => check.level === "error")) {
    return "error";
  }

  if (checks.some((check) => check.level === "warning")) {
    return "warning";
  }

  return "healthy";
}

export function envCheck(name: string, value: string | undefined): HealthCheck {
  if (value && value.trim().length > 0) {
    return {
      name,
      level: "healthy",
      message: "Configured",
    };
  }

  return {
    name,
    level: "error",
    message: "Missing",
    detail: "Add this environment variable in Vercel and local .env.local.",
  };
}

export async function safeCount(
  supabase: SupabaseClient,
  table: string,
  label: string,
  options?: {
    userId?: string;
    userScoped?: boolean;
  }
): Promise<CountResult> {
  let query = supabase.from(table).select("id", {
    count: "exact",
    head: true,
  });

  if (options?.userScoped && options.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { count, error } = await query;

  if (error) {
    return {
      label,
      count: null,
      level: "warning",
      message: error.message,
    };
  }

  return {
    label,
    count: count ?? 0,
    level: "healthy",
    message: "Reachable",
  };
}

export function countToCheck(result: CountResult): HealthCheck {
  return {
    name: result.label,
    level: result.level,
    message:
      result.count === null
        ? "Table check returned a warning"
        : `${result.count} record${result.count === 1 ? "" : "s"} found`,
    detail: result.message,
  };
}