"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resendVerification(formData:FormData){

const email = String(
formData.get("email") ?? ""
).trim();

if(!email){
redirect("/verify-email?message=Email required");
}

const supabase = await createClient();

const {error}=await supabase.auth.resend({
type:"signup",
email,
});

if(error){
redirect(
"/verify-email?message="+encodeURIComponent(error.message)
);
}

redirect(
"/verify-email?message=Verification email sent"
);

}
