import type { Metadata } from "next";
import { CoachScreen } from "@/components/coach/CoachScreen";

export const metadata: Metadata = { title: "AI コーチ | 研鑽" };

export default function CoachPage() {
  return <CoachScreen />;
}
