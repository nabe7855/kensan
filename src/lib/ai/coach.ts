import { z } from "zod";
import { ageFrom, bmrMifflin } from "@/lib/energy";

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

/**
 * Who the coach is talking to, with energy figures the app works out so the AI never has to
 * calculate them (it got BMR wrong when left to do so).
 */
export const CoachProfileSchema = z.object({
  height_cm: z.number().min(100).max(250).nullable(),
  sex: z.enum(["male", "female", "other"]).nullable(),
  age: z.number().int().min(10).max(100).nullable(),
  /** Mifflin-St Jeor from the 7-day average weight. */
  bmr_kcal: z.number().int().min(500).max(5000).nullable(),
  /** Maintenance estimated from logged intake and the weight trend of the last 3 weeks. */
  maintenance_kcal: z.number().int().min(800).max(8000).nullable(),
});
export type CoachProfile = z.infer<typeof CoachProfileSchema>;

export function buildCoachProfile(input: {
  heightCm: number | null;
  sex: string | null;
  birthYear: number | null;
  today: string;
  weightAvgKg: number | null;
  maintenanceKcal: number | null;
}): CoachProfile {
  const age = ageFrom(input.birthYear, input.today);
  const sex =
    input.sex === "male" || input.sex === "female" || input.sex === "other" ? input.sex : null;
  return {
    height_cm: input.heightCm,
    sex,
    age,
    bmr_kcal: bmrMifflin({ weightKg: input.weightAvgKg, heightCm: input.heightCm, age, sex }),
    maintenance_kcal: input.maintenanceKcal,
  };
}
