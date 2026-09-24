// Shared layout rules – exact port of custom_components/cyd_studio/generator/layout.py.
// Both implementations must produce identical results for tests/layout_cases.json.
// Integer arithmetic with floor division only (all operands are non-negative).
import type { Project, Page, Widget } from "./types";

export const TABBAR_H_LABELS = 40;
export const TABBAR_H_ICONS = 32;
export const TABBAR_W_LEFT = 48;
export const HEADER_PAD_X = 6;
export const TILE_PAD = 6;
export const ELEMENT_GAP = 6;
export const ASCENT_PER_MILLE = 968;
export const LINE_HEIGHT_PER_MILLE = 1219;
// Material Design Icons webfont: unitsPerEm 512, ascender 448, descender -64
export const ICON_ASCENT_PER_MILLE = 875;

export const DEFAULT_FONT_SIZES: Record<string, number> = { xs: 12, s: 14, m: 16, l: 20, xl: 28, xxl: 40 };
export const DEFAULT_ICON_SIZES: Record<string, number> = { s: 20, m: 28, l: 40 };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Element {
  kind: "icon" | "text";
  role: string;
  align: string;
  x: number;
  y: number;
  width: number | null;
  size: number;
  color: string;
  text_align: string;
}

const fdiv = (a: number, b: number): number => Math.floor(a / b);

export function lineHeight(size: number): number {
  return -fdiv(-size * LINE_HEIGHT_PER_MILLE, 1000); // ceil
}

export function screenSize(nativeW: number, nativeH: number, rotation: number): [number, number] {
  return rotation === 90 || rotation === 270 ? [nativeH, nativeW] : [nativeW, nativeH];
}

function edges(start: number, length: number, count: number, gap: number, index: number): [number, number] {
  const first = start + fdiv(index * (length + gap), count);
  const last = start + fdiv((index + 1) * (length + gap), count) - gap;
  return [first, last];
}

export function split(start: number, length: number, count: number, gap: number, index: number, span = 1): [number, number] {
  const [first] = edges(start, length, count, gap, index);
  const [, last] = edges(start, length, count, gap, index + span - 1);
  return [first, last - first];
}

export function navPages(project: Project): Page[] {
  return (project.pages ?? []).filter((p) => !p.parent && (p.in_navigation ?? true));
}

export interface Chrome {
  header: Rect | null;
  tabbar: Rect | null;
  content: Rect;
}

export function chrome(project: Project, page: Page, width: number, height: number): Chrome {
  const headerCfg = project.global?.header ?? { enabled: false };
  const nav = project.navigation ?? {};
  let header: Rect | null = null;
  let tabbar: Rect | null = null;
  let top = 0;
  let left = 0;
  let bottom = height;
  if (headerCfg.enabled && (page.show_header ?? true)) {
    const hh = Math.trunc(headerCfg.height ?? 28);
    header = { x: 0, y: 0, w: width, h: hh };
    top = hh;
  }
  if (nav.style === "tabbar" && navPages(project).length > 0) {
    const position = nav.tabbar_position ?? "bottom";
    const barH = (nav.show_labels ?? true) ? TABBAR_H_LABELS : TABBAR_H_ICONS;
    if (position === "top") {
      tabbar = { x: 0, y: top, w: width, h: barH };
      top += barH;
    } else if (position === "left") {
      tabbar = { x: 0, y: top, w: TABBAR_W_LEFT, h: height - top };
      left = TABBAR_W_LEFT;
    } else {
      tabbar = { x: 0, y: height - barH, w: width, h: barH };
      bottom = height - barH;
    }
  }
  return { header, tabbar, content: { x: left, y: top, w: width - left, h: bottom - top } };
}

export function tabRects(project: Project, tabbar: Rect): Rect[] {
  const pages = navPages(project);
  const count = pages.length;
  const vertical = (project.navigation?.tabbar_position ?? "bottom") === "left";
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    if (vertical) {
      const [y, h] = split(tabbar.y, tabbar.h, count, 0, i);
      rects.push({ x: tabbar.x, y, w: tabbar.w, h });
    } else {
      const [x, w] = split(tabbar.x, tabbar.w, count, 0, i);
      rects.push({ x, y: tabbar.y, w, h: tabbar.h });
    }
  }
  return rects;
}

