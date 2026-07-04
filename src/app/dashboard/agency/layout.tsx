import type { ReactNode } from "react";
import { requireAgencyAccess } from "@/lib/auth/route-access";

export default async function AgencyOnlyLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAgencyAccess();

  return <>{children}</>;
}