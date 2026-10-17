"use client";

/* eslint-disable @next/next/no-img-element -- private, short-lived signed URLs */
import { Columns2, ImagePlus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { daysApart, filterPhotos, usedValues, type PosePhoto } from "@/lib/poses";
import { todayISO } from "@/lib/prep";
import { usePosePhotos, useSignedUrls } from "@/lib/queries/photos";
import { cn } from "@/lib/utils";
import { PhotoForm } from "./PhotoForm";
import { usePhotoActions } from "./usePhotoActions";

const md = (d: string) => d.replaceAll("-", ".");
const chip = (on: boolean) =>
  cn(
    "h-10 shrink-0 rounded-md border px-3 text-sm whitespace-nowrap",
    on ? "border-accent text-accent" : "border-border text-muted",
  );

function Photo({ url, alt, className }: { url?: string; alt: string; className?: string }) {
  return url ? (
    <img src={url} alt={alt} loading="lazy" className={cn("bg-card object-cover", className)} />
  ) : (
    <div aria-hidden className={cn("bg-card animate-pulse", className)} />
  );
}

/** Posing photos: add with pose and tags, filter, view, and compare two side by side. */
export function AlbumScreen() {
  const today = todayISO();
  const photos = usePosePhotos();
  const actions = usePhotoActions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pose, setPose] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<PosePhoto | null>(null);
  const [editing, setEditing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const all = useMemo(() => photos.data ?? [], [photos.data]);
  const used = useMemo(() => usedValues(all), [all]);
  const shown = useMemo(() => filterPhotos(all, { pose, tag }), [all, pose, tag]);
  const urls = useSignedUrls(shown.map((p) => p.path));
  const url = (p: PosePhoto) => urls.data?.[p.path];
  const pair = picked.map((id) => all.find((p) => p.id === id)).filter(Boolean) as PosePhoto[];

  function choose(f: File | undefined) {
    if (!f) return;
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function closeUpload() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ポーズ写真</h1>
        {all.length > 1 && (
          <button
            type="button"
            aria-pressed={comparing}
            onClick={() => {
              setComparing((v) => !v);
              setPicked([]);
            }}
            className={cn(chip(comparing), "flex items-center gap-1.5")}
          >
            <Columns2 className="size-4" aria-hidden />
            {comparing ? "比べるのをやめる" : "比べる"}
          </button>
        )}
      </div>

      {comparing && (
        <p className="text-accent text-sm">
          比べたい写真を 2 枚選んでください（{picked.length}/2）
        </p>
      )}

      {(used.poses.length > 1 || used.tags.length > 0) && (
        <div className="flex flex-col gap-1.5">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
            <button type="button" onClick={() => setPose(null)} className={chip(pose === null)}>
              すべてのポーズ
            </button>
            {used.poses.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={pose === p}
                onClick={() => setPose(pose === p ? null : p)}
                className={chip(pose === p)}
              >
                {p}
              </button>
            ))}
          </div>
          {used.tags.length > 0 && (
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
              {used.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tag === t}
                  onClick={() => setTag(tag === t ? null : t)}
                  className={chip(tag === t)}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {photos.isPending ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-card aspect-[3/4] animate-pulse rounded-md" />
          ))}
        </div>
      ) : photos.isError ? (
        <p className="text-warn text-sm">
          読み込めませんでした。電波の良い場所で開き直してください
        </p>
      ) : all.length === 0 ? (
        <p className="surface text-muted px-4 py-6 text-sm leading-relaxed">
          ポーズごとに写真を残しておくと、あとで同じポーズだけを並べて仕上がりを比べられます
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted text-sm">この条件の写真はありません</p>
      ) : (
        <ul className="grid grid-cols-3 gap-1">
          {shown.map((p) => {
            const order = picked.indexOf(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!comparing) return setViewing(p);
                    setPicked((list) =>
                      list.includes(p.id)
                        ? list.filter((x) => x !== p.id)
                        : [...list, p.id].slice(-2),
                    );
                  }}
                  aria-label={`${md(p.taken_on)} ${p.pose}${order >= 0 ? `（${order + 1}枚目に選択中）` : ""}`}
                  className={cn(
                    "relative block w-full overflow-hidden rounded-md",
                    order >= 0 && "ring-accent ring-2",
                  )}
                >
                  <Photo url={url(p)} alt="" className="aspect-[3/4] w-full" />
                  <span className="bg-bg/80 absolute inset-x-0 bottom-0 flex flex-col px-1.5 py-1 text-left">
                    <span className="num text-fg text-[11px]">{md(p.taken_on)}</span>
                    <span className="text-muted truncate text-[10px]">{p.pose}</span>
                  </span>
                  {order >= 0 && (
                    <span className="bg-accent text-bg num absolute top-1 right-1 flex size-6 items-center justify-center rounded-full text-sm">
                      {order + 1}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-warn text-sm">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="kb-open:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto max-w-[480px] px-4 pb-2">
          {!comparing && (
            <Button size="lg" className="w-full" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-5" aria-hidden /> 写真を追加
            </Button>
          )}
        </div>
      </div>

      {comparing && pair.length === 2 && (
        <Sheet title="比べる" onClose={() => setPicked([])}>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-6">
            <p className="text-muted text-sm">
              <span className="num">{daysApart(pair[0]!.taken_on, pair[1]!.taken_on)}</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[...pair]
                .sort((a, b) => a.taken_on.localeCompare(b.taken_on))
                .map((p) => (
                  <figure key={p.id} className="flex flex-col gap-1">
                    <Photo
                      url={url(p)}
                      alt={`${md(p.taken_on)} ${p.pose}`}
                      className="aspect-[3/4] w-full rounded-md"
                    />
                    <figcaption className="flex flex-col">
                      <span className="num text-sm">{md(p.taken_on)}</span>
                      <span className="text-muted text-xs">{p.pose}</span>
                    </figcaption>
                  </figure>
                ))}
            </div>
          </div>
        </Sheet>
      )}

      {file && preview && (
        <Sheet title="写真を追加" onClose={closeUpload}>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
            <img
              src={preview}
              alt="追加する写真"
              className="mx-auto max-h-64 rounded-md object-contain"
            />
            {error && <p className="text-warn text-sm">{error}</p>}
            <PhotoForm
              initial={{
                taken_on: today,
                pose: pose ?? "フロント",
                tags: tag ? [tag] : [],
                note: null,
              }}
              knownTags={used.tags}
              today={today}
              submitLabel="保存する"
              busy={busy}
              onSubmit={async (meta) => {
                setBusy(true);
                setError(null);
                try {
                  await actions.upload(file, meta);
                  closeUpload();
                } catch {
                  setError(
                    navigator.onLine
                      ? "保存できませんでした。JPEG か PNG の写真でもう一度お試しください"
                      : "写真の保存には通信が必要です。電波の良い場所でもう一度お試しください",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          </div>
        </Sheet>
      )}

      {viewing && (
        <Sheet
          title={`${md(viewing.taken_on)} ${viewing.pose}`}
          onClose={() => {
            setViewing(null);
            setEditing(false);
          }}
        >
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-6">
            {editing ? (
              <PhotoForm
                initial={viewing}
                knownTags={used.tags}
                today={today}
                submitLabel="変更を保存"
                onSubmit={async (meta) => {
                  await actions
                    .update(viewing.id, meta)
                    .catch(() => setError("保存できませんでした"));
                  setViewing({ ...viewing, ...meta });
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <Photo
                  url={url(viewing)}
                  alt={`${md(viewing.taken_on)} ${viewing.pose}`}
                  className="w-full rounded-md object-contain"
                />
                {error && <p className="text-warn text-sm">{error}</p>}
                {viewing.tags.length > 0 && (
                  <p className="text-muted text-sm">{viewing.tags.map((t) => `#${t}`).join(" ")}</p>
                )}
                {viewing.note && <p className="text-sm leading-relaxed">{viewing.note}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    ポーズ・タグを編集
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      if (!window.confirm("この写真を削除します。元に戻せません。")) return;
                      await actions
                        .remove(viewing)
                        .then(() => setViewing(null))
                        .catch(() => setError("削除できませんでした"));
                    }}
                  >
                    <X className="size-4" aria-hidden /> 削除
                  </Button>
                </div>
              </>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