export interface Grid {
  cols: number;
  rows: number;
  gap: number;
  padding: number;
}

export function pageGrid(project: Project, page: Page): Grid {
  const grid = { ...(project.grid ?? {}), ...(page.grid_override ?? {}) };
  return {
    cols: Math.trunc(grid.cols ?? 4),
    rows: Math.trunc(grid.rows ?? 3),
    gap: Math.trunc(grid.gap ?? 8),
    padding: Math.trunc(grid.padding ?? 8),
  };
}

export function widgetRect(content: Rect, grid: Grid, widget: Pick<Widget, "x" | "y" | "w" | "h">, free = false): Rect {
  if (free) {
    return { x: content.x + widget.x, y: content.y + widget.y, w: widget.w, h: widget.h };
  }
  const pad = grid.padding;
  const innerW = content.w - 2 * pad;
  const innerH = content.h - 2 * pad;
  const [x, w] = split(content.x + pad, innerW, grid.cols, grid.gap, widget.x, widget.w);
  const [y, h] = split(content.y + pad, innerH, grid.rows, grid.gap, widget.y, widget.h);
  return { x, y, w, h };
}

export interface PageLayout extends Chrome {
  grid: Grid;
  widgets: Record<string, Rect>;
  tabs: Rect[];
}

export function pageLayout(project: Project, page: Page, width: number, height: number): PageLayout {
  const parts = chrome(project, page, width, height);
  const grid = pageGrid(project, page);
  const free = page.layout === "free";
  const widgets: Record<string, Rect> = {};
  for (const w of page.widgets ?? []) widgets[w.id] = widgetRect(parts.content, grid, w, free);
  const tabs = parts.tabbar ? tabRects(project, parts.tabbar) : [];
  return { ...parts, grid, widgets, tabs };
}

/** Inverse of widgetRect for the editor: grid cell under a content-relative pixel. */
export function cellAt(content: Rect, grid: Grid, px: number, py: number): { x: number; y: number } {
  const pad = grid.padding;
  const innerW = content.w - 2 * pad;
  const innerH = content.h - 2 * pad;
  const cx = Math.min(grid.cols - 1, Math.max(0, fdiv((px - content.x - pad) * grid.cols, Math.max(innerW, 1))));
  const cy = Math.min(grid.rows - 1, Math.max(0, fdiv((py - content.y - pad) * grid.rows, Math.max(innerH, 1))));
  return { x: cx, y: cy };
}

// ---------------------------------------------------------------------------
// Inner elements of widgets
// ---------------------------------------------------------------------------

function el(kind: "icon" | "text", role: string, align: string, x: number, y: number, size: number, color: string,
  width: number | null = null, textAlign = "left"): Element {
  return { kind, role, align, x, y, width, size, color, text_align: textAlign };
}

type Props = Record<string, unknown>;

