// Smoke test of the panel with a mocked Home Assistant (dev/mock-hass.ts).
import { expect, test } from "@playwright/test";

test("create a project and add a widget", async ({ page }) => {
  await page.goto("/dev/index.html");
  await expect(page.getByText("CYD Studio").first()).toBeVisible();
  // golden projects are not in HA yet -> connection guide with key copy button
  await expect(page.getByText("so verbindest du es").first()).toBeVisible();
  await page.getByText("so verbindest du es").first().click();
  await expect(page.getByRole("button", { name: "Schlüssel kopieren" }).first()).toBeVisible();
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
  // ESPHome device may not perform actions yet -> banner with one-click fix (after confirmation)
  await expect(page.getByText("darf Home Assistant noch nicht steuern")).toBeVisible();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Jetzt erlauben" }).first().click();
  await expect(page.getByText("Erlaubt – das Display kann jetzt schalten.")).toBeVisible();
  await page.getByRole("button", { name: "Code erzeugen" }).click();
  await expect(page.locator("cyd-export-dialog pre").first()).toContainText("Dev-Modus");
  // save to ESPHome: hand-edited file -> diff + confirm -> saved -> WiFi form
  await page.getByRole("button", { name: "In ESPHome speichern" }).click();
  await expect(page.getByText("von Hand geändert")).toBeVisible();
  await page.getByRole("button", { name: "Trotzdem speichern" }).click();
  await expect(page.getByText("Gespeichert: /config/esphome/cyd-dev.yaml")).toBeVisible();
  await page.getByPlaceholder("WLAN-Name (SSID)").fill("MeinWLAN");
  await page.getByRole("button", { name: "In secrets.yaml speichern" }).click();
  await expect(page.getByText("WLAN-Daten gespeichert.")).toBeVisible();
});
