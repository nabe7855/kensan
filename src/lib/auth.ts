import { z } from "zod";

export const PASSWORD_MIN = 8;

const email = z.email("メールアドレスを確認してください");
const password = z
  .string()
  .min(PASSWORD_MIN, `パスワードは${PASSWORD_MIN}文字以上にしてください`)
  .max(72, "パスワードは72文字以内にしてください");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "パスワードを入力してください"),
});

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "確認用パスワードが一致しません",
  });

export const signupSchema = z
  .object({ email, password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "確認用パスワードが一致しません",
  });

export const emailSchema = z.object({ email });

/** First validation message, for showing under the form. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容を確認してください";
}

/** Japanese message for a Supabase Auth error (by error code, then HTTP status). */
export function authErrorMessage(err: { code?: string; status?: number } | null): string {
  switch (err?.code) {
    case "invalid_credentials":
      return "メールアドレスかパスワードが違います";
    case "user_already_exists":
    case "email_exists":
      return "このメールアドレスは登録済みです。ログインしてください";
    case "weak_password":
      return `パスワードが弱すぎます。${PASSWORD_MIN}文字以上で、推測されにくいものにしてください`;
    case "same_password":
      return "今と同じパスワードです。別のパスワードにしてください";
    case "email_not_confirmed":
      return "メールアドレスの確認が済んでいません。届いたメールのリンクを開いてください";
    case "over_email_send_rate_limit":
      return "メールの送信上限に達しました。1時間ほどおいてからお試しください";
    case "over_request_rate_limit":
      return "操作が続いたため一時的に制限されています。少し待ってからお試しください";
    case "signup_disabled":
      return "現在、新規登録を受け付けていません";
  }
  if (err?.status === 429) return "回数の上限に達しました。少し待ってからお試しください";
  return "うまくいきませんでした。電波の良い場所でもう一度お試しください";
}

export const changeEmailSchema = z.object({
  email,
  password: z.string().min(1, "今のパスワードを入力してください"),
});