export function widgetElements(wtype: string, w: number, h: number, props: Props,
  fontSizes: Record<string, number> = {}, iconSizes: Record<string, number> = {}): Element[] {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const cw = Math.max(w - 2 * TILE_PAD, 1);
  const ch = Math.max(h - 2 * TILE_PAD, 1);
  const els: Element[] = [];
  const hasIcon = Boolean(props.icon);

  if (wtype === "toggle_tile" || wtype === "binary_indicator" || wtype === "sensor_value") {
    const mainSize = wtype === "sensor_value" ? fs.l : fs.s;
    const subSize = fs.xs;
    const tall = ch >= ics.m + lineHeight(mainSize) + fdiv(lineHeight(subSize), 2);
    if (tall) {
      if (wtype === "sensor_value") {
        const big = ch >= ics.s + lineHeight(fs.xl) ? fs.xl : fs.l;
        els.push(el("text", "label", "TOP_LEFT", 0, 0, subSize, "text_muted", cw - (hasIcon ? ics.s + ELEMENT_GAP : 0)));
        if (hasIcon) els.push(el("icon", "icon", "TOP_RIGHT", 0, 0, ics.s, "accent"));
        els.push(el("text", "value", "BOTTOM_LEFT", 0, 0, big, "text", cw));
      } else {
        if (hasIcon) els.push(el("icon", "icon", "TOP_LEFT", 0, 0, ics.m, "state_icon"));
        if ((wtype === "toggle_tile" && (props.show_state ?? true)) || wtype === "binary_indicator") {
          els.push(el("text", "state", "TOP_RIGHT", 0, 0, subSize, "text_muted", cw - (hasIcon ? ics.m + ELEMENT_GAP : 0), "right"));
        }
        els.push(el("text", "label", "BOTTOM_LEFT", 0, 0, mainSize, "text", cw));
      }
    } else {
      const iconSize = ch >= ics.m && cw >= 3 * ics.m ? ics.m : ics.s;
      const tx = hasIcon ? iconSize + ELEMENT_GAP : 0;
      const tw = Math.max(cw - tx, 1);
      if (hasIcon) els.push(el("icon", "icon", "LEFT_MID", 0, 0, iconSize, wtype === "sensor_value" ? "accent" : "state_icon"));
      if (wtype === "sensor_value") {
        els.push(el("text", "value", "TOP_LEFT", tx, 0, mainSize, "text", tw));
        els.push(el("text", "label", "BOTTOM_LEFT", tx, 0, subSize, "text_muted", tw));
      } else {
        const showState = wtype === "binary_indicator" || (props.show_state ?? true);
        if (showState && ch >= lineHeight(mainSize) + lineHeight(subSize)) {
          els.push(el("text", "label", "TOP_LEFT", tx, 0, mainSize, "text", tw));
          els.push(el("text", "state", "BOTTOM_LEFT", tx, 0, subSize, "text_muted", tw));
        } else {
          els.push(el("text", "label", "LEFT_MID", tx, 0, mainSize, "text", tw));
        }
      }
    }
    return els;
  }

  if (wtype === "clock") {
    let size = fs[String(props.size ?? "xl")] ?? fs.xl;
    if (props.show_date ?? true) {
      let dateSize = size <= fs.l ? fs.xs : fs.s;
      if (lineHeight(size) + lineHeight(dateSize) > ch) {
        size = fs.l;
        dateSize = fs.xs;
      }
      const lhT = lineHeight(size);
      const lhD = lineHeight(dateSize);
      els.push(el("text", "time", "CENTER", 0, -fdiv(lhD, 2), size, "text", cw, "center"));
      els.push(el("text", "date", "CENTER", 0, fdiv(lhT, 2), dateSize, "text_muted", cw, "center"));
    } else {
      els.push(el("text", "time", "CENTER", 0, 0, size, "text", cw, "center"));
    }
    return els;
  }

  if (wtype === "label") {
    const size = fs[String(props.size ?? "m")] ?? fs.m;
    const align = String(props.align ?? "center");
    const lvAlign = align === "left" ? "LEFT_MID" : align === "right" ? "RIGHT_MID" : "CENTER";
    els.push(el("text", "text", lvAlign, 0, 0, size, props.muted ? "text_muted" : "text", cw, align));
    return els;
  }

  if (wtype === "scene_button" || wtype === "page_button") {
    const lh = lineHeight(fs.s);
    if (hasIcon && ch >= ics.m + lh + 2) {
      els.push(el("icon", "icon", "CENTER", 0, -fdiv(lh, 2) - 1, ics.m, "accent"));
      els.push(el("text", "label", "CENTER", 0, fdiv(ics.m, 2) + 1, fs.s, "text", cw, "center"));
    } else if (hasIcon) {
      const iconSize = ch >= ics.m ? ics.m : ics.s;
      els.push(el("icon", "icon", "LEFT_MID", 0, 0, iconSize, "accent"));
      els.push(el("text", "label", "LEFT_MID", iconSize + ELEMENT_GAP, 0, fs.s, "text", Math.max(cw - iconSize - ELEMENT_GAP, 1)));
    } else {
      els.push(el("text", "label", "CENTER", 0, 0, fs.s, "text", cw, "center"));
    }
    return els;
  }

  if (wtype === "page_title") {
    const size = fs[String(props.size ?? "m")] ?? fs.m;
    if (props._has_back) {
      const iconSize = ics.s;
      els.push(el("icon", "back", "LEFT_MID", 0, 0, iconSize, "accent"));
      els.push(el("text", "title", "LEFT_MID", iconSize + ELEMENT_GAP, 0, size, "text", Math.max(cw - iconSize - ELEMENT_GAP, 1)));
    } else {
      els.push(el("text", "title", "LEFT_MID", 0, 0, size, "text", cw));
    }
    return els;
  }
  return els;
}

