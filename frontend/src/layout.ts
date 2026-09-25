// Shared layout rules – exact port of custom_components/cyd_studio/generator/layout.py.
// Both implementations must produce identical results for tests/layout_cases.json.
// Integer arithmetic with floor division only (all operands are non-negative).
import type { Project, Page, Widget } from "./types";

export const TABBAR_H_LABELS = 40;
export const TABBAR_H_ICONS = 32;
export const TABBAR_W_LEFT = 48;
export const HEADER_PAD_X = 6;
export const TILE_PAD = 6;
export const CIRCLE_PAD = 5;
export const SMALL_BUTTON_MAX = 40;
export const TILE_SLIDER_H = 12;
export const VALUE_W = 44;
export const BAR_H = 6;
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
  kind: "icon" | "text" | "slider" | "button" | "arc" | "bar" | "qr" | "line";
  role: string;
  align: string;
  x: number;
  y: number;
  width: number | null;
  size: number;
  color: string;
  text_align: string;
  /** only for boxed kinds (slider, button, arc) */
  height?: number;
  /** only for icons with a round background: diameter of the circle */
  circle?: number;
  /** multi-line text (label long_mode WRAP, clipped at height) */
  wrap?: boolean;
  /** primary text in bold (style text_weight bold) */
  bold?: boolean;
  /** button_grid cells: font size of the text under the icon (0 = icon only) */
  label_size?: number;
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

function el(kind: Element["kind"], role: string, align: string, x: number, y: number, size: number, color: string,
  width: number | null = null, textAlign = "left"): Element {
  return { kind, role, align, x, y, width, size, color, text_align: textAlign };
}

type Props = Record<string, unknown>;

/**
 * Inner elements of a widget. Style options: icon_size none hides the icon, s/m/l fixes its size;
 * text_weight bold makes the primary texts (color "text") bold. Mirrors layout.widget_elements.
 */
export function widgetElements(wtype: string, w: number, h: number, props: Props,
  fontSizes: Record<string, number> = {}, iconSizes: Record<string, number> = {}): Element[] {
  const iconSize = String(props.icon_size ?? "auto");
  let p = props;
  let ics = iconSizes;
  if (iconSize === "none") p = { ...props, icon: "" };
  else if (iconSize === "s" || iconSize === "m" || iconSize === "l") {
    const base = { ...DEFAULT_ICON_SIZES, ...iconSizes };
    ics = { ...base, s: base[iconSize], m: base[iconSize] };
  }
  let els = widgetElementsInner(wtype, w, h, p, fontSizes, ics);
  if (props.hide_label) els = dropLabel(wtype, els);
  if (props.text_weight === "bold") for (const e of els) if (e.kind === "text" && e.color === "text") e.bold = true;
  return els;
}

const LABEL_ROLES = ["label", "label0", "label1", "label2"];
const STATE_TILES = ["toggle_tile", "binary_indicator", "sensor_value", "person_presence", "notification_area"];

/** Without the name: a lone icon is centered, a lone text of a state tile moves to the middle row. */
function dropLabel(wtype: string, els: Element[]): Element[] {
  if ((wtype === "scene_button" || wtype === "page_button") && !els.some((e) => e.kind === "icon")) return els;
  const out = els.filter((e) => !LABEL_ROLES.includes(e.role));
  const texts = out.filter((e) => e.kind === "text");
  const icons = out.filter((e) => e.kind === "icon");
  if (!texts.length && icons.length === 1 && out.length === 1) Object.assign(icons[0], { align: "CENTER", x: 0, y: 0 });
  else if ((STATE_TILES.includes(wtype) || wtype === "multi_value") && icons.every((i) => i.align === "LEFT_MID")) {
    for (const e of texts) {
      if ((e.align === "TOP_LEFT" || e.align === "BOTTOM_LEFT") && (wtype === "multi_value" || texts.length === 1)) {
        Object.assign(e, { align: "LEFT_MID", y: 0 });
      }
    }
  }
  return out;
}

