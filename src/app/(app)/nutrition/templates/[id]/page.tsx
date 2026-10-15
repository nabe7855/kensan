"use client";

import { use } from "react";
import { TemplateEditor } from "@/components/nutrition/TemplateEditor";
import { useTemplates } from "@/lib/queries/nutrition";

export default function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: templates, isPending } = useTemplates();

  if (isPending) return <div className="surface h-64 animate-pulse" aria-busy />;
  const template = id === "new" ? null : (templates?.find((t) => t.id === id) ?? null);
  if (id !== "new" && !template) return <p className="text-muted text-sm">見つかりません</p>;
  const nextOrder = Math.max(-1, ...(templates ?? []).map((t) => t.order_idx)) + 1;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{template ? "マイ定食を編集" : "マイ定食を作る"}</h1>
      <TemplateEditor key={id} template={template} nextOrder={nextOrder} />
    </div>
  );
}
