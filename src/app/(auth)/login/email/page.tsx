import type { Metadata } from "next";
import { Hamon } from "@/components/brand/Hamon";
import { Logo } from "@/components/brand/Logo";
import { EmailLoginForm } from "./EmailLoginForm";

export const metadata: Metadata = { title: "ログイン | 研鑽" };

export default function EmailLoginPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Hamon className="h-[45%]" />
      <Logo size="md" className="relative" />
      <h2 className="relative mt-10 mb-6 text-2xl font-bold">メールで続ける</h2>
      <div className="relative flex flex-1 flex-col">
        <EmailLoginForm />
      </div>
    </main>
  );
}
