import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/HomeScreen";

export const metadata: Metadata = { title: "ホーム | 研鑽" };

export default function HomePage() {
  return <HomeScreen />;
}
