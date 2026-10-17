import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DayReport } from "@/components/report/DayReport";

export const metadata: Metadata = { title: "日報 | 研鑽" };

export default async function ReportPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) notFound();
  return <DayReport date={date} />;
}
