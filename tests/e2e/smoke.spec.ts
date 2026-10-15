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
