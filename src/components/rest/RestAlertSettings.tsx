"use client";

import { useEffect, useState } from "react";
import { useRestTimer } from "@/components/providers/RestTimerProvider";
import { canVibrate } from "@/lib/rest-alert";
import { canKeepAwake } from "@/lib/useWakeLock";
import { cn } from "@/lib/utils";

function Switch({
  label,
  note,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 text-left disabled:opacity-50"
    >
      <span className="flex flex-col">
        <span className="text-base">{label}</span>
        {note && <span className="text-muted text-xs leading-relaxed">{note}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "bg-fg absolute top-1 size-5 rounded-full transition-[left]",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

/** Sound and vibration when a rest ends, with a button to try them. Saved on this device. */
export function RestAlertSettings() {
  const { alerts, setAlerts, preview } = useRestTimer();
  // navigator only exists in the browser; decide after mount to match the server render.
  const [vibrateOk, setVibrateOk] = useState(true);
  const [awakeOk, setAwakeOk] = useState(true);
  useEffect(() => {
    setVibrateOk(canVibrate());
    setAwakeOk(canKeepAwake());
  }, []);

  return (
    <div className="surface flex flex-col gap-1 px-4 py-2">
      <span className="text-muted pt-1 text-xs">レスト終了の合図（この端末）</span>
      <Switch
        label="音を鳴らす"
        note="アプリを開いているときに鳴ります。閉じているときは通知で知らせます"
        checked={alerts.sound}
        onChange={(sound) => setAlerts({ ...alerts, sound })}
      />
      <Switch
        label="振動させる"
        note={vibrateOk ? undefined : "この端末のブラウザは振動に対応していません"}
        checked={alerts.vibrate && vibrateOk}
        disabled={!vibrateOk}
        onChange={(vibrate) => setAlerts({ ...alerts, vibrate })}
      />
      <Switch
        label="トレ中は画面を消さない"
        note={
          awakeOk
            ? "ワークアウト中とレスト中は画面がつきっぱなしになり、レストの終わりに確実に音が鳴ります"
            : "このブラウザは対応していません。Safari / Chrome の最新版で開いてください"
        }
        checked={alerts.keepAwake && awakeOk}
        disabled={!awakeOk}
        onChange={(keepAwake) => setAlerts({ ...alerts, keepAwake })}
      />
      <button
        type="button"
        onClick={preview}
        disabled={!alerts.sound && !(alerts.vibrate && vibrateOk)}
        className="text-accent h-10 self-start text-sm underline underline-offset-4 disabled:opacity-40"
      >
        試しに鳴らす
      </button>
    </div>
  );
}