export function headerElements(project: Project, _header: Rect, fontSizes: Record<string, number> = {},
  iconSizes: Record<string, number> = {}): Element[] {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const items = project.global?.header?.widgets ?? [];
  const els: Element[] = [];
  for (const item of items) {
    const align = item.align ?? "left";
    const lvAlign = align === "left" ? "LEFT_MID" : align === "right" ? "RIGHT_MID" : "CENTER";
    if (item.type === "page_title") {
      const hasSub = (project.pages ?? []).some((p) => Boolean(p.parent));
      let offset = 0;
      if (hasSub) {
        els.push(el("icon", "back", "LEFT_MID", 0, 0, ics.s, "accent"));
        offset = align === "left" ? ics.s + ELEMENT_GAP : 0;
      }
      els.push(el("text", "title", lvAlign, offset, 0, fs.s, "text", null, align));
    } else if (item.type === "clock") {
      els.push(el("text", "time", lvAlign, 0, 0, fs.s, "text", null, align));
    } else if (item.type === "label") {
      els.push(el("text", "text", lvAlign, 0, 0, fs.s, "text_muted", null, align));
    }
  }
  return els;
}

export function tabElements(showIcons: boolean, showLabels: boolean, tab: Rect,
  fontSizes: Record<string, number> = {}, iconSizes: Record<string, number> = {}): Element[] {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const els: Element[] = [];
  if (showIcons && showLabels && tab.h >= ics.s + lineHeight(fs.xs)) {
    els.push(el("icon", "icon", "TOP_MID", 0, 2, ics.s, "nav"));
    els.push(el("text", "label", "BOTTOM_MID", 0, -1, fs.xs, "nav", tab.w - 2, "center"));
  } else if (showIcons) {
    els.push(el("icon", "icon", "CENTER", 0, 0, ics.s, "nav"));
  } else {
    els.push(el("text", "label", "CENTER", 0, 0, fs.xs, "nav", tab.w - 2, "center"));
  }
  return els;
}

/** LVGL alignment of a child (w x h) inside a parent content box. */
export function alignChild(parent: Rect, w: number, h: number, align: string, x: number, y: number): { x: number; y: number } {
  // C integer division (truncates toward zero) like LVGL
  const midX = Math.trunc((parent.w - w) / 2);
  const midY = Math.trunc((parent.h - h) / 2);
  const table: Record<string, [number, number]> = {
    TOP_LEFT: [0, 0],
    TOP_MID: [midX, 0],
    TOP_RIGHT: [parent.w - w, 0],
    LEFT_MID: [0, midY],
    CENTER: [midX, midY],
    RIGHT_MID: [parent.w - w, midY],
    BOTTOM_LEFT: [0, parent.h - h],
    BOTTOM_MID: [midX, parent.h - h],
    BOTTOM_RIGHT: [parent.w - w, parent.h - h],
  };
  const [bx, by] = table[align] ?? [0, 0];
  return { x: parent.x + bx + x, y: parent.y + by + y };
}
