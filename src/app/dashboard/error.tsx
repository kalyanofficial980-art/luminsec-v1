"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-300/20 bg-red-300/10 p-8 text-center">
        <AlertTriangle className="mx-auto mb-5 h-14 w-14 text-red-200" />
        <h1 className="text-4xl font-black">Dashboard could not load</h1>

        <p className="mx-auto mt-4 max-w-2xl leading-8 text-red-50/90">
          This can happen if a table is missing, an environment variable is missing,
          or Supabase returned an error. Try again or open production status.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-red-100/70">Error reference: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-bold text-slate-950 hover:bg-slate-100"
          >
            <RefreshCcw className="h-5 w-5" />
            Try again
          </button>

          <Link
            href="/dashboard/status"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
          >
            <ShieldCheck className="h-5 w-5" />
            Production status
          </Link>
        </div>
      </div>
    </main>
  );
}