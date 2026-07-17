import { updatePassword } from "./actions";

export default function ResetPassword({
searchParams,
}:{
searchParams:{message?:string}
}){

return(
<form action={updatePassword}
className="min-h-screen flex flex-col gap-4 items-center justify-center">

<h1 className="text-3xl font-bold">
New password
</h1>

{searchParams.message && <p>{searchParams.message}</p>}

<input
name="password"
type="password"
placeholder="New password"
className="border p-3 rounded"
/>

<button className="bg-cyan-400 px-6 py-3 rounded">
Update password
</button>

</form>
);

}
