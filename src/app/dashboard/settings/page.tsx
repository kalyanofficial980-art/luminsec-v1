import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { brand } from "@/config/brand";
import { createClient } from "@/lib/supabase/server";
import { saveBusinessSettings } from "./actions";

export default async function SettingsPage({
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

  const { data: settings } = await supabase
    .from("business_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">SaaS settings</h1>
              <p className="text-slate-400">
                Business profile details for {brand.name} reports
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Add your business or agency details here. These details will appear inside
            scan reports and printable PDF reports, making VeyraSec look more professional
            for clients and pilot customers.
          </p>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form action={saveBusinessSettings} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Business profile</h2>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Business / Agency name</span>
                <input
                  name="business_name"
                  defaultValue={settings?.business_name ?? ""}
                  placeholder="Example: VeyraSec Labs"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Owner / Founder name</span>
                <input
                  name="owner_name"
                  defaultValue={settings?.owner_name ?? ""}
                  placeholder="Example: Kalyan Kumar"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={settings?.email ?? user.email ?? ""}
                    placeholder="hello@example.com"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Phone</span>
                  <input
                    name="phone"
                    defaultValue={settings?.phone ?? ""}
                    placeholder="+91 90000 00000"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Business website</span>
                <input
                  name="website"
                  defaultValue={settings?.website ?? ""}
                  placeholder="https://yourbusiness.com"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Address / Location</span>
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={settings?.address ?? ""}
                  placeholder="City, State, Country"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-300">Report footer note</span>
                <textarea
                  name="report_footer_note"
                  rows={4}
                  defaultValue={settings?.report_footer_note ?? ""}
                  placeholder="Example: Prepared for client review. This report is based on safe passive checks only."
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200"
              >
                <CheckCircle2 className="h-5 w-5" />
                Save settings
              </button>
            </div>
          </form>

          <section className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black text-cyan-100">Report preview details</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <Building2 className="h-5 w-5" />
                  <p className="font-bold">Business</p>
                </div>
                <p className="text-cyan-50/90">{settings?.business_name || "Not added yet"}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <User className="h-5 w-5" />
                  <p className="font-bold">Owner</p>
                </div>
                <p className="text-cyan-50/90">{settings?.owner_name || "Not added yet"}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <Mail className="h-5 w-5" />
                  <p className="font-bold">Email</p>
                </div>
                <p className="break-all text-cyan-50/90">{settings?.email || user.email}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <Phone className="h-5 w-5" />
                  <p className="font-bold">Phone</p>
                </div>
                <p className="text-cyan-50/90">{settings?.phone || "Not added yet"}</p>
              </div>

              <div className="rounded-2xl bg-slate-950/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <MapPin className="h-5 w-5" />
                  <p className="font-bold">Location</p>
                </div>
                <p className="text-cyan-50/90">{settings?.address || "Not added yet"}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-slate-950/70 p-5 text-sm leading-7 text-cyan-50/80">
              These details will be shown in scan reports and PDF print pages.
            </div>

            <Link
              href="/dashboard/scans"
              className="mt-6 inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 px-5 py-3 font-bold text-cyan-100 hover:bg-cyan-300/10"
            >
              Open reports
            </Link>
          </section>
        </section>
      </div>
    </main>
  );
}