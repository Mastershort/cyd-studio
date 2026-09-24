// Action builder: a tap with own steps opens another page in the preview.
import { expect, test } from "@playwright/test";

test("tap with own actions opens a page", async ({ page }) => {
  await page.goto("/dev/index.html");
  await page.getByRole("button", { name: "+ Neues Projekt" }).first().click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByText("Leer", { exact: true }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.locator("cyd-wizard input").first().fill("Flur");
  await page.getByRole("button", { name: "Anlegen" }).click();
  await page.getByRole("button", { name: "+ Seite hinzufügen" }).click();
  await page.locator(".page-row").first().click();
  await page.getByText("Schalter-Kachel").click();
  // Tap: own actions -> step "open page" -> the new page
  const tap = page.locator(".trigger").first();
  await tap.locator("select").first().selectOption("custom");
  await tap.locator(".step select").first().selectOption("page");
  await tap.locator(".step select").nth(1).selectOption({ label: "Seite 2" });
  await page.getByRole("button", { name: "▶ Vorschau" }).click();
  const canvas = page.locator("cyd-screen canvas").first();
  const box = (await canvas.boundingBox())!;
  const firstRow = page.locator(".page-row").first();
  await expect(firstRow).toHaveClass(/active/);
  // first grid cell (top left, below the header)
  await canvas.click({ position: { x: box.width * 0.12, y: box.height * 0.3 } });
  await expect(page.locator(".page-row").nth(1)).toHaveClass(/active/);
});
