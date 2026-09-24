// Pixel-exact preview: renders a page at native resolution onto a canvas.
// Uses the same layout functions as the generator (src/layout.ts == generator/layout.py)
// and mirrors the LVGL styles written by generator/generate.py.
import {
  ASCENT_PER_MILLE, HEADER_PAD_X, ICON_ASCENT_PER_MILLE, TILE_PAD, alignChild, headerElements, lineHeight, overlayLayout,
  navPages, pageLayout, tabElements, widgetElements, type Element, type Rect,
} from "../layout";
import { ON_STATES, rootOf, type ResolvedBoard } from "../model";
import { layoutProps, resolveTileStyle, type TileStyle } from "../style";
import { deviceStrings } from "../i18n";
import type { HassEntity, Page, Project, Theme, Widget } from "../types";
import { iconFont, textFont } from "./fonts";
import { iconChar } from "./icons";

export type StateResolver = (entityId: string) => HassEntity | undefined;

export interface RenderInput {
  project: Project;
  board: ResolvedBoard;
  theme: Theme;
  pageId: string;
  state: StateResolver;
  now: Date;
  pressed?: string | null;
  night?: boolean;
  /** decoded project images (backgrounds) by asset id */
  images?: Record<string, CanvasImageSource>;
  /** value overlay opened by a long press (same layout as the device) */
  overlay?: { title: string; value: number } | null;
}

export interface HitRegion {
  kind: "widget" | "tab" | "back" | "overlay-close" | "overlay-slider" | "overlay-panel";
  id: string;
  rect: Rect;
}

