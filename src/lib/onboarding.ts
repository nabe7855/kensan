import { z } from "zod";

export type OnboardingProfile = {
  display_name: string | null;
  height_cm: number | null;
  sex: string | null;
  onboarded_at: string | null;
} | null;

export type OnboardingStep = "name" | "body" | "prep" | "done";

/** First step the user still has to complete, or null when onboarding is finished. */
export function nextOnboardingStep(profile: OnboardingProfile): OnboardingStep | null {
  if (profile?.onboarded_at) return null;
  if (!profile?.display_name) return "name";
  if (profile.height_cm == null || !profile.sex) return "body";
  return "prep";
}

const numberFromForm = (min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
    z.number().min(min).max(max),
  );

export const nameSchema = z.object({
  display_name: z.string().trim().min(1).max(20),
});

export const bodySchema = z.object({
  height_cm: numberFromForm(100, 250),
  sex: z.enum(["male", "female", "other"]),
  unit_pref: z.enum(["kg", "lb"]),
});

export const prepSchema = z
  .object({
    contest_name: z.string().trim().min(1).max(60),
    contest_date: z.iso.date(),
    /** When the cut actually began; may be in the past. Defaults to today. */
    start_date: z.iso.date().optional(),
    start_weight_kg: numberFromForm(30, 250),
    target_weight_kg: numberFromForm(30, 250),
    weekly_rate_pct: numberFromForm(0.25, 1.0),
    why_text: z.string().trim().max(500).optional(),
    reverse_plan: z.boolean(),
  })
  .refine((v) => v.target_weight_kg < v.start_weight_kg, {
    path: ["target_weight_kg"],
    message: "目標体重は開始体重より小さくしてください",
  })
  .refine((v) => !v.start_date || v.start_date < v.contest_date, {
    path: ["start_date"],
    message: "減量開始日は大会日より前にしてください",
  });
