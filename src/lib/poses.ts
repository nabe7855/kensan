/** Preset poses by division; any other name can be typed in. */
export const POSE_GROUPS = [
  { label: "フィジーク", poses: ["フロント", "バック", "右サイド", "左サイド"] },
  {
    label: "ボディビル",
    poses: [
      "フロントダブルバイセップス",
      "フロントラットスプレッド",
      "サイドチェスト",
      "バックダブルバイセップス",
      "バックラットスプレッド",
      "サイドトライセップス",
      "アブドミナル＆サイ",
    ],
  },
  { label: "その他", poses: ["バキューム", "フェイバリット", "リラックス"] },
] as const;

export type PosePhoto = {
  id: string;
  taken_on: string;
  pose: string;
  tags: string[];
  note: string | null;
  path: string;
  width: number | null;
  height: number | null;
};

const MAX_TAGS = 10;
const MAX_TAG_LEN = 20;

/** "朝, #パンプ後 大会前" → ["朝", "パンプ後", "大会前"]: split, trim, drop "#", dedupe, cap. */
export function parseTags(input: string): string[] {
  const tags = input
    .split(/[\s,、，]+/)
    .map((t) =>
      t
        .replace(/^[#＃]+/, "")
        .trim()
        .slice(0, MAX_TAG_LEN),
    )
    .filter(Boolean);
  return [...new Set(tags)].slice(0, MAX_TAGS);
}

export type PhotoFilter = { pose: string | null; tag: string | null };

/** Photos matching the pose and tag (either may be unset), newest first. */
export function filterPhotos<T extends Pick<PosePhoto, "pose" | "tags" | "taken_on">>(
  photos: T[],
  { pose, tag }: PhotoFilter,
): T[] {
  return photos
    .filter((p) => (!pose || p.pose === pose) && (!tag || p.tags.includes(tag)))
    .sort((a, b) => b.taken_on.localeCompare(a.taken_on));
}

/** Poses and tags in use, most used first, for the filter chips. */
export function usedValues(photos: Pick<PosePhoto, "pose" | "tags">[]): {
  poses: string[];
  tags: string[];
} {
  const count = (values: string[]) => {
    const m = new Map<string, number>();
    for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v);
  };
  return { poses: count(photos.map((p) => p.pose)), tags: count(photos.flatMap((p) => p.tags)) };
}

/** Size that fits inside `max` on the longer side, keeping the aspect ratio (never upscales). */
export function fitWithin(
  width: number,
  height: number,
  max = 1600,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Formats to try when saving, smallest first. Safari may not encode WebP and falls back to JPEG. */
export const ENCODINGS = [
  { type: "image/webp", ext: "webp", quality: 0.8 },
  { type: "image/jpeg", ext: "jpg", quality: 0.85 },
] as const;

export type EncodedType = (typeof ENCODINGS)[number]["type"];

/** The first format the browser actually produced (a canvas silently returns PNG when it can't). */
export function pickEncoding(producedType: string) {
  return ENCODINGS.find((e) => e.type === producedType) ?? null;
}

/** Storage path: one folder per user, as the bucket policies require. */
export const photoPath = (userId: string, id: string, ext: string = "webp") =>
  `${userId}/${id}.${ext}`;

/** "12日差" between two dates, for the compare view. */
export function daysApart(a: string, b: string): string {
  const d = Math.abs(
    (new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000,
  );
  return d === 0 ? "同じ日" : `${Math.round(d)}日差`;
}
