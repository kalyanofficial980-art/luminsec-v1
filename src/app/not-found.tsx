import Link from "next/link";
import { ArrowLeft, SearchX, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <SearchX className="mx-auto mb-5 h-14 w-14 text-cyan-300" />
        <h1 className="text-4xl font-black">Page not found</h1>

        <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-300">
          This page does not exist or the link is no longer available.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
          >
            <ShieldCheck className="h-5 w-5" />
            Open dashboard
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}