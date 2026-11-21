"use client";

import { useState } from "react";
import { useAppData, useRefreshAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Toggle } from "./TrainingSettings";

/** Opt in or out of the AI features. Spend is shown only on the admin page. */
export function AiSettings() {
  const { userId, aiEnabled } = useAppData();
  const refreshAppData = useRefreshAppData();
  const { write } = useSync();
  const [enabled, setEnabled] = useState(aiEnabled);

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
    <Toggle
      label="AI 機能を使う"
      note="写真や記録を AI（Anthropic の Claude）に送って読み取り・分析します。送った内容が AI の学習に使われることはありません"
      checked={enabled}
      onChange={(v) => void save(v)}
    />
  );
}
