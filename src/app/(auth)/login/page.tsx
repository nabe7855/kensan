import type { Metadata } from "next";
import Link from "next/link";
import { Hamon } from "@/components/brand/Hamon";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "研鑽 KENSAN" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-4 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Hamon rise />
      <div className="relative flex flex-1 items-center justify-center pt-16">
        <Logo tagline />
      </div>
      <div className="relative flex flex-col gap-3">
        {error && (
          <p role="alert" className="text-warn mb-1 text-center text-sm">
            ログインできませんでした。もう一度お試しください。
          </p>
        )}
        <Button asChild size="lg">
          <Link href="/login/email">メールで続ける</Link>
        </Button>
        <Button variant="outline" size="lg" disabled>
          Google で続ける
          <span className="text-ghost text-xs font-normal">準備中</span>
        </Button>
        <p className="text-ghost mt-3 text-center text-xs">利用規約 ・ プライバシー</p>
      </div>
    </main>
  );
}
