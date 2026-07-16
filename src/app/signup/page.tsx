import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { signup } from "./actions";
import { brand } from "@/config/brand";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create {brand.name} account</h1>
            <p className="text-sm text-slate-400">
              Start your V1 security readiness workspace.
            </p>
          </div>
        </div>

        {params.message ? (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
            {params.message}
          </div>
        ) : null}

        <form action={signup} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Full name
            </label>
            <input
              name="full_name"
              type="text"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have account?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
