import type { Metadata } from "next";
import { ContestList } from "@/components/contest/ContestList";

export const metadata: Metadata = { title: "大会 | 研鑽" };

export default function ContestPage() {
  return <ContestList />;
}
