import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  IndianRupee,
  Link2,
  Plus,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/risk";
import { addAgencyClient, assignWebsiteToClient, updateAgencyClient } from "./actions";

type AgencyClient = {
  id: string;
  client_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  business_type: string | null;
  status: string;
  monthly_value: number | null;
  notes: string | null;
  created_at: string;
};

type WebsiteRow = {
  id: string;
  agency_client_id: string | null;
  name: string | null;
  url: string;
  created_at: string;
};

type ScanRow = {
  id: string;
  website_id: string | null;
  overall_score: number | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  prospect: "Prospect",
  demo: "Demo",
  pilot: "Pilot",
  active: "Active client",
  paused: "Paused",
  lost: "Lost",
};

const statusClasses: Record<string, string> = {
  prospect: "border-slate-400/20 bg-slate-400/10 text-slate-200",
  demo: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  pilot: "border-purple-400/20 bg-purple-400/10 text-purple-100",
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  paused: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  lost: "border-red-400/20 bg-red-400/10 text-red-100",
};

function money(value: number | null | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function scoreClass(score: number) {
  if (score >= 80) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (score >= 60) return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  return "border-red-400/20 bg-red-400/10 text-red-100";
}

export default async function AgencyPage({
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

  const { data: clientsData, error: clientsError } = await supabase
    .from("agency_clients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: websitesData } = await supabase
    .from("websites")
    .select("id, agency_client_id, name, url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: scansData } = await supabase
    .from("scan_results")
    .select("id, website_id, overall_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const clients = (clientsData ?? []) as AgencyClient[];
  const websites = (websitesData ?? []) as WebsiteRow[];
  const scans = (scansData ?? []) as ScanRow[];

  const latestScanByWebsite = new Map<string, ScanRow>();

  for (const scan of scans) {
    if (scan.website_id && !latestScanByWebsite.has(scan.website_id)) {
      latestScanByWebsite.set(scan.website_id, scan);
    }
  }

  const activeClients = clients.filter((client) => client.status === "active").length;
  const pilotClients = clients.filter((client) => client.status === "pilot").length;
  const pipelineValue = clients.reduce((total, client) => total + Number(client.monthly_value ?? 0), 0);
  const linkedWebsites = websites.filter((website) => website.agency_client_id).length;
  const unassignedWebsites = websites.filter((website) => !website.agency_client_id);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/30">
              <BriefcaseBusiness className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Agency mode</h1>
              <p className="text-slate-400">
                Manage clients, websites, reports, and pilots from one agency workspace.
              </p>
            </div>
          </div>

          <p className="max-w-3xl leading-8 text-slate-300">
            Use agency mode when you sell VeyraSec reports to multiple small businesses,
            freelancers, or web agency clients. Link each website to a client and track
            client status from prospect to active.
          </p>
        </section>

        {params.message ? (
          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-cyan-100">
            {params.message}
          </div>
        ) : null}

        {clientsError ? (
          <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-300/10 p-5 text-red-100">
            {clientsError.message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Users className="mb-4 h-6 w-6 text-cyan-300" />
            <p className="text-sm text-slate-400">Total clients</p>
            <p className="mt-2 text-3xl font-black">{clients.length}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
            <CheckCircle2 className="mb-4 h-6 w-6" />
            <p className="text-sm opacity-80">Active</p>
            <p className="mt-2 text-3xl font-black">{activeClients}</p>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5 text-purple-100">
            <Target className="mb-4 h-6 w-6" />
            <p className="text-sm opacity-80">Pilots</p>
            <p className="mt-2 text-3xl font-black">{pilotClients}</p>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-100">
            <Globe2 className="mb-4 h-6 w-6" />
            <p className="text-sm opacity-80">Linked websites</p>
            <p className="mt-2 text-3xl font-black">{linkedWebsites}</p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
            <IndianRupee className="mb-4 h-6 w-6" />
            <p className="text-sm opacity-80">Pipeline value</p>
            <p className="mt-2 text-3xl font-black">{money(pipelineValue)}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-8">
            <form action={addAgencyClient} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center gap-3">
                <Plus className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Add agency client</h2>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Client name *</span>
                  <input name="client_name" placeholder="Example: ABC Dental Clinic" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Contact name</span>
                    <input name="contact_name" placeholder="Owner / manager name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Business type</span>
                    <input name="business_type" placeholder="Clinic / agency / coaching" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Email</span>
                    <input name="email" type="email" placeholder="client@example.com" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Phone</span>
                    <input name="phone" placeholder="+91..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Website</span>
                  <input name="website" placeholder="https://example.com" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Status</span>
                    <select name="status" defaultValue="prospect" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                      <option value="prospect">Prospect</option>
                      <option value="demo">Demo</option>
                      <option value="pilot">Pilot</option>
                      <option value="active">Active client</option>
                      <option value="paused">Paused</option>
                      <option value="lost">Lost</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-300">Monthly value</span>
                    <input name="monthly_value" type="number" min="0" placeholder="999" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Notes</span>
                  <textarea name="notes" rows={3} placeholder="Example: Wants monthly trust reports for 5 websites." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                </label>

                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 hover:bg-cyan-200">
                  <CheckCircle2 className="h-5 w-5" />
                  Save client
                </button>
              </div>
            </form>

            <form action={assignWebsiteToClient} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center gap-3">
                <Link2 className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Link website to client</h2>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Website</span>
                  <select name="website_id" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="">Select website</option>
                    {websites.map((website) => (
                      <option key={website.id} value={website.id}>
                        {website.name || website.url}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-300">Agency client</span>
                  <select name="agency_client_id" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                    <option value="">Unassigned</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_name}
                      </option>
                    ))}
                  </select>
                </label>

                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 font-bold text-white hover:bg-white/10">
                  <Link2 className="h-5 w-5" />
                  Update website assignment
                </button>
              </div>
            </form>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <div className="mb-6 flex items-center gap-3">
                <Globe2 className="h-7 w-7 text-cyan-300" />
                <h2 className="text-3xl font-black">Unassigned websites</h2>
              </div>

              {unassignedWebsites.length === 0 ? (
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
                  All websites are assigned to clients.
                </p>
              ) : (
                <div className="grid gap-3">
                  {unassignedWebsites.map((website) => (
                    <Link
                      key={website.id}
                      href={`/dashboard/websites/${website.id}`}
                      className="rounded-2xl border border-white/10 bg-slate-950 p-4 hover:bg-white/[0.05]"
                    >
                      <p className="font-bold text-white">{website.name || website.url}</p>
                      <p className="mt-1 break-all text-sm text-slate-500">{website.url}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-cyan-300" />
              <h2 className="text-3xl font-black">Client board</h2>
            </div>

            {clients.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                <BriefcaseBusiness className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                <h3 className="text-xl font-black">No agency clients yet</h3>
                <p className="mt-2 text-slate-400">
                  Add your first agency client, then link websites to that client.
                </p>
              </div>
            ) : (
              <div className="grid gap-5">
                {clients.map((client) => {
                  const clientWebsites = websites.filter((website) => website.agency_client_id === client.id);

                  return (
                    <div key={client.id} className="rounded-3xl border border-white/10 bg-slate-950 p-6">
                      <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-black">{client.client_name}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[client.status] ?? statusClasses.prospect}`}>
                              {statusLabels[client.status] ?? client.status}
                            </span>
                          </div>

                          <p className="text-sm text-slate-400">
                            {client.business_type || "Business"} · Added {formatDateTime(client.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
                          <p className="text-xs opacity-80">Monthly value</p>
                          <p className="text-2xl font-black">{money(client.monthly_value)}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                        {client.contact_name ? <p><span className="font-bold text-white">Contact:</span> {client.contact_name}</p> : null}
                        {client.email ? <p><span className="font-bold text-white">Email:</span> {client.email}</p> : null}
                        {client.phone ? <p><span className="font-bold text-white">Phone:</span> {client.phone}</p> : null}
                        {client.website ? <p className="break-all"><span className="font-bold text-white">Website:</span> {client.website}</p> : null}
                      </div>

                      {client.notes ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="mb-2 font-bold text-white">Notes</p>
                          <p className="text-sm leading-6 text-slate-400">{client.notes}</p>
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="font-bold text-white">Linked websites</p>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                            {clientWebsites.length}
                          </span>
                        </div>

                        {clientWebsites.length === 0 ? (
                          <p className="text-sm text-slate-500">No websites linked yet.</p>
                        ) : (
                          <div className="grid gap-3">
                            {clientWebsites.map((website) => {
                              const latestScan = latestScanByWebsite.get(website.id);
                              const latestScore = Number(latestScan?.overall_score ?? 0);

                              return (
                                <div key={website.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                    <div>
                                      <Link href={`/dashboard/websites/${website.id}`} className="font-bold text-white hover:text-cyan-300">
                                        {website.name || website.url}
                                      </Link>
                                      <p className="mt-1 break-all text-xs text-slate-500">{website.url}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {latestScan ? (
                                        <Link
                                          href={`/dashboard/scans/${latestScan.id}`}
                                          className={`rounded-full border px-3 py-1 text-xs font-bold ${scoreClass(latestScore)}`}
                                        >
                                          {latestScore}/100
                                        </Link>
                                      ) : (
                                        <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-bold text-slate-200">
                                          No scan
                                        </span>
                                      )}

                                      <Link
                                        href={`/dashboard/websites/${website.id}`}
                                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-cyan-300"
                                      >
                                        Open
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <form action={updateAgencyClient} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <input type="hidden" name="client_id" value={client.id} />

                        <div className="grid gap-3 md:grid-cols-3">
                          <select name="status" defaultValue={client.status} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300">
                            <option value="prospect">Prospect</option>
                            <option value="demo">Demo</option>
                            <option value="pilot">Pilot</option>
                            <option value="active">Active client</option>
                            <option value="paused">Paused</option>
                            <option value="lost">Lost</option>
                          </select>

                          <input name="monthly_value" type="number" min="0" defaultValue={Number(client.monthly_value ?? 0)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />

                          <button type="submit" className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                            Update client
                          </button>
                        </div>

                        <textarea name="notes" rows={2} defaultValue={client.notes ?? ""} placeholder="Notes" className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Link
            href="/dashboard/websites"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <Globe2 className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Websites</h2>
            <p className="mt-3 text-slate-400">Add and scan customer websites.</p>
          </Link>

          <Link
            href="/dashboard/scans"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <FileText className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Reports</h2>
            <p className="mt-3 text-slate-400">Open scan reports and PDF pages.</p>
          </Link>

          <Link
            href="/dashboard/payments"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.07]"
          >
            <IndianRupee className="mb-4 h-7 w-7 text-cyan-300" />
            <h2 className="text-2xl font-black">Payments</h2>
            <p className="mt-3 text-slate-400">Track paid pilots manually.</p>
          </Link>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-8">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-amber-200" />
            <h2 className="text-2xl font-black text-amber-100">Agency mode note</h2>
          </div>

          <p className="max-w-4xl leading-8 text-amber-50/90">
            Agency mode is only for managing clients and passive website trust reports.
            It is not a penetration testing platform, not an automated vulnerability scanner,
            and not a legal compliance certification system.
          </p>
        </section>
      </div>
    </main>
  );
}