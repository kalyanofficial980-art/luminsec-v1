import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black">Page not found</h1>
        <p className="mt-4 leading-8 text-slate-300">
          The page you are looking for does not exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 hover:bg-cyan-200"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border border-white/10 px-5 py-3 font-black text-white hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}


