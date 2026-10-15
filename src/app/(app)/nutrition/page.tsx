import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "食事 | 研鑽" };

export default function NutritionPage() {
  return (
    <Card>
      <h1 className="text-lg font-bold">食事</h1>
      <p className="text-muted mt-1 text-sm">準備中</p>
    </Card>
  );
}
