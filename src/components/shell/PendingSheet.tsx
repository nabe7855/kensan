"use client";

import { useEffect, useState } from "react";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { OutboxOp } from "@/lib/offline/db";
import { describeOp, explainError } from "@/lib/offline/describe";
import { OUTBOX_CHANGED, pendingOps } from "@/lib/offline/outbox";

const when = (ms: number) =>
  new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));

/** What is waiting to be sent, why it failed, and ways to resend or drop it. */
export function PendingSheet({ onClose }: { onClose: () => void }) {
  const { retry, discard } = useSync();
  const [ops, setOps] = useState<OutboxOp[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = () => void pendingOps().then(setOps);
    load();
    window.addEventListener(OUTBOX_CHANGED, load);
    return () => window.removeEventListener(OUTBOX_CHANGED, load);
  }, []);

  return (
    <Sheet title="未送信の記録" onClose={onClose}>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
        <p className="text-muted text-sm leading-relaxed">
          この端末に保存されていて、まだサーバーに届いていない記録です。通信が戻ると自動で送ります。何度送っても届かないものは理由を表示しています
        </p>
        {ops.length === 0 ? (
          <p className="surface text-muted px-4 py-4 text-sm">すべて送信済みです</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ops.map((op) => {
              const plain = explainError(op.lastError);
              return (
                <li key={op.id} className="surface flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold">{describeOp(op)}</span>
                    <span className="num text-ghost text-xs">{when(op.createdAt)}</span>
                  </div>
                  {op.lastError ? (
                    <>
                      <p className="text-warn text-sm">
                        {plain ?? "サーバーに受け付けられませんでした"}
                        <span className="num text-ghost ml-1 text-xs">（{op.attempts} 回）</span>
                      </p>
                      <p className="text-ghost text-[11px] leading-relaxed break-all">
                        {op.lastError}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted text-sm">送信待ち</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `${describeOp(op)}を破棄します。この記録はサーバーに保存されません。`,
                        )
                      )
                        void discard(op.id!);
                    }}
                    className="text-ghost h-10 self-start text-xs underline underline-offset-4"
                  >
                    この記録を破棄
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {ops.length > 0 && (
          <Button
            size="lg"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await retry().finally(() => setBusy(false));
            }}
          >
            {busy ? "送信中…" : "もう一度送る"}
          </Button>
        )}
        {ops.some((o) => o.lastError) && (
          <p className="text-ghost text-xs leading-relaxed">
            直らないときは、グレーの文字の部分をスクリーンショットで送ってください。原因を特定できます
          </p>
        )}
      </div>
    </Sheet>
  );
}
