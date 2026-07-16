import type { ReactNode } from "react";
import { requireFeatureAccess } from "@/lib/subscription/feature-access";

export default async function PdfReportLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireFeatureAccess("pdf_reports");

  return <>{children}</>;
}
