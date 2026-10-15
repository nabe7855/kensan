"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { PASSWORD_MIN } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { login, requestReset, signup, type AuthState } from "./actions";

type Mode = "login" | "signup" | "reset";

const inputClass =
  "h-14 w-full rounded-md border border-border bg-card px-4 text-lg text-fg placeholder:text-ghost focus:border-accent focus:outline-none";

function Messages({ state, local }: { state: AuthState; local: string | null }) {
  const error = local ?? state.error;
  if (error) {
    return (
      <p role="alert" className="text-warn mt-4 text-sm">
        {error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p role="status" className="text-muted mt-4 text-sm leading-relaxed">
        {state.notice}
      </p>
    );
  }
  return null;
}

function PasswordField({
  id,
  label,
  autoComplete,
}: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label htmlFor={id} className="text-muted mt-4 text-xs">
        {label}
      </label>
      <span className="relative mt-2 block">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className={cn(inputClass, "pr-14")}
        />
        <button
          type="button"
          aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
          onClick={() => setShow((v) => !v)}
          className="text-ghost absolute top-1 right-1 flex size-12 items-center justify-center"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
    </>
  );
}

function AuthPanel({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const action = mode === "login" ? login : mode === "signup" ? signup : requestReset;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const [local, setLocal] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        if (mode === "signup" && data.get("password") !== data.get("confirm")) {
          e.preventDefault();
          setLocal("確認用パスワードが一致しません");
          return;
        }
        setLocal(null);
      }}
      className="flex flex-1 flex-col"
    >
      <label htmlFor="email" className="text-muted text-xs">
        メールアドレス
      </label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete={mode === "signup" ? "email" : "username"}
        required
        defaultValue={state.email}
        className={cn(inputClass, "mt-2")}
      />

      {mode === "login" && (
        <PasswordField id="password" label="パスワード" autoComplete="current-password" />
      )}
      {mode === "signup" && (
        <>
          <PasswordField
            id="password"
            label={`パスワード（${PASSWORD_MIN}文字以上）`}
            autoComplete="new-password"
          />
          <PasswordField id="confirm" label="パスワード（確認）" autoComplete="new-password" />
        </>
      )}
      {mode === "reset" && (
        <p className="text-ghost mt-3 text-xs leading-relaxed">
          パスワード再設定のリンクをメールで送ります。届いたリンクは、この端末のブラウザで開いてください
        </p>
      )}

      <Messages state={state} local={local} />

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button type="submit" size="lg" disabled={pending}>
          {mode === "login"
            ? "ログイン"
            : mode === "signup"
              ? "登録して始める"
              : "再設定メールを送る"}
        </Button>
        {mode === "login" && (
          <Button type="button" variant="ghost" onClick={() => onMode("reset")}>
            パスワードを忘れた
          </Button>
        )}
        {mode === "reset" ? (
          <Button type="button" variant="ghost" onClick={() => onMode("login")}>
            ログインに戻る
          </Button>
        ) : (
          <Button asChild variant="ghost">
            <Link href="/login">戻る</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

export function EmailLoginForm() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="flex flex-1 flex-col">
      {mode !== "reset" ? (
        <div
          role="tablist"
          aria-label="ログインか新規登録"
          className="border-border mb-6 grid grid-cols-2 overflow-hidden rounded-md border"
        >
          {(
            [
              ["login", "ログイン"],
              ["signup", "新規登録"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "h-12 text-sm",
                mode === m ? "bg-accent text-bg font-bold" : "bg-bg text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mb-6 text-lg font-bold">パスワードの再設定</p>
      )}
      {/* key resets the action state when switching modes */}
      <AuthPanel key={mode} mode={mode} onMode={setMode} />
    </div>
  );
}
