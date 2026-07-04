import type { ReactNode } from "react";
import { requireFeatureAccess } from "@/lib/subscription/feature-access";

export default async function ShareReportLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireFeatureAccess("public_share");

  return <>{children}</>;
}