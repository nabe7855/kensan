import type { Metadata } from "next";
import { WorkoutScreen } from "@/components/workout/WorkoutScreen";

export const metadata: Metadata = { title: "ワークアウト | 研鑽" };

export default function WorkoutPage() {
  return <WorkoutScreen />;
}
