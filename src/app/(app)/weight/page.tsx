import type { Metadata } from "next";
import { WeightDetail } from "@/components/home/WeightDetail";

export const metadata: Metadata = { title: "体重 | 研鑽" };

export default function WeightPage() {
  return <WeightDetail />;
}
