import { ShieldCheck } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <ShieldCheck className="mx-auto mb-5 h-12 w-12 animate-pulse text-cyan-300" />
        <h1 className="text-3xl font-black">Loading VeyraSec...</h1>
        <p className="mt-3 text-slate-400">Preparing your page securely.</p>
      </div>
    </main>
  );
}
