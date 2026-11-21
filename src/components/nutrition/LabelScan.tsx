"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { useAppData, useRefreshAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { readingToForm, type LabelFormValues, type LabelReading } from "@/lib/ai/label-reading";
import { fitWithin } from "@/lib/poses";

/** Shrinks the photo (the model reads up to about 1568 px) and returns it as base64 JPEG. */
async function toJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, 1568);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1]!;
}

async function readLabel(file: File): Promise<LabelReading> {
  const data = await toJpegBase64(file);
  const res = await fetch("/api/ai/label", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mediaType: "image/jpeg", data }),
  });
  const json = (await res.json().catch(() => null)) as {
    reading?: LabelReading;
    error?: string;
  } | null;
  if (!res.ok || !json?.reading) throw new Error(json?.error ?? "読み取れませんでした");
  return json.reading;
}

/** Photo of the package's nutrition label → fills the form. Opt-in, since the photo goes to the AI. */
export function LabelScan({ onRead }: { onRead: (values: LabelFormValues) => void }) {
  const { userId, aiEnabled } = useAppData();
  const refreshAppData = useRefreshAppData();
  const { write } = useSync();
  const input = useRef<HTMLInputElement>(null);
  const [asking, setAsking] = useState(false);
  const [enabled, setEnabled] = useState(aiEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enable() {
    await write({
      table: "profiles",
      kind: "update",
      match: { user_id: userId },
      payload: { ai_enabled: true },
    });
    setEnabled(true);
    setAsking(false);
    void refreshAppData();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onRead(readingToForm(await readLabel(file)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み取れませんでした");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (asking) {
    return (
      <div className="surface flex flex-col gap-3 px-4 py-4">
        <p className="text-sm font-bold">AI 機能をオンにしますか？</p>
        <p className="text-muted text-xs leading-relaxed">
          撮った写真を AI（Anthropic の Claude）に送って数値を読み取ります。送った内容が AI
          の学習に使われることはありません。設定からいつでもオフにできます。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
            やめる
          </Button>
          <Button type="button" onClick={() => void enable()}>
            オンにする
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => {
          if (!navigator.onLine) return setError("読み取りには通信が必要です");
          if (!enabled) return setAsking(true);
          input.current?.click();
        }}
      >
        <Camera aria-hidden className="size-5" />
        {busy ? "読み取り中…" : "栄養成分表示を撮影して読み取る"}
      </Button>
      {error ? (
        <p className="text-warn text-xs leading-relaxed">{error}</p>
      ) : (
        <p className="text-ghost text-xs leading-relaxed">
          パッケージ裏の表示を正面から、数字がはっきり見えるように撮ってください
        </p>
      )}
    </div>
  );
}
