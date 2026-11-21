/** USD per 1M tokens, for prompts up to 100K tokens (the only size this app sends). */
const PRICES = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
} as const;

export type AiModel = keyof typeof PRICES;

export type AiFeature = "label" | "checkin" | "chat" | "peak";

/**
 * Which model each feature uses. Haiku first everywhere; move a feature up to Sonnet only
 * when its answers are clearly not good enough (Sonnet costs 20x).
 */
export const MODELS: Record<AiFeature, AiModel> = {
  label: "claude-haiku-5-5",
  checkin: "claude-haiku-5-5",
  chat: "claude-haiku-5-5",
  peak: "claude-haiku-5-5",
};

export const FEATURE_LABELS: Record<AiFeature, string> = {
  label: "栄養成分表示の読み取り",
  checkin: "週の振り返り",
  chat: "AI コーチ",
  peak: "大会前の確認",
};

export const LABEL_MODEL = MODELS.label;

/** Spend per user per calendar month (UTC) before AI requests are refused. */
export const MONTHLY_LIMIT_USD = 1;

export function costUsd(model: AiModel, inputTokens: number, outputTokens: number): number {
  const p = PRICES[model];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

/** First instant of the month containing `now`, in UTC, as an ISO timestamp. */
export function monthStartISO(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Yen for display only; a rough fixed rate is fine for a spending gauge. */
export const toYen = (usd: number) => Math.round(usd * 150);

/** "2026-11" → the UTC month's [start, end) as ISO timestamps; anything else → this month. */
export function monthRange(month: string | undefined, now: Date) {
  const m = /^(\d{4})-(\d{2})$/.exec(month ?? "");
  const y = m ? Number(m[1]) : now.getUTCFullYear();
  const mo = m ? Number(m[2]) - 1 : now.getUTCMonth();
  const start = new Date(Date.UTC(y, mo, 1));
  const end = new Date(Date.UTC(y, mo + 1, 1));
  const key = (d: Date) => d.toISOString().slice(0, 7);
  return {
    key: key(start),
    prev: key(new Date(Date.UTC(y, mo - 1, 1))),
    next: key(end),
    since: start.toISOString(),
    until: end.toISOString(),
  };
}

/** Yen with a decimal for small amounts, since one label read is a fraction of a yen. */
export const formatYen = (usd: number) => {
  const yen = usd * 150;
  return yen < 10 ? yen.toFixed(1) : Math.round(yen).toLocaleString("ja-JP");
};
