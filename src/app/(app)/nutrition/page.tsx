import type { Metadata } from "next";
import { NutritionScreen } from "@/components/nutrition/NutritionScreen";

export const metadata: Metadata = { title: "食事 | 研鑽" };

export default function NutritionPage() {
  return <NutritionScreen />;
}
