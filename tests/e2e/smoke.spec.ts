import { expect, test } from "@playwright/test";

test("unauthenticated users are sent to login", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "研鑽" })).toBeVisible();
});

test("root redirects through to login when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("onboarding requires sign-in", async ({ page }) => {
  await page.goto("/onboarding/prep");
  await expect(page).toHaveURL(/\/login$/);
});

test("login offers email and a disabled Google button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("最後まで、研ぎ切る")).toBeVisible();
  await expect(page.getByRole("button", { name: /Google で続ける/ })).toBeDisabled();

  await page.getByRole("link", { name: "メールで続ける" }).click();
  await expect(page).toHaveURL(/\/login\/email$/);
  await expect(page.getByRole("tab", { name: "ログイン" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
});

test("sign-up checks the confirmation password before sending", async ({ page }) => {
  await page.goto("/login/email");
  await page.getByRole("tab", { name: "新規登録" }).click();
  await page.getByLabel("メールアドレス").fill("e2e@example.com");
  await page.getByLabel(/パスワード（8文字以上）/).fill("abcd1234");
  await page.getByLabel("パスワード（確認）").fill("abcd9999");
  await page.getByRole("button", { name: "登録して始める" }).click();
  await expect(page.getByText("確認用パスワードが一致しません")).toBeVisible();
  await expect(page).toHaveURL(/\/login\/email$/);
});

test("forgot password switches to the reset form", async ({ page }) => {
  await page.goto("/login/email");
  await page.getByRole("button", { name: "パスワードを忘れた" }).click();
  await expect(page.getByText("パスワードの再設定")).toBeVisible();
  await expect(page.getByRole("button", { name: "再設定メールを送る" })).toBeVisible();
  await page.getByRole("button", { name: "ログインに戻る" }).click();
  await expect(page.getByRole("tab", { name: "ログイン" })).toBeVisible();
});

test("password reset page requires a session", async ({ page }) => {
  await page.goto("/auth/reset");
  await expect(page).toHaveURL(/\/login$/);
});

test("auth callback without params returns to login with an error", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/login\?error=auth$/);
  await expect(page.getByText(/ログインできませんでした/)).toBeVisible();
});

test("PWA manifest, icons and service worker are public", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).start_url).toBe("/home");
  expect((await request.get("/icons/icon-192.png")).ok()).toBe(true);
  const sw = await request.get("/sw.js");
  expect(sw.ok()).toBe(true);
  expect(sw.headers()["content-type"]).toContain("javascript");
});