function widgetElementsInner(wtype: string, w: number, h: number, props: Props,
  fontSizes: Record<string, number> = {}, iconSizes: Record<string, number> = {}): Element[] {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const cw = Math.max(w - 2 * TILE_PAD, 1);
  const ch = Math.max(h - 2 * TILE_PAD, 1);
  const els: Element[] = [];
  const hasIcon = Boolean(props.icon);

  const circle = Boolean(props.icon_circle);
  // Box of an icon: the glyph, or the round background around it
  const ib = (size: number) => (circle ? size + 2 * CIRCLE_PAD : size);
  const icon = (role: string, align: string, x: number, y: number, size: number, color: string): Element => {
    const e = el("icon", role, align, x, y, size, color);
    if (circle) e.circle = ib(size);
    return e;
  };

  if (wtype === "toggle_tile" || wtype === "binary_indicator" || wtype === "sensor_value" || wtype === "person_presence" || wtype === "notification_area") {
    const valueSize: number | undefined = fs[String(props.value_size ?? "auto")]; // undefined = automatic
    const mainSize = wtype === "sensor_value" ? valueSize ?? fs.l : fs[String(props.text_size ?? "s")] ?? fs.s;
    if (wtype === "person_presence" || wtype === "notification_area") wtype = "binary_indicator"; // same arrangement
    const subSize = fs.xs;
    const tall = ch >= ib(ics.m) + lineHeight(mainSize) + lineHeight(subSize);
    if (tall) {
      if (wtype === "sensor_value") {
        const big = valueSize ?? (ch >= ib(ics.s) + lineHeight(fs.xl) ? fs.xl : fs.l);
        els.push(el("text", "label", "TOP_LEFT", 0, 0, subSize, "text_muted", cw - (hasIcon ? ib(ics.s) + ELEMENT_GAP : 0)));
        if (hasIcon) els.push(icon("icon", "TOP_RIGHT", 0, 0, ics.s, "accent"));
        els.push(el("text", "value", "BOTTOM_LEFT", 0, 0, big, "text", cw));
      } else {
        // icon on top, name and state stacked at the bottom (home app style)
        if (hasIcon) els.push(icon("icon", "TOP_LEFT", 0, 0, ics.m, "state_icon"));
        if ((wtype === "toggle_tile" && (props.show_state ?? true)) || wtype === "binary_indicator") {
          els.push(el("text", "label", "BOTTOM_LEFT", 0, -lineHeight(subSize), mainSize, "text", cw));
          els.push(el("text", "state", "BOTTOM_LEFT", 0, 0, subSize, "text_muted", cw));
        } else {
          els.push(el("text", "label", "BOTTOM_LEFT", 0, 0, mainSize, "text", cw));
        }
      }
    } else {
      const iconSize = ch >= ib(ics.m) && cw >= 3 * ib(ics.m) ? ics.m : ics.s;
      const tx = hasIcon ? ib(iconSize) + ELEMENT_GAP : 0;
      const tw = Math.max(cw - tx, 1);
      if (hasIcon) els.push(icon("icon", "LEFT_MID", 0, 0, iconSize, wtype === "sensor_value" ? "accent" : "state_icon"));
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
    const size = fs[String(props.text_size ?? "s")] ?? fs.s;
    const lh = lineHeight(size);
    if (hasIcon && ch >= ib(ics.m) + lh + 2) {
      els.push(icon("icon", "CENTER", 0, -fdiv(lh, 2) - 1, ics.m, "accent"));
      els.push(el("text", "label", "CENTER", 0, fdiv(ib(ics.m), 2) + 1, size, "text", cw, "center"));
    } else if (hasIcon) {
      const iconSize = ch >= ib(ics.m) ? ics.m : ics.s;
      const tx = ib(iconSize) + ELEMENT_GAP;
      els.push(icon("icon", "LEFT_MID", 0, 0, iconSize, "accent"));
      els.push(el("text", "label", "LEFT_MID", tx, 0, size, "text", Math.max(cw - tx, 1)));
    } else {
      els.push(el("text", "label", "CENTER", 0, 0, size, "text", cw, "center"));
    }
    return els;
  }

  // Element with a fixed box (buttons, sliders, arcs)
  const sized = (kind: Element["kind"], role: string, align: string, x: number, y: number, w: number, hh: number, size: number, color: string): Element =>
    ({ ...el(kind, role, align, x, y, size, color, Math.max(w, 1)), height: Math.max(hh, 1) });
  const textSize = fs[String(props.text_size ?? "s")] ?? fs.s;
  const lhT = lineHeight(textSize);
  const lhXs = lineHeight(fs.xs);

  if (wtype === "media_player") {
    // title + artist, previous / play-pause / next, optional volume slider underneath
    const lines = lhT + lhXs;
    const roles = ["prev", "play", "next"];
    if (ch >= lines + ELEMENT_GAP + 24) {
      els.push(el("text", "title", "TOP_LEFT", 0, 0, textSize, "text", cw));
      els.push(el("text", "artist", "TOP_LEFT", 0, lhT, fs.xs, "text_muted", cw));
      const rest = ch - lines - ELEMENT_GAP;
      const volH = TILE_SLIDER_H + ELEMENT_GAP + 4;
      const volume = Boolean(props.show_volume ?? true) && rest >= 24 + volH;
      const bh = Math.min(rest - (volume ? volH : 0), SMALL_BUTTON_MAX);
      const by = volume ? -volH : 0;
      const isz = bh >= ics.m + 8 ? ics.m : ics.s;
      roles.forEach((role, i) => {
        const [bx, bw] = split(0, cw, 3, ELEMENT_GAP, i);
        els.push(sized("button", role, "BOTTOM_LEFT", bx, by, bw, bh, isz, "accent"));
      });
      if (volume) els.push(sized("slider", "volume", "BOTTOM_MID", 0, -2, cw - 2 * TILE_SLIDER_H, TILE_SLIDER_H, 0, "accent"));
    } else if (ch >= lhT + 2 + 20) {
      // medium (e.g. 2x1): title over the full width, the buttons underneath (2 px apart)
      els.push(el("text", "title", "TOP_LEFT", 0, 0, textSize, "text", cw));
      const bh = Math.min(ch - lhT - 2, SMALL_BUTTON_MAX);
      const isz = bh >= ics.m + 8 ? ics.m : ics.s;
      roles.forEach((role, i) => {
        const [bx, bw] = split(0, cw, 3, ELEMENT_GAP, i);
        els.push(sized("button", role, "BOTTOM_LEFT", bx, 0, bw, bh, isz, "accent"));
      });
    } else {
      // flat: as many buttons (play first) as leave at least half the width for the title
      const bs = Math.max(Math.min(ch, 28), 16);
      const count = [3, 2].find((n) => cw - n * (bs + ELEMENT_GAP) >= fdiv(cw, 2)) ?? 1;
      const shown = count === 1 ? roles.slice(1, 2) : roles.slice(3 - count);
      const tw = Math.max(cw - count * (bs + ELEMENT_GAP), 1);
      if (ch >= lines) {
        els.push(el("text", "title", "TOP_LEFT", 0, 0, textSize, "text", tw));
        els.push(el("text", "artist", "BOTTOM_LEFT", 0, 0, fs.xs, "text_muted", tw));
      } else {
        els.push(el("text", "title", "LEFT_MID", 0, 0, textSize, "text", tw));
      }
      shown.forEach((role, i) => els.push(sized("button", role, "RIGHT_MID", (i - (shown.length - 1)) * (bs + ELEMENT_GAP), 0, bs, bs, ics.s, "accent")));
    }
    return els;
  }

  if (wtype === "cover_control") {
    const withTitle = ch >= lhT + ELEMENT_GAP + 24;
    const bh = withTitle ? Math.min(ch - lhT - ELEMENT_GAP, SMALL_BUTTON_MAX) : ch;
    if (withTitle) {
      els.push(el("text", "label", "TOP_LEFT", 0, 0, textSize, "text", Math.max(cw - VALUE_W - ELEMENT_GAP, 1)));
      els.push(el("text", "state", "TOP_RIGHT", 0, 0, fs.xs, "text_muted", VALUE_W, "right"));
    }
    ["up", "stop", "down"].forEach((role, i) => {
      const [bx, bw] = split(0, cw, 3, ELEMENT_GAP, i);
      const isz = bh >= ics.m + 8 ? ics.m : ics.s;
      els.push(sized("button", role, "BOTTOM_LEFT", bx, 0, bw, bh, isz, "accent"));
    });
    return els;
  }

  if (wtype === "climate" || wtype === "number_stepper" || wtype === "select") {
    const tall = ch >= 2 * lhXs + lineHeight(fs.l) + 2 * ELEMENT_GAP;
    const rows = tall ? 2 * lhXs : lhXs;
    const bs = Math.max(Math.min(ch - rows - ELEMENT_GAP, SMALL_BUTTON_MAX, fdiv(cw, 4)), 16);
    const vw = Math.max(cw - 2 * (bs + ELEMENT_GAP), 1);
    const fits = [fs.xl, fs.l].filter((sz) => vw >= 3 * sz && ch - rows >= lineHeight(sz));
    const big = fits.length ? fits[0] : fs.m;
    const cy = tall ? 0 : fdiv(lhXs, 2);
    if (tall) {
      els.push(el("text", "label", "TOP_LEFT", 0, 0, fs.xs, "text_muted", cw));
      els.push(el("text", "state", "BOTTOM_MID", 0, 0, fs.xs, "text_muted", cw, "center"));
    } else {
      const half = fdiv(cw, 2);
      els.push(el("text", "label", "TOP_LEFT", 0, 0, fs.xs, "text_muted", Math.max(half - ELEMENT_GAP, 1)));
      els.push(el("text", "state", "TOP_RIGHT", 0, 0, fs.xs, "text_muted", Math.max(cw - half, 1), "right"));
    }
    els.push(el("text", "value", "CENTER", 0, cy, big, "text", vw, "center"));
    els.push(sized("button", "minus", "LEFT_MID", 0, cy, bs, bs, ics.s, "accent"));
    els.push(sized("button", "plus", "RIGHT_MID", 0, cy, bs, bs, ics.s, "accent"));
    return els;
  }

  if (wtype === "slider") {
    if (ch >= lhT + TILE_SLIDER_H + 4) {
      els.push(el("text", "label", "TOP_LEFT", 0, 0, textSize, "text", Math.max(cw - VALUE_W - ELEMENT_GAP, 1)));
      els.push(el("text", "value", "TOP_RIGHT", 0, 0, fs.xs, "text_muted", VALUE_W, "right"));
      els.push(sized("slider", "slider", "BOTTOM_MID", 0, -2, cw - 2 * TILE_SLIDER_H, TILE_SLIDER_H, 0, "accent"));
    } else {
      els.push(sized("slider", "slider", "CENTER", 0, 0, cw - 2 * TILE_SLIDER_H, TILE_SLIDER_H, 0, "accent"));
    }
    return els;
  }

  if (wtype === "gauge") {
    const d = Math.max(Math.min(cw, ch - (props.hide_label ? 0 : lhXs)), 24);
    const stroke = Math.max(fdiv(d, 10), 4);
    const valueSize = d >= 90 ? fs.l : d < 60 ? fs.s : fs.m;
    els.push(sized("arc", "arc", "TOP_MID", 0, 0, d, d, stroke, "accent"));
    els.push(el("text", "value", "TOP_MID", 0, fdiv(d, 2) - fdiv(lineHeight(valueSize), 2), valueSize, "text", d, "center"));
    els.push(el("text", "label", "BOTTOM_MID", 0, 0, fs.xs, "text_muted", cw, "center"));
    return els;
  }

  if (wtype === "weather") {
    const isz = ch >= ib(ics.l) && cw >= 3 * ib(ics.l) ? ics.l : ics.m;
    const tx = ib(isz) + ELEMENT_GAP;
    const temp = ch >= lineHeight(fs.xl) + lhXs ? fs.xl : fs.l;
    els.push(icon("icon", "LEFT_MID", 0, 0, isz, "accent"));
    els.push(el("text", "value", "TOP_LEFT", tx, 0, temp, "text", Math.max(cw - tx, 1)));
    els.push(el("text", "state", "BOTTOM_LEFT", tx, 0, fs.xs, "text_muted", Math.max(cw - tx, 1)));
    return els;
  }

  if (wtype === "multi_value") {
    const count = Math.max(1, Math.min(Math.trunc(Number(props._count ?? 1)), 3));
    const valueSize = ch >= lineHeight(fs.l) + lhXs ? fs.l : fs.s;
    for (let i = 0; i < count; i++) {
      const [vx, vw] = split(0, cw, count, ELEMENT_GAP, i);
      els.push(el("text", `value${i}`, "TOP_LEFT", vx, 0, valueSize, "text", vw));
      els.push(el("text", `label${i}`, "BOTTOM_LEFT", vx, 0, fs.xs, "text_muted", vw));
    }
    return els;
  }

  if (wtype === "countdown") {
    if (ch < lhT + lineHeight(fs.l)) {
      // flat tile: name left, time right
      els.push(el("text", "label", "LEFT_MID", 0, 0, textSize, "text", Math.max(fdiv(cw, 2) - ELEMENT_GAP, 1)));
      els.push(el("text", "value", "RIGHT_MID", 0, 0, fs.l, "text", cw - fdiv(cw, 2), "right"));
      return els;
    }
    const big = ch >= lhT + lineHeight(fs.xl) + BAR_H + 4 ? fs.xl : fs.l;
    const withBar = ch >= lhT + lineHeight(big) + BAR_H + 4;
    els.push(el("text", "label", "TOP_LEFT", 0, 0, textSize, "text", cw));
    els.push(el("text", "value", "BOTTOM_LEFT", 0, withBar ? -(BAR_H + 4) : 0, big, "text", cw));
    if (withBar) els.push(sized("bar", "bar", "BOTTOM_MID", 0, 0, cw, BAR_H, 0, "accent"));
    return els;
  }

  if (wtype === "qr_code") {
    const withLabel = Boolean(props.label) && ch >= 48 + lhXs;
    const d = Math.max(Math.min(cw, ch - (withLabel ? lhXs : 0)), 16);
    els.push(sized("qr", "qr", withLabel ? "TOP_MID" : "CENTER", 0, 0, d, d, 0, "text"));
    if (withLabel) els.push(el("text", "label", "BOTTOM_MID", 0, 0, fs.xs, "text_muted", cw, "center"));
    return els;
  }

  if (wtype === "divider") {
    els.push(sized("line", "line", "CENTER", 0, 0, cw, 2, 0, "text_muted"));
    return els;
  }

  if (wtype === "button_grid") {
    const count = Math.max(1, Math.min(Math.trunc(Number(props._count ?? 1)), 6));
    const cols = count <= 3 ? count : fdiv(count + 1, 2);
    const rows = fdiv(count + cols - 1, cols);
    for (let i = 0; i < count; i++) {
      const [bx, bw] = split(0, cw, cols, ELEMENT_GAP, i % cols);
      const [by, bh] = split(0, ch, rows, ELEMENT_GAP, fdiv(i, cols));
      const withText = bh >= ics.s + lhXs + 4;
      const e = sized("button", `btn${i}`, "TOP_LEFT", bx, by, bw, bh, withText || bh < ics.m + 6 ? ics.s : ics.m, "accent");
      e.label_size = withText ? fs.xs : 0;
      els.push(e);
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

// ---------------------------------------------------------------------------
// Value overlay (long press on a tile: brightness / position / fan speed)
// ---------------------------------------------------------------------------
export const OVERLAY_MAX_W = 240;
export const OVERLAY_MAX_H = 150;
export const OVERLAY_MARGIN = 16;
export const SLIDER_H = 18;

export function overlayLayout(width: number, height: number, fontSizes: Record<string, number> = {},
  iconSizes: Record<string, number> = {}): { panel: Rect; elements: Element[] } {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const pw = Math.min(width - 2 * OVERLAY_MARGIN, OVERLAY_MAX_W);
  const ph = Math.min(height - 2 * OVERLAY_MARGIN, OVERLAY_MAX_H);
  const panel = { x: fdiv(width - pw, 2), y: fdiv(height - ph, 2), w: pw, h: ph };
  const cw = pw - 2 * TILE_PAD;
  const elements: Element[] = [
    el("text", "title", "TOP_LEFT", 0, 0, fs.m, "text", Math.max(cw - ics.s - ELEMENT_GAP, 1)),
    el("icon", "close", "TOP_RIGHT", 0, 0, ics.s, "text_muted"),
    el("text", "value", "CENTER", 0, -fdiv(SLIDER_H, 2), fs.xl, "text", cw, "center"),
    { ...el("slider", "slider", "BOTTOM_MID", 0, -fdiv(SLIDER_H, 2), 0, "accent", cw - 2 * SLIDER_H), height: SLIDER_H },
  ];
  return { panel, elements };
}

// ---------------------------------------------------------------------------
// Message overlay (Home Assistant -> display: show_message)
// ---------------------------------------------------------------------------
export const MESSAGE_MAX_W = 260;
export const MESSAGE_MAX_H = 140;

export function messageLayout(width: number, height: number, fontSizes: Record<string, number> = {},
  iconSizes: Record<string, number> = {}): { panel: Rect; elements: Element[] } {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const pw = Math.min(width - 2 * OVERLAY_MARGIN, MESSAGE_MAX_W);
  const ph = Math.min(height - 2 * OVERLAY_MARGIN, MESSAGE_MAX_H);
  const panel = { x: fdiv(width - pw, 2), y: fdiv(height - ph, 2), w: pw, h: ph };
  const cw = pw - 2 * TILE_PAD;
  const ch = ph - 2 * TILE_PAD;
  const tx = ics.s + ELEMENT_GAP;
  const head = Math.max(lineHeight(fs.m), ics.s);
  const elements: Element[] = [
    el("icon", "icon", "TOP_LEFT", 0, 0, ics.s, "accent"),
    el("text", "title", "TOP_LEFT", tx, 0, fs.m, "text", Math.max(cw - tx, 1)),
    { ...el("text", "text", "TOP_LEFT", 0, head + ELEMENT_GAP, fs.s, "text_muted", cw), wrap: true, height: Math.max(ch - head - ELEMENT_GAP, 1) },
  ];
  return { panel, elements };
}

// ---------------------------------------------------------------------------
// Light detail overlay (long press on a light that supports color temperature or color)
// ---------------------------------------------------------------------------
export const LIGHT_MAX_W = 260;
export const LIGHT_MAX_H = 170;
const LIGHT_VALUE_W = 56; // fits "6500 K"
export const LIGHT_ROWS: [string, string][] = [["brightness", "mdi:brightness-6"], ["ct", "mdi:thermometer"], ["hue", "mdi:palette"]];

export function lightOverlayLayout(width: number, height: number, fontSizes: Record<string, number> = {},
  iconSizes: Record<string, number> = {}): { panel: Rect; elements: Element[] } {
  const fs = { ...DEFAULT_FONT_SIZES, ...fontSizes };
  const ics = { ...DEFAULT_ICON_SIZES, ...iconSizes };
  const pw = Math.min(width - 2 * OVERLAY_MARGIN, LIGHT_MAX_W);
  const ph = Math.min(height - 2 * OVERLAY_MARGIN, LIGHT_MAX_H);
  const panel = { x: fdiv(width - pw, 2), y: fdiv(height - ph, 2), w: pw, h: ph };
  const cw = pw - 2 * TILE_PAD;
  const ch = ph - 2 * TILE_PAD;
  const head = Math.max(lineHeight(fs.m), ics.s);
  const rowH = Math.max(fdiv(ch - head - ELEMENT_GAP, LIGHT_ROWS.length), SLIDER_H);
  const sliderX = ics.s + ELEMENT_GAP;
  const sliderW = Math.max(cw - sliderX - LIGHT_VALUE_W - ELEMENT_GAP, 1);
  const elements: Element[] = [
    el("text", "title", "TOP_LEFT", 0, 0, fs.m, "text", Math.max(cw - ics.s - ELEMENT_GAP, 1)),
    el("icon", "close", "TOP_RIGHT", 0, 0, ics.s, "text_muted"),
  ];
  LIGHT_ROWS.forEach(([role], i) => {
    const y = head + ELEMENT_GAP + i * rowH;
    elements.push(el("icon", `${role}_icon`, "TOP_LEFT", 0, y + fdiv(rowH - ics.s, 2), ics.s, "text_muted"));
    elements.push({ ...el("slider", role, "TOP_LEFT", sliderX, y + fdiv(rowH - SLIDER_H, 2), 0, "accent", sliderW), height: SLIDER_H });
    elements.push(el("text", `${role}_value`, "TOP_RIGHT", 0, y + fdiv(rowH - lineHeight(fs.s), 2), fs.s, "text", LIGHT_VALUE_W, "right"));
  });
  return { panel, elements };
}
