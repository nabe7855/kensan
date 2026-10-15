import type { Metadata } from "next";

export const metadata: Metadata = { title: "ログイン | 研鑽" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold tracking-widest">研鑽</h1>
      <p className="label-en text-accent mt-3 text-xs">KENSAN</p>
      <p className="text-muted mt-8 text-sm">ログインは Phase 1 で実装</p>
    </main>
  );
}
