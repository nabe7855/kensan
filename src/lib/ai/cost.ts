/** USD per 1M tokens, for prompts up to 100K tokens (the only size this app sends). */
const PRICES = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
} as const;

export type AiModel = keyof typeof PRICES;

export const LABEL_MODEL: AiModel = "claude-haiku-5-5";

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
