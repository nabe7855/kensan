import type { Metadata } from "next";
import { PhasePlan } from "@/components/plan/PhasePlan";

export const metadata: Metadata = { title: "減量フェーズ | 研鑽" };

export default function PlanPage() {
  return <PhasePlan />;
}