const DAYS = {
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
const MONTHS = {
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatTime(now: Date, fmt: string): string {
  if (fmt === "HH:mm:ss") return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  if (fmt === "h:mm a") {
    const h = now.getHours() % 12 || 12;
    return `${pad2(h)}:${pad2(now.getMinutes())} ${now.getHours() < 12 ? "AM" : "PM"}`;
  }
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

export function formatDate(now: Date, language: string): string {
  const l = language === "en" ? "en" : "de";
  const day = DAYS[l][now.getDay()];
  const month = MONTHS[l][now.getMonth()];
  return l === "de" ? `${day}, ${now.getDate()}. ${month}` : `${day}, ${month} ${now.getDate()}`;
}

export function isOn(state: string | undefined): boolean {
  return state !== undefined && ON_STATES.includes(state);
}

function stateText(state: string | undefined, strings: Record<string, string>, textOn?: string, textOff?: string): string {
  if (state === undefined || state === "" || state === "unknown") return strings.unknown;
  const map: Record<string, string> = {
    on: textOn || strings.on, off: textOff || strings.off, open: textOn || strings.open,
    closed: textOff || strings.closed, opening: strings.opening, closing: strings.closing,
    locked: textOff || strings.locked, unlocked: textOn || strings.unlocked, unavailable: strings.unavailable,
  };
  return map[state] ?? state;
}

function fallbackLabel(entity: string | null | undefined): string {
  if (!entity) return "";
  const s = entity.split(".").slice(1).join(".").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

class Painter {
  constructor(public ctx: CanvasRenderingContext2D, public theme: Theme) {}

  color(role: string): string {
    const c = this.theme.colors;
    return c[role] ?? c[{ state_icon: "off", nav: "nav_inactive" }[role] ?? "text"] ?? "#ffffff";
  }

  box(r: Rect, fill: string | null, border: string | null, radius: number, borderWidth: number, bgAlpha = 1): void {
    const ctx = this.ctx;
    const rad = Math.max(0, Math.min(radius, Math.floor(r.w / 2), Math.floor(r.h / 2)));
    if (fill) {
      ctx.save();
      ctx.globalAlpha = bgAlpha;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, rad);
      ctx.fill();
      ctx.restore();
    }
    if (border && borderWidth > 0) {
      ctx.save();
      ctx.strokeStyle = border;
      ctx.lineWidth = borderWidth;
      const i = borderWidth / 2;
      ctx.beginPath();
      ctx.roundRect(r.x + i, r.y + i, r.w - borderWidth, r.h - borderWidth, Math.max(0, rad - i));
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Draw one layout element inside the parent's content box (like an LVGL label). */
  element(parent: Rect, el: Element, text: string, color: string, circleColor?: string): Rect | null {
    const ctx = this.ctx;
    if (el.kind === "icon" && el.circle && circleColor) {
      // round background (LVGL obj with radius) with the icon centered inside
      const c = el.circle;
      const pos = alignChild(parent, c, c, el.align, el.x, el.y);
      const box = { x: pos.x, y: pos.y, w: c, h: c };
      this.box(box, circleColor, null, c, 0);
      this.element(box, { ...el, align: "CENTER", x: 0, y: 0, circle: undefined }, text, color);
      return box;
    }
    if (el.kind === "icon") {
      const glyph = iconChar(text);
      if (!glyph) return null;
      const size = el.size;
      ctx.font = iconFont(size);
      const w = Math.round(ctx.measureText(glyph).width) || size;
      const pos = alignChild(parent, w, size, el.align, el.x, el.y);
      ctx.fillStyle = color;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillText(glyph, pos.x, pos.y + Math.round((size * ICON_ASCENT_PER_MILLE) / 1000));
      return { x: pos.x, y: pos.y, w, h: size };
    }
    ctx.font = textFont(el.size);
    const lh = lineHeight(el.size);
    let shown = text;
    let textW = ctx.measureText(shown).width;
    const boxW = el.width ?? Math.ceil(textW);
    if (el.width !== null && textW > el.width) {
      // LVGL long_mode DOT: cut and append "..."
      while (shown.length > 0 && ctx.measureText(shown + "...").width > el.width) shown = shown.slice(0, -1);
      shown += "...";
      textW = ctx.measureText(shown).width;
    }
    const pos = alignChild(parent, boxW, lh, el.align, el.x, el.y);
    let tx = pos.x;
    if (el.width !== null) {
      if (el.text_align === "center") tx = pos.x + (boxW - textW) / 2;
      else if (el.text_align === "right") tx = pos.x + boxW - textW;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(pos.x, pos.y, boxW, lh);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(shown, Math.round(tx), pos.y + Math.round((el.size * ASCENT_PER_MILLE) / 1000));
    ctx.restore();
    return { x: pos.x, y: pos.y, w: boxW, h: lh };
  }
}

const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

export function renderScreen(canvas: HTMLCanvasElement, input: RenderInput): HitRegion[] {
  const { project, board, theme } = input;
  canvas.width = board.width;
  canvas.height = board.height;
  const ctx = canvas.getContext("2d")!;
  const p = new Painter(ctx, theme);
  const hits: HitRegion[] = [];
  const page = project.pages.find((pg) => pg.id === input.pageId) ?? project.pages[0];
  ctx.clearRect(0, 0, board.width, board.height);
  const bg = page?.background ?? project.background ?? null;
  ctx.fillStyle = bg?.color || p.color("background");
  ctx.fillRect(0, 0, board.width, board.height);
  const image = bg?.image ? input.images?.[bg.image] : undefined;
  if (image) ctx.drawImage(image, 0, 0, board.width, board.height);
  if (!page) return hits;

  const layout = pageLayout(project, page, board.width, board.height);
  const widgets = [...page.widgets].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const w of widgets) {
    const rect = layout.widgets[w.id];
    if (!rect) continue;
    renderWidget(p, input, page, w, rect);
    hits.push({ kind: "widget", id: w.id, rect });
  }
  renderTopLayer(p, input, page, hits);
  if (input.overlay) renderOverlay(p, input, input.overlay, hits);
  if (input.night) {
    const night = project.settings?.brightness_night ?? 25;
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.max(night, 5) / 100})`;
    ctx.fillRect(0, 0, board.width, board.height);
  }
  return hits;
}

function renderWidget(p: Painter, input: RenderInput, page: Page, w: Widget, rect: Rect): void {
  const { project, theme } = input;
  const props = w.props ?? {};
  const strings = deviceStrings(project.settings?.language ?? "de");
  const fs = theme.font_sizes;
  const ics = theme.icon_sizes;
  const content = inset(rect, TILE_PAD);
  const entity = w.entity ? input.state(w.entity) : undefined;
  const st = entity?.state;
  const pressed = input.pressed === w.id;
  const style = resolveTileStyle(theme, { ...(project.tile_style ?? {}), ...(w.style ?? {}) });
  const lp = (extra: Record<string, unknown> = {}) => layoutProps({ ...props, ...extra }, style);
  // element color role -> style color ("on" state variants for tiles that are on)
  const col = (role: string, on = false): string => {
    const map: Record<string, [keyof TileStyle, keyof TileStyle]> = {
      text: ["text_on", "text"], text_muted: ["sub_on", "sub"], accent: ["icon_on", "icon_on"], state_icon: ["icon_on", "icon"],
    };
    const m = map[role];
    return m ? String(style[m[on ? 0 : 1]]) : p.color(role);
  };
  const draw = (el: Element, text: string, color: string, on = false) =>
    p.element(content, el, text, color, el.circle ? (on ? style.circle_bg_on : style.circle_bg) : undefined);

  const tileBox = () => p.box(rect, style.bg, style.border, style.radius, style.border_width, style.bg_opa / 100);
  const buttonBox = (on: boolean, disabled: boolean) => {
    const active = on || pressed;
    const alpha = (on ? style.bg_opa_on : style.bg_opa) / 100;
    p.box(rect, active ? style.bg_on : style.bg, on ? style.border_on : style.border, style.radius, style.border_width,
      disabled ? alpha * 0.5 : pressed && !on ? Math.max(alpha, 0.5) : alpha);
  };

  switch (w.type) {
    case "toggle_tile": {
      const on = isOn(st);
      buttonBox(on, st === "unavailable");
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) {
        if (el.role === "icon") draw(el, String(props.icon ?? ""), on ? style.icon_on : style.icon, on);
        else if (el.role === "label") draw(el, String(props.label || fallbackLabel(w.entity)), col(el.color, on));
        else if (el.role === "state") {
          const pct = (props.show_value ?? true) ? tileValuePercent(w.entity, entity) : null;
          draw(el, on && pct !== null ? `${pct} %` : stateText(st, strings), col(el.color, on));
        }
      }
      break;
    }
    case "sensor_value": {
      tileBox();
      const unit = String(props.unit ?? "");
      const decimals = Math.max(0, Math.min(Number(props.decimals ?? 1), 3));
      let value = "--";
      if (st !== undefined && st !== "unknown" && st !== "unavailable" && st !== "") {
        if (props.numeric ?? true) {
          const n = Number.parseFloat(st);
          value = Number.isNaN(n) ? "--" : n.toFixed(decimals);
        } else value = st;
        if (value !== "--" && unit) value += ` ${unit}`;
      }
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) {
        if (el.role === "icon") draw(el, String(props.icon ?? ""), col(el.color));
        else if (el.role === "label") draw(el, String(props.label || fallbackLabel(w.entity)), col(el.color));
        else if (el.role === "value") draw(el, value, col(el.color));
      }
      break;
    }
    case "binary_indicator": {
      tileBox();
      const on = isOn(st);
      const textOn = String(props.text_on || strings.on);
      const textOff = String(props.text_off || strings.off);
      const iconColor = st === undefined ? style.icon : on ? (props.alert_on ?? true ? p.color("error") : p.color("accent")) : p.color("on");
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) {
        if (el.role === "icon") draw(el, String(props.icon ?? ""), iconColor);
        else if (el.role === "label") draw(el, String(props.label || fallbackLabel(w.entity)), col(el.color));
        else if (el.role === "state") draw(el, stateText(st, strings, textOn, textOff), col(el.color));
      }
      break;
    }
    case "clock": {
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) {
        const text = el.role === "time"
          ? formatTime(input.now, String(props.format ?? "HH:mm"))
          : formatDate(input.now, project.settings?.language ?? "de");
        draw(el, text, col(el.color));
      }
      break;
    }
    case "label": {
      if (props.background) tileBox();
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) draw(el, String(props.text ?? ""), col(el.color));
      break;
    }
    case "scene_button": {
      buttonBox(false, false);
      const text = String(props.label || fallbackLabel(w.action?.target) || w.action?.service || "");
      for (const el of widgetElements(w.type, rect.w, rect.h, lp(), fs, ics)) {
        draw(el, el.role === "icon" ? String(props.icon ?? "") : text, col(el.color));
      }
      break;
    }
    case "page_button": {
      buttonBox(false, false);
      const target = project.pages.find((pg) => pg.id === props.target);
      const text = String(props.label || target?.name || "?");
      const icon = String(props.icon || target?.icon || "");
      for (const el of widgetElements(w.type, rect.w, rect.h, lp({ icon }), fs, ics)) {
        draw(el, el.role === "icon" ? icon : text, col(el.color));
      }
      break;
    }
    case "page_title": {
      const hasBack = Boolean(page.parent && (props.show_back ?? true));
      for (const el of widgetElements(w.type, rect.w, rect.h, lp({ _has_back: hasBack }), fs, ics)) {
        draw(el, el.role === "back" ? "mdi:chevron-left" : page.name, col(el.color));
      }
      break;
    }
    default: {
      // Unknown / future widget: draw a placeholder box
      p.box(rect, null, p.color("warning"), style.radius, 1);
    }
  }
}

function renderTopLayer(p: Painter, input: RenderInput, page: Page, hits: HitRegion[]): void {
  const { project, board, theme } = input;
  const home = project.pages.find((pg) => pg.id === project.navigation?.home_page) ?? project.pages[0];
  // The top layer is laid out once (like on the device), based on the home page
  const layout = pageLayout(project, home, board.width, board.height);
  const fs = theme.font_sizes;
  const ics = theme.icon_sizes;
  if (layout.header) {
    const h = layout.header;
    // with a project background image the header is transparent and the tab bar translucent (as on the device)
    if (!project.background?.image) p.box(h, p.color("header_bg"), null, 0, 0);
    const content: Rect = { x: h.x + HEADER_PAD_X, y: h.y, w: h.w - 2 * HEADER_PAD_X, h: h.h };
    for (const el of headerElements(project, h, fs, ics)) {
      if (el.role === "back") {
        if (page.parent) {
          const r = p.element(content, el, "mdi:chevron-left", p.color(el.color));
          if (r) hits.push({ kind: "back", id: page.parent, rect: r });
        }
      } else if (el.role === "title") {
        p.element(content, el, page.name, p.color(el.color));
      } else if (el.role === "time") {
        p.element(content, el, formatTime(input.now, "HH:mm"), p.color(el.color));
      } else if (el.role === "text") {
        p.element(content, el, project.name, p.color(el.color));
      }
    }
  }
  if (layout.tabbar) {
    p.box(layout.tabbar, p.color("nav_bg"), null, 0, 0, project.background?.image ? 0.8 : 1);
    const nav = navPages(project);
    const root = rootOf(project, page);
    const showIcons = project.navigation?.show_icons ?? true;
    const showLabels = project.navigation?.show_labels ?? true;
    nav.forEach((tabPage, i) => {
      const rect = layout.tabs[i];
      const color = tabPage.id === root.id ? p.color("nav_active") : p.color("nav_inactive");
      for (const el of tabElements(showIcons, showLabels, rect, fs, ics)) {
        p.element(rect, el, el.kind === "icon" ? tabPage.icon ?? "" : tabPage.name, color);
      }
      hits.push({ kind: "tab", id: tabPage.id, rect });
    });
  }
}

/** Sample states for screenshots (independent of the real Home Assistant). */
export function sampleState(project: Project): StateResolver {
  const values = new Map<string, HassEntity>();
  let i = 0;
  for (const page of project.pages) {
    for (const w of page.widgets) {
      if (!w.entity || values.has(w.entity)) continue;
      const domain = w.entity.split(".")[0];
      let state = i % 2 === 0 ? "on" : "off";
      if (domain === "sensor" || domain === "input_number" || domain === "number") state = String(20 + ((i * 7) % 10) + 0.5);
      if (domain === "cover") state = i % 2 === 0 ? "open" : "closed";
      if (domain === "binary_sensor") state = "off";
      const attributes: Record<string, unknown> = {};
      if (domain === "light" && state === "on") attributes.brightness = 204;
      if (domain === "cover") attributes.current_position = state === "open" ? 60 : 0;
      if (domain === "fan" && state === "on") attributes.percentage = 50;
      values.set(w.entity, { entity_id: w.entity, state, attributes });
      i++;
    }
  }
  return (id) => values.get(id);
}

export const lineHeightOf = lineHeight;

/** Attribute holding the tile value per domain, and its kind (1 = brightness 0..255). Mirrors generator VALUE_ATTRIBUTES. */
export const VALUE_ATTRIBUTES: Record<string, [string, number]> = {
  light: ["brightness", 1],
  cover: ["current_position", 2],
  fan: ["percentage", 3],
};

/** Value in percent shown on a tile (null when the domain has no value or it is unknown). */
export function tileValuePercent(entityId: string | null | undefined, entity: HassEntity | undefined): number | null {
  if (!entityId || !entity) return null;
  const spec = VALUE_ATTRIBUTES[entityId.split(".")[0]];
  if (!spec) return null;
  const raw = Number(entity.attributes[spec[0]]);
  if (entity.attributes[spec[0]] === undefined || entity.attributes[spec[0]] === null || Number.isNaN(raw)) return null;
  return Math.round(spec[1] === 1 ? (raw * 100) / 255 : raw);
}

function renderOverlay(p: Painter, input: RenderInput, ov: { title: string; value: number }, hits: HitRegion[]): void {
  const { board, theme } = input;
  const ctx = p.ctx;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, board.width, board.height);
  hits.push({ kind: "overlay-close", id: "backdrop", rect: { x: 0, y: 0, w: board.width, h: board.height } });
  const { panel, elements } = overlayLayout(board.width, board.height, theme.font_sizes, theme.icon_sizes);
  p.box(panel, p.color("tile"), p.color("border"), theme.radius ?? 8, theme.border_width ?? 0);
  hits.push({ kind: "overlay-panel", id: "panel", rect: panel });
  const content = inset(panel, TILE_PAD);
  const value = Math.max(0, Math.min(100, Math.round(ov.value)));
  for (const el of elements) {
    if (el.role === "title") p.element(content, el, ov.title, p.color(el.color));
    else if (el.role === "close") {
      const r = p.element(content, el, "mdi:close", p.color(el.color));
      if (r) hits.push({ kind: "overlay-close", id: "close", rect: r });
    } else if (el.role === "value") p.element(content, el, `${value} %`, p.color(el.color));
    else if (el.role === "slider") {
      const w = el.width ?? 100;
      const h = el.height ?? 18;
      const pos = alignChild(content, w, h, el.align, el.x, el.y);
      const track = { x: pos.x, y: pos.y, w, h };
      const r = Math.floor(h / 2);
      p.box(track, p.color("border"), null, r, 0);
      const filled = Math.round((w * value) / 100);
      if (filled > 0) p.box({ ...track, w: Math.max(filled, h) }, p.color("accent"), null, r, 0);
      const knob = h + 8;
      p.box({ x: pos.x + filled - Math.floor(knob / 2), y: pos.y - 4, w: knob, h: knob }, p.color("text"), null, knob, 0);
      hits.push({ kind: "overlay-slider", id: "slider", rect: track });
    }
  }
}
