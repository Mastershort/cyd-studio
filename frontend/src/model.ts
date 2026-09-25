// Project helpers mirroring generator/model.py (defaults) and generator/board.py (variants).
import type { Board, Page, Project, Widget, WidgetDef } from "./types";

export const ON_STATES = ["on", "open", "opening", "unlocked", "home", "playing"];

export function defaultProject(): Project {
  return {
    schema: 1,
    id: "",
    name: "CYD",
    device_name: "cyd-display",
    board: "esp32-2432s028r",
    board_variant: null,
    orientation: "landscape",
    grid: { cols: 4, rows: 3, gap: 8, padding: 8 },
    theme: "mastershort_dark",
    theme_overrides: {},
    settings: {
      brightness_day: 100,
      brightness_night: 25,
      night_mode: { source: "off", threshold: 2.6, invert: false, from: "22:00", to: "06:30", entity: null },
      screensaver: { enabled: false, after_s: 60, action: "dim" },
      return_home_after_s: 30,
      rgb_led: { enabled: false, show_status: false },
      wifi: { use_secrets: true, ap_fallback: true },
      language: "de",
      api_key: null,
      device_actions: true,
    },
    global: {
      header: { enabled: true, height: 28, widgets: [{ type: "page_title", align: "left" }, { type: "clock", align: "right" }] },
      footer: { enabled: false, height: 36, widgets: [] },
    },
    pages: [],
    navigation: {
      style: "tabbar", tabbar_position: "bottom", show_labels: true, show_icons: true, swipe: true,
      wrap_around: false, home_page: null, transition: "slide",
    },
    popups: [],
    meta: {},
  };
}

function deepDefaults<T>(value: unknown, def: T): T {
  if (def && typeof def === "object" && !Array.isArray(def) && value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = structuredClone(def) as Record<string, unknown>;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = k in (def as Record<string, unknown>) ? deepDefaults(v, (def as Record<string, unknown>)[k]) : structuredClone(v);
    }
    return out as T;
  }
  return (value === undefined ? structuredClone(def) : structuredClone(value)) as T;
}

export function normalize(project: Partial<Project>): Project {
  const out = deepDefaults(project, defaultProject());
  for (const page of out.pages) {
    page.parent ??= null;
    page.in_navigation ??= !page.parent;
    page.icon ??= "mdi:checkbox-blank-outline";
    page.layout ??= "grid";
    page.widgets ??= [];
    for (const w of page.widgets) w.props ??= {};
  }
  if (!out.navigation!.home_page && out.pages.length) out.navigation!.home_page = out.pages[0].id;
  return out;
}

export interface ResolvedBoard {
  width: number;
  height: number;
  rotation: number;
}

export function resolveBoard(board: Board, variant: string | null | undefined, orientation: string): ResolvedBoard {
  let native = board.native;
  let orientations = board.orientations;
  const v = board.display.variants?.find((x) => x.id === variant);
  if (v?.native) native = v.native;
  if (v?.orientations) orientations = { ...orientations, ...v.orientations };
  const rotation = orientations[orientation]?.rotation ?? 0;
  const swap = rotation === 90 || rotation === 270;
  return { width: swap ? native.height : native.width, height: swap ? native.width : native.height, rotation };
}

const TRANSLIT: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

export function slugify(text: string, maxLen = 31): string {
  const s = text.toLowerCase().replace(/[äöüß]/g, (c) => TRANSLIT[c]).normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s.slice(0, maxLen).replace(/-+$/g, "") || "cyd";
}

export function pageIdFrom(name: string, existing: string[]): string {
  const base = slugify(name, 24).replace(/-/g, "_") || "page";
  let id = base;
  let i = 2;
  while (existing.includes(id)) id = `${base}_${i++}`;
  return id;
}

export function newWidgetId(page: Page): string {
  let i = page.widgets.length + 1;
  const ids = new Set(page.widgets.map((w) => w.id));
  while (ids.has(`w${i}`)) i++;
  return `w${i}`;
}

export function defaultProps(def: WidgetDef): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const p of def.props) if (p.default !== null && p.default !== undefined) props[p.key] = p.default;
  return props;
}

/** First free grid position for a widget of size w x h, or null. */
export function findFreeSpot(page: Page, cols: number, rows: number, w: number, h: number, ignore?: string): { x: number; y: number } | null {
  for (let y = 0; y + h <= rows; y++) {
    for (let x = 0; x + w <= cols; x++) {
      if (!overlapsAny(page.widgets, { x, y, w, h }, ignore)) return { x, y };
    }
  }
  return null;
}

export function overlapsAny(widgets: Widget[], r: { x: number; y: number; w: number; h: number }, ignore?: string): boolean {
  return widgets.some((o) => o.id !== ignore && r.x < o.x + o.w && o.x < r.x + r.w && r.y < o.y + o.h && o.y < r.y + r.h);
}

export function rootOf(project: Project, page: Page): Page {
  const byId = new Map(project.pages.map((p) => [p.id, p]));
  const seen = new Set<string>();
  let cur = page;
  while (cur.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parent)!;
  }
  return cur;
}

/** Apply a template: replace {{placeholder}} strings with chosen entities. */
export function applyTemplate(tpl: Partial<Project>, mapping: Record<string, string>, language: "de" | "en" = "de"): Partial<Project> {
  const text = JSON.stringify(tpl).replace(/\{\{(\w+)\}\}/g, (_, key: string) => mapping[key] ?? "");
  const out = JSON.parse(text) as Partial<Project>;
  // templates carry English page names / labels as name_en / label_en
  const localize = (obj: Record<string, unknown>, key: string) => {
    const en = obj[`${key}_en`];
    if (language === "en" && typeof en === "string") obj[key] = en;
    delete obj[`${key}_en`];
  };
  for (const page of out.pages ?? []) {
    localize(page as unknown as Record<string, unknown>, "name");
    for (const w of page.widgets) {
      localize(w.props, "label");
      if (w.entity === "") w.entity = null;
      if (w.action && w.action.target === "") w.action.target = null;
    }
  }
  return out;
}
