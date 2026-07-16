"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200 print:hidden"
    >
      <Printer className="h-5 w-5" />
      Download PDF
    </button>
  );
}


