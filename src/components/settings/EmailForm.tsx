"use client";

import { useActionState, useState } from "react";
import { changeEmail, type EmailChangeState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "bg-bg border-border placeholder:text-ghost focus:border-accent h-12 w-full rounded-md border px-3 text-base focus:outline-none";

/** Change the login email. Requires the current password. */
export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<EmailChangeState, FormData>(changeEmail, {});
  const [open, setOpen] = useState(false);
  const shown = state.saved ? state.email : currentEmail;

  return (
    <div className="flex flex-col gap-2">
      <div className="surface flex min-h-14 items-center justify-between gap-4 px-4 py-2">
        <span className="shrink-0 text-sm">メールアドレス</span>
        <span className="text-muted min-w-0 truncate text-sm">{shown}</span>
      </div>

      {open ? (
        <form action={action} className="surface flex flex-col gap-3 px-4 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-muted text-xs">新しいメールアドレス</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted text-xs">今のパスワード（確認のため）</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </label>
          {state.error && (
            <p role="alert" className="text-warn text-sm leading-relaxed">
              {state.error}
            </p>
          )}
          {state.notice && (
            <p role="status" className="text-muted text-sm leading-relaxed">
              {state.notice}
            </p>
          )}
          {state.saved && !pending && (
            <p role="status" className="text-muted text-sm">
              変更した。次回から新しいアドレスでログインしてください
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              変更する
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          メールアドレスを変更
        </Button>
      )}
    </div>
  );
}
