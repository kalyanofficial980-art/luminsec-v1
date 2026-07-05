"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="max-w-xl rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-200">
          Error
        </p>
        <h1 className="mt-4 text-4xl font-black">Something went wrong</h1>
        <p className="mt-4 leading-8 text-red-50/90">
          Please try again. If the problem continues, contact support with the page you were using.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-red-200 px-5 py-3 font-black text-slate-950 hover:bg-red-100"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-red-200/20 px-5 py-3 font-black text-white hover:bg-red-200/10"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}