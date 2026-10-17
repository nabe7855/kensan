import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContestDetail } from "@/components/contest/ContestDetail";

export const metadata: Metadata = { title: "大会 | 研鑽" };

export default async function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <ContestDetail id={id} />;
}
