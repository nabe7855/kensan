"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { reloadForChunkOnce } from "@/lib/chunk-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    console.error(error);
    if (reloadForChunkOnce(error)) setReloading(true);
  }, [error]);

  if (reloading) return <p className="text-muted py-10 text-center text-sm">最新版を読み込み中…</p>;

  return (
    <div className="flex flex-col gap-4 py-6">
      <h1 className="text-xl font-bold">この画面を表示できませんでした</h1>
      <p className="text-muted text-sm leading-relaxed">
        記録は消えていません。もう一度試すか、ホームに戻ってください。続くようなら、下の内容をスクリーンショットで送ってください。
      </p>
      <pre className="surface text-ghost overflow-x-auto px-3 py-3 text-xs whitespace-pre-wrap">
        {typeof window !== "undefined" ? window.location.pathname : ""}
        {"\n"}
        {error.name}: {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ""}
      </pre>
      <Button size="lg" onClick={() => reset()}>
        もう一度試す
      </Button>
      <Button asChild variant="ghost">
        <Link href="/home">ホームへ</Link>
      </Button>
    </div>
  );
}
