import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe2, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { addWebsite } from "../actions";

export default async function NewWebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/websites"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to websites
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Add website</h1>
              <p className="text-slate-400">
                Add a business website to your {brand.name} workspace.
              </p>
            </div>
          </div>

          {params.message ? (
            <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              {params.message}
            </div>
          ) : null}

          <form action={addWebsite} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Website URL
              </label>
              <div className="relative">
                <Globe2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  name="url"
                  type="text"
                  required
                  placeholder="example.com or https://example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-12 py-4 text-white outline-none focus:border-cyan-300"
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                V1 will save this website. Passive scanning starts in Part 4.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Label optional
              </label>
              <input
                name="label"
                type="text"
                placeholder="Client name, business name, or project label"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Save website
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
