import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/route-access";

export default async function AccessAuditLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return <>{children}</>;
}