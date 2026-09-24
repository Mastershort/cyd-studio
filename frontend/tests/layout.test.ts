// The TypeScript layout must reproduce tests/layout_cases.json (generated from the Python generator).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { headerElements, pageLayout, tabElements, widgetElements } from "../src/layout";
import type { Project } from "../src/types";

interface Cases {
  layouts: { input: { project: Project; width: number; height: number }; expected: Record<string, unknown> }[];
  elements: { input: { type: string; w: number; h: number; props: Record<string, unknown> }; expected: unknown[] }[];
  tabs: { input: { icons: boolean; labels: boolean; tab: number[] }; expected: unknown[] }[];
}

const cases = JSON.parse(readFileSync(resolve(__dirname, "../../tests/layout_cases.json"), "utf8")) as Cases;
const list = (r: { x: number; y: number; w: number; h: number } | null) => (r ? [r.x, r.y, r.w, r.h] : null);

describe("layout parity with generator/layout.py", () => {
  it("page layouts", () => {
    for (const c of cases.layouts) {
      const { project, width, height } = c.input;
      const lay = pageLayout(project, project.pages[0], width, height);
      const got = {
        header: list(lay.header),
        tabbar: list(lay.tabbar),
        content: list(lay.content),
        widgets: Object.fromEntries(Object.entries(lay.widgets).map(([k, v]) => [k, list(v)])),
        tabs: lay.tabs.map(list),
        header_elements: lay.header ? headerElements(project, lay.header) : [],
      };
      expect(got).toEqual(c.expected);
    }
  });

  it("widget elements", () => {
    for (const c of cases.elements) {
      expect(widgetElements(c.input.type, c.input.w, c.input.h, c.input.props)).toEqual(c.expected);
    }
  });

  it("tab elements", () => {
    for (const c of cases.tabs) {
      const [x, y, w, h] = c.input.tab;
      expect(tabElements(c.input.icons, c.input.labels, { x, y, w, h })).toEqual(c.expected);
    }
  });
});
