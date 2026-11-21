"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAppData, useRefreshAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { MONTHLY_LIMIT_USD, monthStartISO, toYen } from "@/lib/ai/cost";
import { getSupabase } from "@/lib/supabase/client";
import { Toggle } from "./TrainingSettings";

/** Opt in or out of the AI features, with this month's spend against the cap. */
export function AiSettings() {
  const { userId, aiEnabled } = useAppData();
  const refreshAppData = useRefreshAppData();
  const { write } = useSync();
  const [enabled, setEnabled] = useState(aiEnabled);
  const month = monthStartISO(new Date());
  const { data: spent } = useQuery({
    queryKey: ["ai-usage", month],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("ai_usage")
        .select("cost_usd")
        .gte("created_at", month);
      if (error) throw error;
      return data.reduce((s, r) => s + Number(r.cost_usd), 0);
    },
  });

  async function save(v: boolean) {
    setEnabled(v);
    await write({
      table: "profiles",
      kind: "update",
      match: { user_id: userId },
      payload: { ai_enabled: v },
    });
    void refreshAppData();
  }

  return (
    <div className="flex flex-col gap-2">
      <Toggle
        label="AI 機能を使う"
        note="写真や記録を AI（Anthropic の Claude）に送って読み取り・分析します。送った内容が AI の学習に使われることはありません"
        checked={enabled}
        onChange={(v) => void save(v)}
      />
      {spent !== undefined && (
        <p className="text-muted px-1 text-xs">
          今月の利用 <span className="num">約 {toYen(spent)} 円</span>／上限{" "}
          <span className="num">{toYen(MONTHLY_LIMIT_USD)} 円</span>
        </p>
      )}
    </div>
  );
}
