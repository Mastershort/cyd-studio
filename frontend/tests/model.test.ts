import { describe, expect, it } from "vitest";
import { applyTemplate, findFreeSpot, normalize, pageIdFrom, resolveBoard, slugify } from "../src/model";
import type { Board, Page } from "../src/types";

describe("model helpers", () => {
  it("slugifies device names like ESPHome expects", () => {
    expect(slugify("Wohnzimmer Süd")).toBe("wohnzimmer-sued");
    expect(slugify("  Küche/Essen!! ")).toBe("kueche-essen");
    expect(slugify("x".repeat(40)).length).toBe(31);
    expect(slugify("€€€")).toBe("cyd");
  });

  it("creates unique page ids", () => {
    expect(pageIdFrom("Licht", ["licht"])).toBe("licht_2");
  });

  it("finds free grid spots", () => {
    const page: Page = { id: "p", name: "p", widgets: [{ id: "a", type: "label", x: 0, y: 0, w: 2, h: 1, props: {} }] };
    expect(findFreeSpot(page, 4, 3, 2, 1)).toEqual({ x: 2, y: 0 });
    expect(findFreeSpot(page, 2, 1, 1, 1)).toBeNull();
  });

  it("resolves variants and rotation", () => {
    const board = {
      id: "b", name: "b", native: { width: 240, height: 320 },
      display: { model: "ILI9341", variants: [{ id: "v", label: "v", label_en: "v", native: { width: 320, height: 240 }, orientations: { landscape: { rotation: 180 } } }] },
      orientations: { landscape: { rotation: 90 }, portrait: { rotation: 180 } },
    } as Board;
    expect(resolveBoard(board, null, "landscape")).toEqual({ width: 320, height: 240, rotation: 90 });
    expect(resolveBoard(board, "v", "landscape")).toEqual({ width: 320, height: 240, rotation: 180 });
    expect(resolveBoard(board, null, "portrait")).toEqual({ width: 240, height: 320, rotation: 180 });
  });

  it("applies templates and normalizes", () => {
    const tpl = { pages: [{ id: "home", name: "Start", widgets: [{ id: "a", type: "toggle_tile", x: 0, y: 0, w: 1, h: 1, entity: "{{l}}", props: {} }] }] };
    const out = normalize(applyTemplate(tpl, { l: "light.x" }));
    expect(out.pages[0].widgets[0].entity).toBe("light.x");
    expect(out.navigation?.home_page).toBe("home");
    expect(normalize(applyTemplate(tpl, {})).pages[0].widgets[0].entity).toBeNull();
  });
});
