import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe2, Plus, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";

export default async function WebsitesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: websites, error } = await supabase
    .from("websites")
    .select("id, url, domain, label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/app"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
                <ShieldCheck className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-3xl font-black">Websites</h1>
                <p className="text-slate-400">{brand.name} website workspace</p>
              </div>
            </div>
          </div>

          <Link
            href="/app/websites/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
          >
            <Plus className="h-5 w-5" />
            Add website
          </Link>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-6 text-red-100">
            {error.message}
          </div>
        ) : null}

        {!websites || websites.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <Globe2 className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
            <h2 className="text-2xl font-bold">No websites yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-400">
              Add your first business website. In Part 4, we will connect passive scanner workflow.
            </p>
            <Link
              href="/app/websites/new"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-200"
            >
              <Plus className="h-5 w-5" />
              Add first website
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {websites.map((website) => (
              <div
                key={website.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Globe2 className="h-5 w-5 text-cyan-300" />
                      <h2 className="text-xl font-bold">
                        {website.label || website.domain}
                      </h2>
                    </div>
                    <p className="break-all text-slate-300">{website.url}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Added {new Date(website.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300">
                    Scanner in Part 4
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
