// Smoke test of the panel with a mocked Home Assistant (dev/mock-hass.ts).
import { expect, test } from "@playwright/test";

test("create a project and add a widget", async ({ page }) => {
  await page.goto("/dev/index.html");
  await expect(page.getByText("CYD Studio").first()).toBeVisible();
  await page.getByRole("button", { name: "+ Neues Projekt" }).first().click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByText("Leer", { exact: true }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.locator("cyd-wizard input").first().fill("Küche");
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.locator("cyd-screen")).toBeVisible();
  await page.getByText("Schalter-Kachel").click();
  await expect(page.locator("cyd-screen .w")).toHaveCount(1);
  await page.keyboard.press("Control+z");
  await expect(page.locator("cyd-screen .w")).toHaveCount(0);
  await page.getByRole("button", { name: "Code erzeugen" }).click();
  await expect(page.locator("cyd-export-dialog pre")).toContainText("Dev-Modus");
});
