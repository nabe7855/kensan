import type { Metadata } from "next";
import { AnalysisScreen } from "@/components/analysis/AnalysisScreen";

export const metadata: Metadata = { title: "分析 | 研鑽" };

export default function AnalysisPage() {
  return <AnalysisScreen />;
}
