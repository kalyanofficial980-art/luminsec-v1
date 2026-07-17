import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeRedirect(path:string){
  if(
    path.startsWith("/") &&
    !path.startsWith("//")
  ){
    return path;
  }

  return "/dashboard/start";
}

export async function GET(request: Request) {

  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const redirectTo = safeRedirect(
    requestUrl.searchParams.get("redirect_to") ?? "/dashboard/start"
  );


  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?message=Invalid authentication link",
        request.url
      )
    );
  }


  const supabase = await createClient();


  const { error } =
    await supabase.auth.exchangeCodeForSession(code);


  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?message=Authentication link expired. Please try again.",
        request.url
      )
    );
  }


  return NextResponse.redirect(
    new URL(redirectTo, request.url)
  );
}
