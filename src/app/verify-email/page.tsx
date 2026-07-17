import Link from "next/link";
import { resendVerification } from "./actions";

export default function VerifyEmail({
 searchParams,
}:{
 searchParams:{message?:string}
}){

return (
<main className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
<div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 space-y-5">

<h1 className="text-3xl font-bold">
Verify your email
</h1>

<p className="text-slate-300">
Check your inbox and confirm your email address before logging in.
</p>

{searchParams.message && (
<div className="rounded-xl bg-cyan-400/10 border border-cyan-300/20 p-3 text-cyan-200">
{searchParams.message}
</div>
)}

<form action={resendVerification} className="space-y-3">
<input
name="email"
type="email"
placeholder="your@email.com"
className="w-full rounded-xl bg-slate-900 border border-white/10 px-4 py-3"
/>

<button
className="w-full rounded-xl bg-cyan-300 text-slate-950 px-4 py-3 font-bold"
>
Resend verification email
</button>

</form>

<Link
href="/login"
className="block text-center text-cyan-300"
>
Back to login
</Link>

</div>
</main>
);
}
