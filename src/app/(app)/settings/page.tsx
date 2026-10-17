import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "@/components/settings/EmailForm";
import { ExportButtons } from "@/components/settings/ExportButtons";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { TrainingSettings } from "@/components/settings/TrainingSettings";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Button } from "@/components/ui/button";
import { daysUntilContest, todayISO } from "@/lib/prep";
import { getCurrentProfile } from "@/lib/profile";
import { endPrep } from "./actions";

export const metadata: Metadata = { title: "設定 | 研鑽" };

export default async function SettingsPage() {
  const { supabase, user, profile } = await getCurrentProfile();
  const { data: prep } = await supabase
    .from("preps")
    .select("id, contest_name, contest_date, start_weight_kg, target_weight_kg, weekly_rate_pct")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">設定</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">プロフィール</h2>
        <ProfileForm
          displayName={profile?.display_name ?? ""}
          heightCm={profile?.height_cm ?? null}
          sex={profile?.sex ?? null}
          unitPref={profile?.unit_pref ?? "kg"}
          trackLibido={profile?.track_libido ?? true}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">トレーニング</h2>
        <TrainingSettings />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">大会</h2>
        <Button asChild variant="secondary">
          <Link href="/contest">出場する大会とやること</Link>
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">プレップ</h2>
        {prep ? (
          <>
            <div className="surface px-4 py-4">
              <p className="text-base font-bold">{prep.contest_name}</p>
              <p className="num text-muted mt-1 text-sm">
                {prep.contest_date.replaceAll("-", ".")}　D-
                {daysUntilContest(prep.contest_date, todayISO())}
              </p>
              <p className="num mt-2 text-sm">
                {prep.start_weight_kg.toFixed(1)} → {prep.target_weight_kg.toFixed(1)} kg
                {prep.weekly_rate_pct.toFixed(2)} %/週
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/settings/prep">プレップを編集</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/plan">減量フェーズの目安</Link>
            </Button>
            <form action={endPrep.bind(null, prep.id)}>
              <ConfirmSubmit
                variant="ghost"
                className="w-full"
                message="プレップを終了します。記録は残ります。よろしいですか？"
              >
                プレップを終了する
              </ConfirmSubmit>
            </form>
          </>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/settings/prep">プレップを設定</Link>
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">CSV エクスポート</h2>
        <ExportButtons />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">アカウント</h2>
        <EmailForm currentEmail={user.email ?? ""} />
        <Button asChild variant="secondary">
          <Link href="/auth/reset">パスワードを設定・変更</Link>
        </Button>
        <LogoutButton />
      </section>
    </div>
  );
}
