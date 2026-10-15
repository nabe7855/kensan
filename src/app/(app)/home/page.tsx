import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "ホーム | 研鑽" };

export default function HomePage() {
  return (
    <Card>
      <h1 className="text-lg font-bold">ホーム</h1>
      <p className="text-muted mt-1 text-sm">準備中</p>
    </Card>
  );
}
