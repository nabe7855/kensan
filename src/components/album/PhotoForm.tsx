"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseTags, POSE_GROUPS } from "@/lib/poses";
import { cn } from "@/lib/utils";
import type { PhotoMeta } from "./usePhotoActions";

const chip = (on: boolean) =>
  cn(
    "h-10 shrink-0 rounded-md border px-3 text-sm whitespace-nowrap",
    on ? "border-accent bg-accent text-bg font-bold" : "border-border text-fg",
  );

/** Date, pose, tags and a note for a photo. */
export function PhotoForm({
  initial,
  knownTags,
  today,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial: PhotoMeta;
  knownTags: string[];
  today: string;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (meta: PhotoMeta) => void;
}) {
  const presets: readonly string[] = POSE_GROUPS.flatMap((g) => g.poses);
  const [date, setDate] = useState(initial.taken_on);
  const [pose, setPose] = useState(initial.pose);
  const [custom, setCustom] = useState(presets.includes(initial.pose) ? "" : initial.pose);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState(initial.note ?? "");

  const finalPose = custom.trim() || pose;
  const allTags = parseTags([...tags, tagInput].join(" "));
  const toggleTag = (t: string) =>
    setTags((list) =>
      list.includes(t) ? list.filter((x) => x !== t) : parseTags([...list, t].join(" ")),
    );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!finalPose) return;
        onSubmit({ taken_on: date, pose: finalPose, tags: allTags, note: note.trim() || null });
      }}
    >
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">撮影日</span>
        <input
          type="date"
          required
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="num text-fg min-w-0 flex-1 bg-transparent text-right text-lg [color-scheme:dark] focus:outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">ポーズ</legend>
        {POSE_GROUPS.map((g) => (
          <div key={g.label} className="flex flex-col gap-1">
            <span className="text-ghost text-xs">{g.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {g.poses.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={!custom && pose === p}
                  onClick={() => {
                    setPose(p);
                    setCustom("");
                  }}
                  className={chip(!custom && pose === p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ))}
        <input
          maxLength={40}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="その他のポーズ名を入力"
          aria-label="その他のポーズ名"
          className="border-border text-fg placeholder:text-ghost h-12 rounded-md border bg-transparent px-3 text-base focus:outline-none"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">タグ</legend>
        {knownTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {knownTags.slice(0, 12).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tags.includes(t)}
                onClick={() => toggleTag(t)}
                className={chip(tags.includes(t))}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="新しいタグ（例：朝 パンプ後 D-30）"
          aria-label="新しいタグ"
          className="border-border text-fg placeholder:text-ghost h-12 rounded-md border bg-transparent px-3 text-base focus:outline-none"
        />
        {allTags.length > 0 && (
          <p className="text-muted text-xs">{allTags.map((t) => `#${t}`).join(" ")}</p>
        )}
      </fieldset>

      <textarea
        maxLength={300}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="メモ（任意）"
        aria-label="メモ"
        rows={2}
        className="border-border text-fg placeholder:text-ghost rounded-md border bg-transparent px-3 py-2 text-base focus:outline-none"
      />

      <Button type="submit" size="lg" disabled={!finalPose || busy}>
        {busy ? "保存中…" : submitLabel}
      </Button>
    </form>
  );
}
