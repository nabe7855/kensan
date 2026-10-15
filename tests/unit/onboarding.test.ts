import { describe, expect, it } from "vitest";
import { bodySchema, nextOnboardingStep, prepSchema } from "@/lib/onboarding";

const base = { display_name: null, height_cm: null, sex: null, onboarded_at: null };

describe("nextOnboardingStep", () => {
  it("starts with the name when there is no profile", () => {
    expect(nextOnboardingStep(null)).toBe("name");
  });

  it("walks name -> body -> prep", () => {
    expect(nextOnboardingStep({ ...base, display_name: "MORI" })).toBe("body");
    expect(nextOnboardingStep({ ...base, display_name: "MORI", height_cm: 172, sex: "male" })).toBe(
      "prep",
    );
  });

  it("is finished once onboarded_at is set", () => {
    expect(nextOnboardingStep({ ...base, onboarded_at: "2026-10-15T00:00:00Z" })).toBeNull();
  });
});

describe("bodySchema", () => {
  it("coerces form strings to numbers", () => {
    const r = bodySchema.parse({ height_cm: "172.5", sex: "male", unit_pref: "kg" });
    expect(r.height_cm).toBe(172.5);
  });

  it("rejects an empty height", () => {
    expect(bodySchema.safeParse({ height_cm: "", sex: "male", unit_pref: "kg" }).success).toBe(
      false,
    );
  });
});

describe("prepSchema", () => {
  const valid = {
    contest_name: "FWJ 東京 2027",
    contest_date: "2027-04-18",
    start_weight_kg: "78.0",
    target_weight_kg: "70.0",
    weekly_rate_pct: "0.5",
    why_text: "",
    reverse_plan: false,
  };

  it("accepts the mockup values", () => {
    expect(prepSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the target to be below the start", () => {
    const r = prepSchema.safeParse({ ...valid, target_weight_kg: "80" });
    expect(r.success).toBe(false);
  });

  it("caps the weekly rate at 1.0", () => {
    expect(prepSchema.safeParse({ ...valid, weekly_rate_pct: "1.2" }).success).toBe(false);
  });
});
