import { describe, expect, it } from "vitest";
import { authErrorMessage, firstIssue, loginSchema, signupSchema } from "@/lib/auth";

describe("signupSchema", () => {
  it("accepts a valid email and matching 8+ char passwords", () => {
    expect(
      signupSchema.safeParse({ email: "a@example.com", password: "abcd1234", confirm: "abcd1234" })
        .success,
    ).toBe(true);
  });

  it("explains short and mismatched passwords", () => {
    const short = signupSchema.safeParse({
      email: "a@example.com",
      password: "abc",
      confirm: "abc",
    });
    expect(short.success || firstIssue(short.error)).toBe("パスワードは8文字以上にしてください");
    const mismatch = signupSchema.safeParse({
      email: "a@example.com",
      password: "abcd1234",
      confirm: "abcd1235",
    });
    expect(mismatch.success || firstIssue(mismatch.error)).toBe("確認用パスワードが一致しません");
  });

  it("rejects a malformed email", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(r.success || firstIssue(r.error)).toBe("メールアドレスを確認してください");
  });
});

describe("authErrorMessage", () => {
  it("maps Supabase error codes", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400 })).toMatch(/違います/);
    expect(authErrorMessage({ code: "user_already_exists", status: 422 })).toMatch(/登録済み/);
    expect(authErrorMessage({ code: "over_email_send_rate_limit", status: 429 })).toMatch(/1時間/);
  });

  it("falls back on status, then a generic message", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/上限/);
    expect(authErrorMessage(null)).toMatch(/もう一度/);
  });
});
