import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "コンディション | 研鑽" };

export default function ConditionPage() {
  return (
    <Card>
      <h1 className="text-lg font-bold">コンディション</h1>
      <p className="text-muted mt-1 text-sm">準備中</p>
    </Card>
  );
}
