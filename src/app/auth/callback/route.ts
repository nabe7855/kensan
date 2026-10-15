import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only these in-app paths may be used as the post-login destination. */
const ALLOWED_NEXT = new Set(["/home", "/onboarding", "/auth/reset"]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next =
    nextParam && ALLOWED_NEXT.has(nextParam)
      ? nextParam
      : type === "recovery"
        ? "/auth/reset"
        : "/home";
  const supabase = await createClient();

  let failed = true;
  if (code) {
    failed = !!(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    failed = !!(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  return NextResponse.redirect(new URL(failed ? "/login?error=auth" : next, origin));
}
