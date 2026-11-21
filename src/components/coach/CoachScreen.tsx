"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useWeekFacts } from "@/components/checkin/useWeekFacts";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import type { CheckinFacts } from "@/lib/ai/checkin";
import { MAX_MESSAGE_CHARS, STARTERS } from "@/lib/ai/coach";
import { addDaysISO, todayISO } from "@/lib/prep";
import { messagesKey, useAiMessages, type AiMessage } from "@/lib/queries/ai";
import { cn } from "@/lib/utils";

async function ask(message: string, facts: CheckinFacts): Promise<AiMessage[]> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, facts }),
  });
  const json = (await res.json().catch(() => null)) as {
    messages?: AiMessage[];
    error?: string;
  } | null;
  if (!res.ok || !json?.messages) throw new Error(json?.error ?? "うまく答えられませんでした");
  return json.messages;
}

/** Chat with the AI coach, who sees the last 7 days of records. */
export function CoachScreen() {
  const { aiEnabled, userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const messages = useAiMessages();
  const { ready, facts } = useWeekFacts(addDaysISO(todayISO(), -6));
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const list = messages.data ?? [];
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [list.length, pending]);

  async function send(message: string) {
    const m = message.trim();
    if (!m || !facts || pending) return;
    if (!navigator.onLine) return setError("相談には通信が必要です");
    setError(null);
    setPending(m);
    setText("");
    try {
      const added = await ask(m, facts);
      queryClient.setQueryData<AiMessage[]>(messagesKey, (l = []) => [...l, ...added]);
    } catch (e) {
      setText(m);
      setError(e instanceof Error ? e.message : "うまく答えられませんでした");
    } finally {
      setPending(null);
    }
  }

  async function clear() {
    if (!confirm("これまでの会話を消します。よろしいですか？")) return;
    queryClient.setQueryData<AiMessage[]>(messagesKey, []);
    await write({ table: "ai_messages", kind: "delete", match: { user_id: userId } });
  }

  if (!aiEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">AI コーチ</h1>
        <div className="surface flex flex-col gap-3 px-4 py-4">
          <p className="text-sm">AI 機能がオフになっています。</p>
          <Button asChild variant="secondary">
            <Link href="/settings">設定でオンにする</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">AI コーチ</h1>
        {list.length > 0 && (
          <Button variant="ghost" onClick={() => void clear()}>
            会話を消す
          </Button>
        )}
      </div>
      <p className="text-muted text-xs leading-relaxed">
        直近 7 日の記録を踏まえて答えます。AI
        の回答です。体調や痛みの不安は専門家に相談してください。
      </p>

      {messages.isError && <p className="text-warn text-sm">会話を読み込めませんでした</p>}

      <div className="flex flex-col gap-3">
        {list.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {pending && (
          <>
            <Bubble role="user" content={pending} />
            <p className="text-muted px-1 text-sm">考え中…</p>
          </>
        )}
        {list.length === 0 && !pending && (
          <div className="flex flex-col gap-2">
            <p className="text-muted text-xs">たとえば</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!ready}
                onClick={() => void send(s)}
                className="surface min-h-12 px-4 py-3 text-left text-sm active:opacity-90 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      {error && <p className="text-warn text-sm">{error}</p>}

      <form
        className="bg-bg sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] flex items-end gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <textarea
          rows={2}
          maxLength={MAX_MESSAGE_CHARS}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="相談したいことを書く"
          aria-label="相談の内容"
          className="border-border bg-card text-fg placeholder:text-ghost focus:border-accent min-h-12 flex-1 resize-none rounded-md border px-3 py-3 text-sm focus:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="送る"
          disabled={!ready || !!pending || !text.trim()}
          className="shrink-0"
        >
          <Send aria-hidden className="size-5" />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div
      className={cn(
        "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
        role === "user" ? "bg-card border-border self-end border" : "surface self-start",
      )}
    >
      {content}
    </div>
  );
}
