import type { OutboxOp } from "./db";

const TABLES: Record<string, string> = {
  daily_checkins: "体調・体重",
  workouts: "トレーニング",
  workout_sets: "トレのセット",
  exercise_notes: "種目メモ",
  meal_logs: "食事",
  meal_log_items: "食事の食品",
  meal_templates: "マイ定食",
  meal_template_items: "マイ定食の食品",
  nutrition_targets: "PFC 目標",
  day_overrides: "トレ日・オフ日",
  foods: "マイ食品",
  fridge_items: "冷蔵庫",
  preps: "減量計画",
  profiles: "設定",
  contests: "大会",
  contest_routines: "大会のルーティン",
  contest_checks: "大会のチェック",
  pose_photos: "ポーズ写真",
};

const KINDS: Record<OutboxOp["kind"], string> = {
  insert: "追加",
  upsert: "保存",
  update: "変更",
  delete: "削除",
};

/** "減量計画の変更" — what a queued write was, in the user's words. */
export function describeOp(op: Pick<OutboxOp, "table" | "kind">): string {
  return `${TABLES[op.table] ?? op.table}の${KINDS[op.kind]}`;
}

/** Common server errors in plain Japanese; the raw message stays alongside for support. */
export function explainError(message: string | undefined): string | null {
  if (!message) return null;
  if (/row-level security|permission denied|42501/i.test(message))
    return "権限がなく保存できませんでした";
  if (/violates check constraint|23514/i.test(message))
    return "入力値がルールに合わず保存できませんでした";
  if (/violates foreign key|23503/i.test(message))
    return "関係するデータが見つからず保存できませんでした";
  if (/duplicate key|23505/i.test(message)) return "同じデータがすでにあります";
  if (/invalid input syntax|22P02/i.test(message))
    return "値の形式が合わず保存できませんでした（アプリ側の不具合です）";
  if (/column .* does not exist|PGRST204|schema cache/i.test(message))
    return "アプリと DB の項目が合っていません（DB の更新待ちの可能性）";
  if (/JWT|expired|401/i.test(message))
    return "ログインの期限が切れています。ログインし直してください";
  return null;
}
