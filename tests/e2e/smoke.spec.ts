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
  await expect(page.getByLabel("メールアドレス")).toBeFocused();
  await expect(page.getByRole("button", { name: "コードを送る" })).toBeVisible();
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
