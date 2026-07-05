"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-button"
    >
      <Printer size={16} />
      Print / Save PDF
    </button>
  );
}