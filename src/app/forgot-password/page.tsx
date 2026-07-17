
import { forgotPassword } from "./actions";

export default function ForgotPassword({
searchParams,
}:{
searchParams: {message?:string}
}) {
return (
<main className="min-h-screen flex items-center justify-center">
<form action={forgotPassword} className="space-y-4">
<h1 className="text-3xl font-bold">
Reset password
</h1>

{searchParams.message && (
<p>{searchParams.message}</p>
)}

<input
name="email"
type="email"
placeholder="Email"
className="border p-3 rounded"
/>

<button className="bg-cyan-400 px-6 py-3 rounded">
Send reset link
</button>

</form>
</main>
);
}
