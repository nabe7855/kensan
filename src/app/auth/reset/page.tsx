import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "パスワード設定 | 研鑽" };

export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Logo size="md" />
      <h2 className="mt-10 text-2xl font-bold">パスワードを設定</h2>
      <p className="text-muted mt-2 mb-6 text-sm">{user.email}</p>
      <ResetForm email={user.email ?? ""} />
    </main>
  );
}
