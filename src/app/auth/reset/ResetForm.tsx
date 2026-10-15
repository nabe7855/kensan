"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { PASSWORD_MIN } from "@/lib/auth";
import { updatePassword, type ResetState } from "./actions";

const inputClass =
  "h-14 w-full rounded-md border border-border bg-card px-4 text-lg text-fg focus:border-accent focus:outline-none";

export function ResetForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePassword, {});
  return (
    <form action={action} className="flex flex-1 flex-col">
      {/* lets password managers attach the new password to the right account */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <label htmlFor="password" className="text-muted text-xs">
        新しいパスワード（{PASSWORD_MIN}文字以上）
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        className={`${inputClass} mt-2`}
      />
      <label htmlFor="confirm" className="text-muted mt-4 text-xs">
        新しいパスワード（確認）
      </label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        className={`${inputClass} mt-2`}
      />
      {state.error && (
        <p role="alert" className="text-warn mt-4 text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-auto" disabled={pending}>
        パスワードを設定
      </Button>
    </form>
  );
}
