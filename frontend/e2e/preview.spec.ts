// Preview snapshots: every page of every golden project at native resolution.
import { expect, test } from "@playwright/test";

test("golden project previews", async ({ page }) => {
  await page.goto("/dev/preview.html");
  await page.waitForSelector("body[data-ready='1']");
  const names = await page.$$eval("canvas[data-snapshot]", (els) => els.map((e) => (e as HTMLElement).dataset.snapshot!));
  expect(names.length).toBeGreaterThan(5);
  for (const name of names) {
    // PNG of the canvas itself (native pixels, not the scaled element)
    const data = await page.$eval(`canvas[data-snapshot="${name}"]`, (c) => (c as HTMLCanvasElement).toDataURL("image/png"));
    expect(Buffer.from(data.split(",")[1], "base64")).toMatchSnapshot(`${name}.png`);
  }
});
