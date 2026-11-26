/** Age in whole years on `today`, from the birth year alone (assumes the birthday has passed half the time). */
export function ageFrom(birthYear: number | null, today: string): number | null {
  if (birthYear == null) return null;
  const age = Number(today.slice(0, 4)) - birthYear;
  return age >= 10 && age <= 100 ? age : null;
}

/**
 * Resting energy by Mifflin-St Jeor, rounded to 10 kcal. "other" uses the midpoint of the
 * male and female constants. Null when anything is missing.
 */
export function bmrMifflin(input: {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  sex: string | null;
}): number | null {
  const { weightKg, heightCm, age, sex } = input;
  if (weightKg == null || heightCm == null || age == null || sex == null) return null;
  const c = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  return Math.round((10 * weightKg + 6.25 * heightCm - 5 * age + c) / 10) * 10;
}
