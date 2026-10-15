import type { Metadata } from "next";
import { TrainingScreen } from "@/components/training/TrainingScreen";

export const metadata: Metadata = { title: "トレ | 研鑽" };

export default function TrainingPage() {
  return <TrainingScreen />;
}
