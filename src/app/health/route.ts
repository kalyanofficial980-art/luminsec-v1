import { NextResponse } from "next/server";
import { brand } from "@/config/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  const requiredEnvironment = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    APP_URL: Boolean(process.env.APP_URL),
  };

  const healthy = Object.values(requiredEnvironment).every(Boolean);

  return NextResponse.json(
    {
      app: brand.name,
      version: brand.version,
      status: healthy ? "ok" : "degraded",
      requiredEnvironment,
      checkedAt: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 500,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}