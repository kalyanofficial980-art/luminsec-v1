import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/route-access";

export default async function LaunchChecklistLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return <>{children}</>;
}