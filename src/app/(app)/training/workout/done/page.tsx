import type { Metadata } from "next";
import { SummaryScreen } from "@/components/workout/SummaryScreen";

export const metadata: Metadata = { title: "ワークアウト完了 | 研鑽" };

export default function WorkoutDonePage() {
  return <SummaryScreen />;
}
