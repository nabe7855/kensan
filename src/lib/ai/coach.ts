export type ChatRole = "user" | "assistant";
export type ChatRow = { role: ChatRole; content: string };

export const MAX_MESSAGE_CHARS = 1000;

/** How many earlier messages the coach sees. Older ones stay in the log but cost nothing. */
export const HISTORY_TURNS = 12;

/**
 * Earlier messages as API turns: starting with the user and alternating. A question whose
 * answer failed is folded into the next question instead of breaking the order.
 */
export function toTurns(rows: ChatRow[]): ChatRow[] {
  const turns: ChatRow[] = [];
  for (const r of rows) {
    const last = turns.at(-1);
    if (!last) {
      if (r.role === "user") turns.push({ ...r });
    } else if (last.role === r.role) {
      last.content = `${last.content}\n\n${r.content}`;
    } else {
      turns.push({ ...r });
    }
  }
  // The new question is appended by the caller, so history must end with an answer.
  if (turns.at(-1)?.role === "user") turns.pop();
  return turns;
}

/** First questions to offer on an empty conversation. */
export const STARTERS = [
  "今週の食事で気をつけることは？",
  "体重が落ちにくくなった気がする",
  "トレーニングの量はこのままでいい？",
  "疲れが抜けにくいときはどうする？",
];
