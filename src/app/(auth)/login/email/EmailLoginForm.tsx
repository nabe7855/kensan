"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { emailLogin, type EmailState } from "./actions";

const INITIAL: EmailState = { step: "email", email: "" };

const inputClass =
  "h-14 w-full rounded-md border border-border bg-card px-4 text-lg text-fg placeholder:text-ghost focus:border-accent focus:outline-none";

function Messages({ state }: { state: EmailState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-warn mt-4 text-sm">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p role="status" className="text-muted mt-4 text-sm">
        {state.notice}
      </p>
    );
  }
  return null;
}

export function EmailLoginForm() {
  const [state, action, pending] = useActionState(emailLogin, INITIAL);

  if (state.step === "code") {
    return (
      <form action={action} className="flex flex-1 flex-col">
        <p className="text-muted text-sm">
          <span className="text-fg">{state.email}</span> にコードを送りました
        </p>
        <label htmlFor="code" className="text-muted mt-8 text-xs">
          確認コード
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          autoFocus
          placeholder="000000"
          className={`${inputClass} num mt-2 text-center text-3xl tracking-[0.4em]`}
        />
        <p className="text-ghost mt-3 text-xs">
          メール内のリンクを同じ端末のブラウザで開いてもログインできます
        </p>
        <Messages state={state} />
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button type="submit" size="lg" name="intent" value="verify" disabled={pending}>
            ログイン
          </Button>
          <Button type="submit" variant="ghost" name="intent" value="resend" disabled={pending}>
            コードを再送する
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-1 flex-col">
      <label htmlFor="email" className="text-muted text-xs">
        メールアドレス
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        autoFocus
        defaultValue={state.email}
        className={`${inputClass} mt-2`}
      />
      <p className="text-ghost mt-3 text-xs">ログイン用のコードを送ります。パスワードは不要です</p>
      <Messages state={state} />
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button type="submit" size="lg" name="intent" value="send" disabled={pending}>
          コードを送る
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">戻る</Link>
        </Button>
      </div>
    </form>
  );
}
