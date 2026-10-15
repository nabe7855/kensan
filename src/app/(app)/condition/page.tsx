import type { Metadata } from "next";
import { CheckinScreen } from "@/components/condition/CheckinScreen";

export const metadata: Metadata = { title: "コンディション | 研鑽" };

export default function ConditionPage() {
  return <CheckinScreen />;
}
