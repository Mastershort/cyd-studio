// <cyd-editor>: palette + page tree | display canvas | properties, with undo/redo,
// debounced autosave and live validation through the backend generator.
import { LitElement, css, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import type { Api } from "../api";
import { lang, loc, t } from "../i18n";
import { navPages, pageGrid } from "../layout";
import { PRESETS, resolveTileStyle } from "../style";
import { fitImageFile, loadProjectImages } from "../images";
import { OPS } from "../logic";
import { STEP_TYPES, triggerSteps, type ActionStep, type Trigger } from "../actions";
import {
  defaultProps, findFreeSpot, newWidgetId, normalize, overlapsAny, pageIdFrom, resolveBoard, rootOf, slugify,
} from "../model";
import { iconChar } from "../preview/icons";
import { ICON_FAMILY } from "../preview/fonts";
import {
  LIGHT_SLIDERS, VALUE_ATTRIBUTES, isOn, lightCaps, sampleState, tileValuePercent, type HitRegion, type LightOverlay,
  type StateResolver,
} from "../preview/renderer";
import { WIDGET_DND_TYPE, type CydScreen } from "../preview/screen";
import "../preview/screen";
import "./pickers";
import "../export/export-dialog";
import "../views/device-status";
import type { Background, Board, Hass, HassEntity, Issue, Page, Project, PropDef, StudioInfo, Theme, Widget, WidgetDef } from "../types";

const UNDO_LIMIT = 100;
/** "brightness_pct=50, color_name=red" -> {brightness_pct: "50", color_name: "red"} */
function parseData(text: string): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const part of text.split(",")) {
    const [k, ...rest] = part.split("=");
    if (k.trim() && rest.length) out[k.trim()] = rest.join("=").trim();
  }
  return Object.keys(out).length ? out : undefined;
}

const ACTION_SERVICES: Record<string, string> = {
  scene: "scene.turn_on", script: "script.turn_on", button: "button.press", input_button: "input_button.press",
  automation: "automation.trigger",
};

export class CydEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    api: { attribute: false },
    info: { attribute: false },
    boards: { attribute: false },
    widgetDefs: { attribute: false },
    themes: { attribute: false },
    projectId: {},
    narrow: { type: Boolean },
    _project: { state: true },
    _pageId: { state: true },
    _selected: { state: true },
    _mode: { state: true },
    _zoom: { state: true },
    _avail: { state: true },
    _sample: { state: true },
    _night: { state: true },
    _realActions: { state: true },
    _sim: { state: true },
    _simAttr: { state: true },
    _overlay: { state: true },
    _images: { state: true },
    _message: { state: true },
    _saveState: { state: true },
    _issues: { state: true },
    _showExport: { state: true },
    _now: { state: true },
  };

  declare hass: Hass;
  declare api: Api;
  declare info: StudioInfo;
  declare boards: Record<string, Board>;
  declare widgetDefs: Record<string, WidgetDef>;
  declare themes: Record<string, Theme>;
  declare projectId: string;
  declare narrow: boolean;
  declare _project: Project | null;
  declare _pageId: string;
  declare _selected: string[];
  declare _mode: "edit" | "preview";
  declare _zoom: number | "fit";
  /** free space of the preview column (measured, so the HA sidebar and the height count) */
  declare _avail: { w: number; h: number } | null;
  private resizeObserver?: ResizeObserver;
  declare _sample: boolean;
  declare _night: boolean;
  declare _realActions: boolean;
  declare _sim: Record<string, string>;
  declare _simAttr: Record<string, Record<string, unknown>>;
  declare _overlay: { entity: string; title: string; kind: number; value: number; light?: LightOverlay } | null;
  declare _images: Record<string, HTMLImageElement>;
  declare _message: { title: string; text: string } | null;
  declare _saveState: "saved" | "saving" | "dirty" | "error";
  declare _issues: Issue[];
  declare _showExport: boolean;
  declare _now: Date;

  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private saveTimer?: number;
  private validateTimer?: number;
  private clockTimer?: number;
  private clipboard: Widget[] = [];
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  constructor() {
    super();
    this._project = null;
    this._pageId = "";
    this._selected = [];
    this._mode = "edit";
    this._zoom = "fit";
    this._avail = null;
    this._sample = false;
    this._night = false;
    this._realActions = false;
    this._sim = {};
    this._simAttr = {};
    this._overlay = null;
    this._images = {};
    this._message = null;
    this._saveState = "saved";
    this._issues = [];
    this._showExport = false;
    this._now = new Date();
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this.keyHandler);
    this.clockTimer = window.setInterval(() => (this._now = new Date()), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.keyHandler);
    window.clearInterval(this.clockTimer);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this._saveState === "dirty") void this.flushSave();
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("projectId") && this.projectId) void this.load();
  }

  private async load() {
    const project = normalize(await this.api.project(this.projectId));
    this._project = project;
    this._pageId = project.navigation?.home_page ?? project.pages[0]?.id ?? "";
    this._selected = [];
    this.undoStack = [];
    this.redoStack = [];
    this.scheduleValidate(0);
    this._images = await loadProjectImages(this.api, project);
  }

  // -- model mutations --------------------------------------------------------
  private mutate(fn: (p: Project) => void) {
    if (!this._project) return;
    this.undoStack.push(JSON.stringify(this._project));
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    const next = structuredClone(this._project);
    fn(next);
    this._project = next;
    this.changed();
  }

  private changed() {
    this._saveState = "dirty";
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.flushSave(), 800);
    this.scheduleValidate();
  }

  private async flushSave() {
    if (!this._project) return;
    window.clearTimeout(this.saveTimer);
    this._saveState = "saving";
    try {
      const saved = await this.api.save(this._project);
      if (this._project) {
        // keep local edits, take server-assigned fields only
        this._project = { ...this._project, id: saved.id, meta: saved.meta,
          settings: { ...this._project.settings, api_key: saved.settings?.api_key } };
      }
      this._saveState = "saved";
    } catch {
      this._saveState = "error";
    }
  }

  private scheduleValidate(delay = 1200) {
    window.clearTimeout(this.validateTimer);
    this.validateTimer = window.setTimeout(async () => {
      if (!this._project) return;
      try {
        const result = await this.api.generate(this._project);
        this._issues = result.issues;
      } catch {
        /* backend unavailable – keep last result */
      }
    }, delay);
  }

  private undo() {
    const prev = this.undoStack.pop();
    if (!prev || !this._project) return;
    this.redoStack.push(JSON.stringify(this._project));
    this._project = JSON.parse(prev) as Project;
    this.fixSelection();
    this.changed();
  }

  private redo() {
    const next = this.redoStack.pop();
    if (!next || !this._project) return;
    this.undoStack.push(JSON.stringify(this._project));
    this._project = JSON.parse(next) as Project;
    this.fixSelection();
    this.changed();
  }

  private fixSelection() {
    const page = this.page;
    if (!page) this._pageId = this._project?.pages[0]?.id ?? "";
    this._selected = this._selected.filter((id) => this.page?.widgets.some((w) => w.id === id));
  }

  private get page(): Page | undefined {
    return this._project?.pages.find((p) => p.id === this._pageId);
  }

  private editPage(fn: (page: Page, project: Project) => void) {
    const id = this._pageId;
    this.mutate((p) => {
      const page = p.pages.find((x) => x.id === id);
      if (page) fn(page, p);
    });
  }

  private editWidget(id: string, fn: (w: Widget) => void) {
    this.editPage((page) => {
      const w = page.widgets.find((x) => x.id === id);
      if (w) fn(w);
    });
  }

  private addWidget(type: string, at?: { x: number; y: number }) {
    const def = this.widgetDefs[type];
    const page = this.page;
    if (!def || !page || !this._project) return;
    const grid = pageGrid(this._project, page);
    let { w, h } = def.default_size;
    w = Math.min(w, grid.cols);
    h = Math.min(h, grid.rows);
    let pos = at ? { x: Math.min(at.x, grid.cols - w), y: Math.min(at.y, grid.rows - h) } : null;
    if (pos && overlapsAny(page.widgets, { ...pos, w, h })) pos = null;
    pos ??= findFreeSpot(page, grid.cols, grid.rows, w, h);
    if (!pos) {
      // no room for the default size: fall back to a single cell
      w = 1;
      h = 1;
      pos = at && !overlapsAny(page.widgets, { ...at, w, h }) ? at : findFreeSpot(page, grid.cols, grid.rows, 1, 1);
    }
    if (!pos) return;
    const widget: Widget = { id: newWidgetId(page), type, x: pos.x, y: pos.y, w, h, entity: null, props: defaultProps(def) };
    if (type === "scene_button") widget.action = { service: "", target: null };
    this.editPage((pg) => pg.widgets.push(widget));
    this._selected = [widget.id];
  }

  private deleteSelected() {
    const ids = this._selected;
    if (!ids.length) return;
    this.editPage((page) => (page.widgets = page.widgets.filter((w) => !ids.includes(w.id))));
    this._selected = [];
  }

  private copySelected() {
    this.clipboard = (this.page?.widgets ?? []).filter((w) => this._selected.includes(w.id)).map((w) => structuredClone(w));
  }

  private paste() {
    if (!this.clipboard.length || !this._project) return;
    const page = this.page!;
    const grid = pageGrid(this._project, page);
    const added: string[] = [];
    this.editPage((pg) => {
      for (const src of this.clipboard) {
        const spot = findFreeSpot(pg, grid.cols, grid.rows, Math.min(src.w, grid.cols), Math.min(src.h, grid.rows));
        if (!spot) break;
        const w = { ...structuredClone(src), id: newWidgetId(pg), ...spot };
        pg.widgets.push(w);
        added.push(w.id);
      }
    });
    this._selected = added;
  }

  private onKey(e: KeyboardEvent) {
    const path = e.composedPath();
    const typing = path.some((el) => el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"));
    if (typing || this._showExport) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); this.undo(); }
    else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); this.redo(); }
    else if (mod && e.key.toLowerCase() === "c") this.copySelected();
    else if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); this.paste(); }
    else if ((e.key === "Delete" || e.key === "Backspace") && this._selected.length && this._mode === "edit") { e.preventDefault(); this.deleteSelected(); }
    else if (e.key === "Escape") this._selected = [];
  }

  // -- pages --------------------------------------------------------------------
  private addPage(parent: string | null = null) {
    if (!this._project) return;
    const name = parent ? `${t("add_subpage")} ${this._project.pages.length + 1}` : `${lang() === "de" ? "Seite" : "Page"} ${this._project.pages.length + 1}`;
    const id = pageIdFrom(name, this._project.pages.map((p) => p.id));
    this.mutate((p) => p.pages.push({ id, name, icon: parent ? "mdi:subdirectory-arrow-right" : "mdi:view-dashboard",
      parent, in_navigation: !parent, layout: "grid", widgets: [] }));
    this._pageId = id;
    this._selected = [];
  }

  private deletePage(id: string) {
    if (!this._project || this._project.pages.length <= 1) return;
    const remove = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const p of this._project.pages) if (p.parent && remove.has(p.parent) && !remove.has(p.id)) { remove.add(p.id); grew = true; }
    }
    this.mutate((p) => {
      p.pages = p.pages.filter((pg) => !remove.has(pg.id));
      if (p.navigation && remove.has(p.navigation.home_page ?? "")) p.navigation.home_page = p.pages[0]?.id ?? null;
    });
    this._pageId = this._project.pages[0]?.id ?? "";
  }

  private movePage(id: string, dir: -1 | 1) {
    this.mutate((p) => {
      const i = p.pages.findIndex((x) => x.id === id);
      const page = p.pages[i];
      // swap with the next sibling of the same parent
      let j = i + dir;
      while (j >= 0 && j < p.pages.length && (p.pages[j].parent ?? null) !== (page.parent ?? null)) j += dir;
      if (j < 0 || j >= p.pages.length) return;
      [p.pages[i], p.pages[j]] = [p.pages[j], p.pages[i]];
    });
  }

  // -- preview interaction --------------------------------------------------------
  private stateResolver(): StateResolver {
    const sample = this._sample && this._project ? sampleState(this._project) : null;
    return (id: string): HassEntity | undefined => {
      const base = sample ? sample(id) : this.hass?.states[id];
      const sim = this._sim[id];
      const attrs = { ...(base?.attributes ?? {}), ...(this._simAttr[id] ?? {}) };
      if (sim) return { entity_id: id, state: sim, attributes: attrs };
      return base ? { ...base, attributes: attrs } : base;
    };
  }

  private tapTimer = 0;

  private onPreviewTap(ev: CustomEvent<{ hit: HitRegion; long: boolean; double?: boolean; point: { x: number; y: number } }>) {
    const { hit, long, point } = ev.detail;
    if (!this._message && !this._overlay && hit.kind === "widget") {
      const w = this.page?.widgets.find((x) => x.id === hit.id);
      if (w && this.runTrigger(w, ev.detail)) return;
    }
    if (this._message) {
      if (hit.kind === "overlay-close") this._message = null;
      return;
    }
    if (this._overlay) {
      if (hit.kind === "overlay-close") this._overlay = null;
      else if (hit.kind === "overlay-slider") {
        const frac = Math.max(0, Math.min(1, (point.x - hit.rect.x) / hit.rect.w));
        if (hit.id === "ct" || hit.id === "hue") this.setLightValue(hit.id, frac);
        else this.setOverlayValue(frac * 100);
      }
      return;
    }
    if (long) {
      const w = this.page?.widgets.find((x) => x.id === hit.id);
      if (w && hit.kind === "widget" && this.openPopup(w)) return;
    }
    this.builtinTap(hit);
  }

  /**
   * Action builder in the preview. Returns true when the event was handled (configured steps,
   * or a tap held back to see whether a second tap follows).
   */
  private runTrigger(w: Widget, d: { long: boolean; double?: boolean }): boolean {
    const hasDouble = triggerSteps(w, "double_tap") !== null;
    if (d.double && hasDouble) {
      window.clearTimeout(this.tapTimer);
      this.runSteps(w, triggerSteps(w, "double_tap")!);
      return true;
    }
    const trigger: Trigger = d.long ? "long_press" : "tap";
    const steps = triggerSteps(w, trigger);
    if (trigger === "tap" && hasDouble) {
      // like the device (on_single_click): wait whether a second tap follows
      window.clearTimeout(this.tapTimer);
      this.tapTimer = window.setTimeout(() => {
        if (steps !== null) this.runSteps(w, steps);
        else this.builtinTap({ kind: "widget", id: w.id, rect: { x: 0, y: 0, w: 0, h: 0 } });
      }, 350);
      return true;
    }
    if (steps === null) return false;
    this.runSteps(w, steps);
    return true;
  }

  private async runSteps(w: Widget, steps: ActionStep[]) {
    const project = this._project!;
    const real = this._realActions && this.info?.preview_real_actions;
    const home = project.navigation?.home_page || project.pages[0].id;
    for (const s of steps) {
      if (s.type === "toggle") {
        const entity = s.entity || w.entity;
        if (!entity) continue;
        const cur = this.stateResolver()(entity)?.state;
        const domain = entity.split(".")[0];
        const next = isOn(cur) ? (domain === "cover" ? "closed" : "off") : (domain === "cover" ? "open" : "on");
        this._sim = { ...this._sim, [entity]: next };
        if (real) void this.hass.callService("homeassistant", "toggle", { entity_id: entity });
      } else if (s.type === "service" && s.service && real) {
        const [domain, service] = s.service.split(".");
        void this.hass.callService(domain, service, { ...(s.data ?? {}), ...(s.target ? { entity_id: s.target } : {}) });
      } else if (s.type === "page" && s.page && project.pages.some((p) => p.id === s.page)) {
        this._pageId = s.page;
      } else if (s.type === "back") {
        this._pageId = this.page?.parent || home;
      } else if (s.type === "home") {
        this._pageId = home;
      } else if (s.type === "popup") {
        this.openPopup(w);
      } else if (s.type === "delay" && s.ms) {
        await new Promise((r) => window.setTimeout(r, Math.min(s.ms!, 60000)));
      }
    }
  }

  /** The widget's own popup (long press slider / light popup); false if it has none. */
  private openPopup(w: Widget): boolean {
    const spec = w.entity ? VALUE_ATTRIBUTES[w.entity.split(".")[0]] : undefined;
    if (w.type === "toggle_tile" && spec && (w.props.long_press ?? "slider") === "slider") {
      const ent = this.stateResolver()(w.entity!);
      const on = spec[1] === 2 || ent?.state === "on";
      this._overlay = {
        entity: w.entity!, kind: spec[1], title: String(w.props.label || ent?.attributes.friendly_name || w.entity),
        value: on ? tileValuePercent(w.entity, ent) ?? 0 : 0,
      };
      const caps = lightCaps(ent);
      if (spec[1] === 1 && (w.props.color_controls ?? true) && (caps.hasCt || caps.hasHs)) {
        const hs = ent?.attributes.hs_color;
        const kelvin = Number(ent?.attributes.color_temp_kelvin);
        this._overlay.light = {
          ...caps, ct: Number.isFinite(kelvin) && kelvin > 0 ? kelvin : 4000,
          hue: Array.isArray(hs) ? Number(hs[0]) || 0 : 0,
        };
      }
      return true;
    }
    return false;
  }

  /** Built-in tap behavior of widgets, tabs and the back button. */
  private builtinTap(hit: HitRegion) {
    const project = this._project!;
    if (hit.kind === "tab" || hit.kind === "back") {
      this._pageId = hit.id;
      return;
    }
    const w = this.page?.widgets.find((x) => x.id === hit.id);
    if (!w) return;
    if (w.type === "toggle_tile" && w.entity) {
      const cur = this.stateResolver()(w.entity)?.state;
      const domain = w.entity.split(".")[0];
      const next = isOn(cur) ? (domain === "cover" ? "closed" : "off") : (domain === "cover" ? "open" : "on");
      this._sim = { ...this._sim, [w.entity]: next };
      if (this._realActions && this.info?.preview_real_actions) {
        void this.hass.callService("homeassistant", "toggle", { entity_id: w.entity });
      }
    } else if (w.type === "page_button" && typeof w.props.target === "string") {
      this._pageId = w.props.target;
    } else if (w.type === "sensor_value" && typeof w.props.tap_page === "string" && project.pages.some((p) => p.id === w.props.tap_page)) {
      this._pageId = w.props.tap_page;
    } else if (w.type === "page_title" && this.page?.parent) {
      this._pageId = this.page.parent;
    } else if (w.type === "scene_button" && this._realActions && this.info?.preview_real_actions && w.action?.service) {
      const [domain, service] = w.action.service.split(".");
      void this.hass.callService(domain, service, w.action.target ? { entity_id: w.action.target, ...(w.action.data ?? {}) } : w.action.data);
    }
  }

  /** Slider released in the preview: update the simulated state (and call HA when real actions are on). */
  private setOverlayValue(raw: number) {
    const ov = this._overlay;
    if (!ov) return;
    const value = Math.max(0, Math.min(100, Math.round(raw)));
    this._overlay = { ...ov, value };
    const [attr] = VALUE_ATTRIBUTES[ov.entity.split(".")[0]];
    const stored = ov.kind === 1 ? Math.round((value * 255) / 100) : value;
    this._simAttr = { ...this._simAttr, [ov.entity]: { ...(this._simAttr[ov.entity] ?? {}), [attr]: stored } };
    const onState = ov.kind === 2 ? (value > 0 ? "open" : "closed") : value > 0 ? "on" : "off";
    this._sim = { ...this._sim, [ov.entity]: onState };
    if (this._realActions && this.info?.preview_real_actions) {
      const calls: Record<number, [string, string, string]> = {
        1: ["light", "turn_on", "brightness_pct"], 2: ["cover", "set_cover_position", "position"], 3: ["fan", "set_percentage", "percentage"],
      };
      const [domain, service, key] = calls[ov.kind];
      void this.hass.callService(domain, service, { entity_id: ov.entity, [key]: value });
    }
  }

  /** Color temperature / hue slider of the light overlay (like the device: light.turn_on on release). */
  private setLightValue(row: "ct" | "hue", frac: number) {
    const ov = this._overlay;
    if (!ov?.light) return;
    const [lo, hi] = LIGHT_SLIDERS[row];
    const value = Math.round(lo + frac * (hi - lo));
    this._overlay = { ...ov, light: { ...ov.light, [row]: value } };
    const prev = this._simAttr[ov.entity] ?? {};
    const attrs = row === "ct" ? { color_temp_kelvin: value, color_mode: "color_temp" } : { hs_color: [value, 100], color_mode: "hs" };
    this._simAttr = { ...this._simAttr, [ov.entity]: { ...prev, ...attrs } };
    this._sim = { ...this._sim, [ov.entity]: "on" };
    if (this._realActions && this.info?.preview_real_actions) {
      const data = row === "ct" ? { color_temp_kelvin: value } : { hs_color: [value, 100] };
      void this.hass.callService("light", "turn_on", { entity_id: ov.entity, ...data });
    }
  }

  private onPreviewSwipe(ev: CustomEvent<{ direction: "left" | "right" }>) {
    const project = this._project!;
    const page = this.page;
    if (!page || !(project.navigation?.swipe ?? true)) return;
    if (page.parent) {
      if (ev.detail.direction === "right") this._pageId = page.parent;
      return;
    }
    const nav = navPages(project);
    const i = nav.findIndex((p) => p.id === page.id);
    if (i < 0) return;
    let j = i + (ev.detail.direction === "left" ? 1 : -1);
    if (project.navigation?.wrap_around) j = (j + nav.length) % nav.length;
    if (j >= 0 && j < nav.length) this._pageId = nav[j].id;
  }

  // -- rendering ---------------------------------------------------------------
  static styles = css`
    :host { display: flex; flex-direction: column; height: 100%; color: var(--primary-text-color); }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--divider-color); flex-wrap: wrap; }
    .toolbar .title { font-size: 18px; font-weight: 500; margin-right: auto; }
    .toolbar .status { font-size: 12px; color: var(--secondary-text-color); }
    button { font: inherit; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button:hover { border-color: var(--primary-color); }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    button.on { border-color: var(--primary-color); color: var(--primary-color); }
    button:disabled { opacity: .4; cursor: default; }
    button.small { padding: 2px 6px; font-size: 12px; }
    .main { flex: 1; display: grid; grid-template-columns: 240px minmax(0, 1fr) 320px; min-height: 0; }
    .main.narrow { grid-template-columns: 1fr; grid-template-rows: auto auto auto; overflow: auto; }
    .col { overflow: auto; padding: 12px; min-height: 0; }
    .left { border-right: 1px solid var(--divider-color); }
    .right { border-left: 1px solid var(--divider-color); }
    .center { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 12px; padding: 24px 12px; overflow: auto; }
    h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--secondary-text-color); margin: 16px 0 8px; font-weight: 600; }
    h3:first-child { margin-top: 0; }
    .palette-item { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border-radius: 6px; cursor: grab; border: 1px solid transparent; }
    .palette-item:hover { border-color: var(--divider-color); background: rgba(127,127,127,.08); }
    .glyph { font-family: "${unsafeCSS(ICON_FAMILY)}"; font-size: 20px; width: 24px; text-align: center; }
    .pi-text { display: flex; flex-direction: column; min-width: 0; }
    .pi-name { font-size: 14px; }
    .pi-desc { font-size: 11px; color: var(--secondary-text-color); }
    .page-row { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 6px; cursor: pointer; }
    .page-row.active { background: rgba(127,127,127,.18); }
    .page-row .pname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .page-row .muted { font-size: 11px; color: var(--secondary-text-color); }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 13px; }
    .field > span { color: var(--secondary-text-color); }
    .field input[type=text], .field input[type=number], .field select { padding: 7px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
    .check { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 13px; }
    .row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .issues { border-top: 1px solid var(--divider-color); padding: 6px 12px; max-height: 120px; overflow: auto; font-size: 13px; }
    .issue { display: flex; gap: 6px; padding: 2px 0; cursor: pointer; }
    .issue.error { color: var(--error-color, #ef4444); }
    .issue.warning { color: var(--warning-color, #f59e0b); }
    .ok { color: var(--success-color, #22c55e); }
    .note { font-size: 12px; color: var(--secondary-text-color); max-width: 640px; text-align: center; }
    .zoom { display: flex; gap: 4px; align-items: center; }
    .danger { color: var(--error-color, #ef4444); }
    .crow { display: flex; gap: 4px; align-items: center; }
    .muted { font-size: 12px; color: var(--secondary-text-color); }
    h4 { margin: 12px 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--secondary-text-color); }
    .trigger { border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px; margin: 6px 0; display: flex; flex-direction: column; gap: 6px; }
    .trigger > .crow b { flex: 1; font-size: 13px; }
    .step { display: flex; flex-direction: column; gap: 4px; padding: 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .step select, .step input[type=text], .step input[type=number], .trigger select { padding: 5px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; min-width: 0; }
    .step .crow select { flex: 1; }
    .stepno { width: 18px; height: 18px; border-radius: 9px; background: var(--primary-color); color: var(--text-primary-color, #fff); font-size: 11px; display: inline-flex; align-items: center; justify-content: center; }
    .cond, .rule { border: 1px solid var(--divider-color); border-radius: 8px; padding: 6px; margin: 6px 0; display: flex; flex-direction: column; gap: 4px; }
    .rule .cond { border: 0; padding: 0; margin: 0; }
    .cond select, .cond input[type=text] { padding: 5px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; min-width: 0; flex: 1; }
    .field.color input[type=color] { width: 100%; height: 30px; padding: 0 2px; border: 1px solid var(--divider-color); border-radius: 6px; background: none; }
    input[type=range] { width: 100%; }
  `;

  private fitScale(): number {
    if (!this._project) return 2;
    const board = this.resolved();
    if (!board) return 2;
    if (this._zoom !== "fit") return this._zoom;
    const a = this._avail ?? { w: window.innerWidth - 640, h: window.innerHeight - 200 };
    // center column padding 24/12 px; keep room below the screen for the first hint line
    const w = a.w - 2 * 12 - 8;
    const h = this.narrow ? Infinity : a.h - 2 * 24 - 40;
    const fit = Math.min(w / board.width, h / board.height);
    return Math.max(1, Math.min(3, Math.floor(fit * 4) / 4));
  }

  protected updated(): void {
    const center = this.renderRoot.querySelector<HTMLElement>(".col.center");
    if (!center || this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = { w: Math.round(width + 2 * 12), h: Math.round(height + 2 * 24) };
      if (!this._avail || Math.abs(this._avail.w - next.w) > 4 || Math.abs(this._avail.h - next.h) > 4) this._avail = next;
    });
    this.resizeObserver.observe(center);
  }

  private resolved() {
    const p = this._project!;
    const board = this.boards[p.board];
    return board ? resolveBoard(board, p.board_variant, p.orientation) : null;
  }

  render() {
    const p = this._project;
    if (!p) return html`<div style="padding:24px">…</div>`;
    const board = this.resolved();
    const theme = this.themes[p.theme];
    const themed = theme ? { ...theme, colors: { ...theme.colors, ...(p.theme_overrides ?? {}) } } : undefined;
    const saveText = { saved: t("saved"), saving: t("saving"), dirty: "•", error: t("save_failed") }[this._saveState];
    const errors = this._issues.filter((i) => i.level === "error").length;
    return html`
      <div class="toolbar">
        <button @click=${() => this.close()}>← ${t("projects")}</button>
        <span class="title">${p.name}</span>
        <button ?disabled=${!this.undoStack.length} title="Strg+Z" @click=${() => this.undo()}>↶ ${t("undo")}</button>
        <button ?disabled=${!this.redoStack.length} title="Strg+Y" @click=${() => this.redo()}>↷ ${t("redo")}</button>
        <button class=${this._mode === "preview" ? "on" : ""} @click=${() => { this._mode = this._mode === "edit" ? "preview" : "edit"; this._selected = []; this._overlay = null; }}>
          ${this._mode === "edit" ? "▶ " + t("preview_mode") : "✎ " + t("edit_mode")}</button>
        <button class=${this._sample ? "on" : ""} @click=${() => (this._sample = !this._sample)}>${this._sample ? t("sample_data") : t("live_data")}</button>
        <button class=${this._night ? "on" : ""} @click=${() => (this._night = !this._night)}>☾ ${t("night_view")}</button>
        ${this._mode === "preview" && p.settings?.device_actions !== false ? html`<button title=${t("test_message_hint")}
          @click=${() => (this._message = this._message ? null : { title: t("test_message_title"), text: t("test_message_text") })}>✉ ${t("test_message")}</button>` : nothing}
        ${this.info?.preview_real_actions && this._mode === "preview" ? html`<label class="check" style="margin:0">
          <input type="checkbox" .checked=${this._realActions} @change=${(e: Event) => (this._realActions = (e.target as HTMLInputElement).checked)} />⚡</label>` : nothing}
        <span class="zoom">
          <button class="small" @click=${() => (this._zoom = Math.max(1, (this._zoom === "fit" ? this.fitScale() : this._zoom) - 0.5))}>−</button>
          <button class="small ${this._zoom === "fit" ? "on" : ""}" @click=${() => (this._zoom = "fit")}>${t("zoom_fit")}</button>
          <button class="small" @click=${() => (this._zoom = Math.min(3, (this._zoom === "fit" ? this.fitScale() : this._zoom) + 0.5))}>+</button>
        </span>
        <span class="status">${saveText}</span>
        <button class="primary" @click=${() => { void this.flushSave(); this._showExport = true; }}>${t("generate_code")}${errors ? ` (${errors} ⚠)` : ""}</button>
      </div>
      <div class="main ${this.narrow ? "narrow" : ""}">
        ${this.narrow ? nothing : html`<div class="col left">${this.renderPalette()}${this.renderPageTree()}</div>`}
        <div class="col center">
          ${board && themed ? html`<cyd-screen .project=${p} .board=${board} .theme=${themed} .pageId=${this._pageId}
            .state=${this.stateResolver()} .mode=${this._mode} .selected=${this._selected} .scale=${this.fitScale()}
            .night=${this._night} .now=${this._now}
            .overlay=${this._overlay ? { title: this._overlay.title, value: this._overlay.value, light: this._overlay.light } : null}
            .images=${this._images}
            .message=${this._message}
            @select=${(e: CustomEvent<{ ids: string[] }>) => (this._selected = e.detail.ids)}
            @widget-change=${(e: CustomEvent<{ id: string; changes: Partial<Widget> }>) => this.editWidget(e.detail.id, (w) => Object.assign(w, e.detail.changes))}
            @widget-add=${(e: CustomEvent<{ type: string; x: number; y: number }>) => this.addWidget(e.detail.type, e.detail)}
            @preview-tap=${this.onPreviewTap} @preview-swipe=${this.onPreviewSwipe}></cyd-screen>` : html`<div>Board/Theme?</div>`}
          <div class="note">${this.page && !this.page.widgets.length && this._mode === "edit" ? t("empty_page_hint") : t("next_step_hint")}</div>
          <div class="note">${t("preview_note")}</div>
          <button @click=${() => this.savePng()}>PNG</button>
          ${this.narrow ? html`<div style="width:100%">${this.renderPalette()}${this.renderPageTree()}</div>` : nothing}
        </div>
        <div class="col right">${this.renderProperties()}</div>
      </div>
      ${p.id ? html`<cyd-device-status collapsed style="padding:6px 12px" .api=${this.api} .projectId=${p.id}
        .deviceName=${p.device_name}></cyd-device-status>` : nothing}
      <div class="issues">
        ${this._issues.length ? this._issues.map((i) => html`<div class="issue ${i.level}" @click=${() => this.focusIssue(i)}>
          ${i.level === "error" ? "⛔" : "⚠"} ${lang() === "de" ? i.message : i.message_en}</div>`)
          : html`<span class="ok">✓ ${t("no_issues")}</span>`}
      </div>
      ${this._showExport ? html`<cyd-export-dialog .api=${this.api} .project=${p} .info=${this.info}
        @closed=${() => (this._showExport = false)}></cyd-export-dialog>` : nothing}`;
  }

  private focusIssue(i: Issue) {
    if (i.page) this._pageId = i.page;
    if (i.widget) this._selected = [i.widget];
  }

  private savePng() {
    const screen = this.renderRoot.querySelector("cyd-screen") as CydScreen | null;
    if (!screen) return;
    const a = document.createElement("a");
    a.href = screen.toPng();
    a.download = `${this._project?.device_name ?? "cyd"}-${this._pageId}.png`;
    a.click();
  }

  private close() {
    void this.flushSave();
    this.dispatchEvent(new CustomEvent("close-editor", { bubbles: true, composed: true }));
  }

  private renderPalette() {
    const defs = Object.values(this.widgetDefs);
    return html`<h3>${t("palette")}</h3>
      ${defs.map((d) => html`<div class="palette-item" draggable="true" title=${loc(d, "description")}
          @dragstart=${(e: DragEvent) => e.dataTransfer?.setData(WIDGET_DND_TYPE, d.type)}
          @click=${() => this.addWidget(d.type)}>
          <span class="glyph">${iconChar(d.icon) ?? ""}</span>
          <span class="pi-text"><span class="pi-name">${loc(d, "name")}</span><span class="pi-desc">${loc(d, "description")}</span></span>
        </div>`)}`;
  }

  private renderPageTree() {
    const p = this._project!;
    const rows: unknown[] = [];
    const walk = (parent: string | null, depth: number) => {
      for (const page of p.pages.filter((x) => (x.parent ?? null) === parent)) {
        rows.push(html`<div class="page-row ${page.id === this._pageId ? "active" : ""}" style="padding-left:${6 + depth * 16}px"
            @click=${() => { this._pageId = page.id; this._selected = []; }}>
            <span class="glyph">${iconChar(page.icon) ?? ""}</span>
            <span class="pname">${page.name}${p.navigation?.home_page === page.id ? " ⌂" : ""}
              ${!page.parent && page.in_navigation === false ? html`<span class="muted">(${t("hidden_in_navigation")})</span>` : nothing}</span>
            <button class="small" title=${t("move_up")} @click=${(e: Event) => { e.stopPropagation(); this.movePage(page.id, -1); }}>↑</button>
            <button class="small" title=${t("move_down")} @click=${(e: Event) => { e.stopPropagation(); this.movePage(page.id, 1); }}>↓</button>
          </div>`);
        walk(page.id, depth + 1);
      }
    };
    walk(null, 0);
    return html`<h3>${t("pages")}</h3>${rows}
      <div class="row2" style="margin-top:8px">
        <button @click=${() => this.addPage(null)}>+ ${t("add_page")}</button>
        <button ?disabled=${!this.page} @click=${() => this.addPage(this._pageId)}>+ ${t("add_subpage")}</button>
      </div>`;
  }

  // -- properties -----------------------------------------------------------------
  private renderProperties() {
    const page = this.page;
    if (this._selected.length === 1 && page) {
      const w = page.widgets.find((x) => x.id === this._selected[0]);
      if (w) return this.renderWidgetProps(w);
    }
    if (this._selected.length > 1) {
      return html`<h3>${this._selected.length} Widgets</h3>
        <button class="danger" @click=${() => this.deleteSelected()}>${t("delete_widget")}</button>`;
    }
    return html`${page ? this.renderPageProps(page) : nothing}${this.renderProjectProps()}`;
  }

  private text(label: string, value: unknown, onChange: (v: string) => void) {
    return html`<label class="field"><span>${label}</span><input type="text" .value=${String(value ?? "")}
      @change=${(e: Event) => onChange((e.target as HTMLInputElement).value)} /></label>`;
  }

  private num(label: string, value: unknown, onChange: (v: number | null) => void, min?: number, max?: number) {
    return html`<label class="field"><span>${label}</span><input type="number" .value=${value === null || value === undefined ? "" : String(value)}
      min=${min ?? ""} max=${max ?? ""} @change=${(e: Event) => {
        const raw = (e.target as HTMLInputElement).value;
        onChange(raw === "" ? null : Number(raw));
      }} /></label>`;
  }

  private check(label: string, value: unknown, onChange: (v: boolean) => void) {
    return html`<label class="check"><input type="checkbox" .checked=${Boolean(value)}
      @change=${(e: Event) => onChange((e.target as HTMLInputElement).checked)} />${label}</label>`;
  }

  private select(label: string, value: unknown, options: [string, string][], onChange: (v: string) => void) {
    return html`<label class="field"><span>${label}</span><select @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}>
      ${options.map(([v, l]) => html`<option value=${v} ?selected=${String(value ?? "") === v}>${l}</option>`)}</select></label>`;
  }

  private renderWidgetProps(w: Widget) {
    const def = this.widgetDefs[w.type];
    const p = this._project!;
    const pages: [string, string][] = [["", `– ${t("none")} –`], ...p.pages.map((pg): [string, string] => [pg.id, pg.name])];
    const set = (fn: (x: Widget) => void) => this.editWidget(w.id, fn);
    const prop = (d: PropDef) => {
      const label = lang() === "de" ? d.label : d.label_en;
      const value = w.props[d.key] ?? d.default;
      const setProp = (v: unknown) => set((x) => { x.props[d.key] = v; });
      switch (d.type) {
        case "text": return this.text(label, value, setProp);
        case "int": return this.num(label, value, (v) => setProp(v ?? d.default), d.min, d.max);
        case "bool": return this.check(label, value, setProp);
        case "select": return this.select(label, value, (d.options ?? []).map((o) => [o, o]), setProp);
        case "page": return this.select(label, value, pages, (v) => setProp(v || null));
        case "entity": return html`<div class="field"><span>${label}</span><cyd-entity-picker .hass=${this.hass}
          .value=${(value as string) ?? null} .domains=${d.domains ?? []}
          @value-changed=${(e: CustomEvent<{ value: string }>) => setProp(e.detail.value)}></cyd-entity-picker>
          ${value ? html`<button class="small" @click=${() => setProp(null)}>✕</button>` : nothing}</div>`;
        case "icon": return html`<div class="field"><span>${label}</span><cyd-icon-picker .value=${String(value ?? "")}
          @value-changed=${(e: CustomEvent<{ value: string }>) => setProp(e.detail.value)}></cyd-icon-picker></div>`;
        default: return nothing;
      }
    };
    const sim = w.entity ? this._sim[w.entity] ?? "" : "";
    return html`
      <h3>${def ? loc(def, "name") : w.type}</h3>
      ${def?.entity === "required" || def?.entity === "optional" ? html`<div class="field"><span>${t("entity")}</span>
        <cyd-entity-picker .hass=${this.hass} .value=${w.entity ?? null} .domains=${def.domains}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this.pickEntity(w, e.detail.value)}></cyd-entity-picker></div>` : nothing}
      ${def?.entity === "action" ? html`
        <div class="field"><span>${t("action_target")}</span>
          <cyd-entity-picker .hass=${this.hass} .value=${w.action?.target ?? null} .domains=${def.domains}
            @value-changed=${(e: CustomEvent<{ value: string }>) => this.pickActionTarget(w, e.detail.value)}></cyd-entity-picker></div>
        ${this.text(t("action_service"), w.action?.service, (v) => set((x) => { x.action = { ...(x.action ?? { service: "" }), service: v.trim() }; }))}` : nothing}
      ${def?.props.filter((d) => !d.min_count || Number(w.props.count ?? 4) >= d.min_count).map(prop)}
      ${this.renderAppearance(w)}
      ${this.renderActions(w)}
      ${this.renderConditions(w)}
      ${this.renderRules(w)}
      <h3>${t("position")}</h3>
      <div class="row4">
        ${this.num("x", w.x, (v) => set((x) => { x.x = Math.max(0, v ?? 0); }), 0)}
        ${this.num("y", w.y, (v) => set((x) => { x.y = Math.max(0, v ?? 0); }), 0)}
        ${this.num("w", w.w, (v) => set((x) => { x.w = Math.max(1, v ?? 1); }), 1)}
        ${this.num("h", w.h, (v) => set((x) => { x.h = Math.max(1, v ?? 1); }), 1)}
      </div>
      ${w.entity ? this.select(t("simulate_state"), sim, [["", t("sim_live")], ["on", t("sim_on")], ["off", t("sim_off")], ["unavailable", t("sim_unavailable")]],
        (v) => { const next = { ...this._sim }; if (v) next[w.entity!] = v; else delete next[w.entity!]; this._sim = next; }) : nothing}
      <div class="row2">
        <button @click=${() => this.copySelected()}>${t("copy")}</button>
        <button class="danger" @click=${() => this.deleteSelected()}>${t("delete_widget")}</button>
      </div>`;
  }

  /** Background color / image chooser (image is fitted to the display size in the browser). */
  private renderBackground(bg: Background | null, apply: (bg: Background | null) => void, hint: string) {
    const board = this.resolved();
    const choose = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file || !board || !this._project) return;
        if (!this._project.id) await this.flushSave();
        try {
          const data = await fitImageFile(file, board.width, board.height);
          const { asset_id } = await this.api.uploadAsset(this._project.id, data, board.width, board.height);
          const img = new Image();
          img.src = data;
          await img.decode();
          this._images = { ...this._images, [asset_id]: img };
          apply({ ...(bg ?? {}), image: asset_id });
        } catch (err) {
          alert(`${t("bg_upload_failed")}: ${String((err as { message?: string }).message ?? err)}`);
        }
      };
      input.click();
    };
    const hasColor = Boolean(bg?.color);
    return html`<div class="field"><span class="muted">${hint}</span></div>
      <div class="row2">
        <label class="field color"><span>${t("bg_color")}</span><span class="crow">
          <input type="color" .value=${bg?.color ?? this.themed().colors.background}
            @change=${(e: Event) => apply({ ...(bg ?? {}), color: (e.target as HTMLInputElement).value })} />
          ${hasColor ? html`<button class="small" title=${t("reset")} @click=${() => apply(bg?.image ? { image: bg.image } : null)}>↺</button>` : nothing}</span></label>
        <div class="field"><span>${t("bg_image")}</span>
          ${bg?.image ? html`<span class="crow"><button class="small" @click=${choose}>${t("bg_change")}</button>
            <button class="small danger" @click=${() => apply(hasColor ? { color: bg.color } : null)}>✕</button></span>`
            : html`<button @click=${choose}>${t("bg_choose")}</button>`}
        </div>
      </div>`;
  }

  /** Action builder: per trigger built-in / nothing / own steps. */
  private renderActions(w: Widget) {
    const p = this._project!;
    const services = Object.entries((this.hass as unknown as { services?: Record<string, Record<string, unknown>> })?.services ?? {})
      .flatMap(([d, list]) => Object.keys(list).map((s) => `${d}.${s}`)).sort();
    const pages: [string, string][] = p.pages.map((pg) => [pg.id, pg.name]);
    const trigger = (tr: Trigger) => {
      const steps = triggerSteps(w, tr);
      const setSteps = (next: ActionStep[] | null) => this.editWidget(w.id, (x) => {
        if (next === null) delete x[tr];
        else x[tr] = { actions: next };
      });
      const mode = steps === null ? "default" : steps.length ? "custom" : "none";
      const upd = (i: number, patchStep: Partial<ActionStep>) => setSteps(steps!.map((s, j) => (j === i ? { ...s, ...patchStep } : s)));
      const move = (i: number, d: number) => {
        const next = [...steps!];
        const [x] = next.splice(i, 1);
        next.splice(Math.max(0, Math.min(next.length, i + d)), 0, x);
        setSteps(next);
      };
      const stepRow = (s: ActionStep, i: number) => html`<div class="step">
        <div class="crow">
          <span class="stepno">${i + 1}</span>
          <select @change=${(e: Event) => upd(i, { type: (e.target as HTMLSelectElement).value as ActionStep["type"] })}>
            ${STEP_TYPES.map((st) => html`<option value=${st} ?selected=${s.type === st}>${t(`step_${st}` as "step_toggle")}</option>`)}</select>
          <button class="small" title="↑" ?disabled=${i === 0} @click=${() => move(i, -1)}>↑</button>
          <button class="small" title="↓" ?disabled=${i === steps!.length - 1} @click=${() => move(i, 1)}>↓</button>
          <button class="small danger" @click=${() => setSteps(steps!.filter((_, j) => j !== i))}>✕</button>
        </div>
        ${s.type === "toggle" ? html`<cyd-entity-picker .hass=${this.hass} .value=${s.entity ?? null} .domains=${[]}
            @value-changed=${(e: CustomEvent<{ value: string }>) => upd(i, { entity: e.detail.value })}></cyd-entity-picker>
          ${!s.entity ? html`<span class="muted">${t("this_entity")}</span>` : nothing}` : nothing}
        ${s.type === "service" ? html`
          <input type="text" list="cyd-services" placeholder="light.turn_on" .value=${s.service ?? ""}
            @change=${(e: Event) => upd(i, { service: (e.target as HTMLInputElement).value.trim() })} />
          <cyd-entity-picker .hass=${this.hass} .value=${s.target ?? null} .domains=${[]}
            @value-changed=${(e: CustomEvent<{ value: string }>) => upd(i, { target: e.detail.value })}></cyd-entity-picker>
          <input type="text" placeholder=${t("step_data_hint")} .value=${s.data ? Object.entries(s.data).map(([k, v]) => `${k}=${String(v)}`).join(", ") : ""}
            @change=${(e: Event) => upd(i, { data: parseData((e.target as HTMLInputElement).value) })} />` : nothing}
        ${s.type === "page" ? html`<select @change=${(e: Event) => upd(i, { page: (e.target as HTMLSelectElement).value })}>
            <option value="">– ${t("none")} –</option>
            ${pages.map(([id, name]) => html`<option value=${id} ?selected=${s.page === id}>${name}</option>`)}</select>` : nothing}
        ${s.type === "delay" ? html`<input type="number" min="0" max="60000" step="100" .value=${String(s.ms ?? 500)}
            @change=${(e: Event) => upd(i, { ms: Number((e.target as HTMLInputElement).value) || 0 })} /> ms` : nothing}
      </div>`;
      return html`<div class="trigger">
        <div class="crow"><b>${t(`trigger_${tr}` as "trigger_tap")}</b>
          <select @change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            setSteps(v === "default" ? null : v === "none" ? [] : [{ type: w.entity ? "toggle" : "page" }]);
          }}>
            <option value="default" ?selected=${mode === "default"}>${t("trigger_default")}</option>
            <option value="none" ?selected=${mode === "none"}>${t("trigger_none")}</option>
            <option value="custom" ?selected=${mode === "custom"}>${t("trigger_custom")}</option>
          </select></div>
        ${steps?.map(stepRow)}
        ${mode === "custom" ? html`<button class="small" @click=${() => setSteps([...steps!, { type: "delay", ms: 500 }])}>+ ${t("add_step")}</button>` : nothing}
      </div>`;
    };
    return html`<h3>${t("actions")}</h3>
      <div class="muted">${t("actions_hint")}</div>
      <datalist id="cyd-services">${services.map((s) => html`<option value=${s}></option>`)}</datalist>
      ${trigger("tap")}${trigger("long_press")}${trigger("double_tap")}`;
  }

  private opOptions(): [string, string][] {
    return OPS.map((op): [string, string] => [op, t(`op_${op}` as "op_eq")]);
  }

  /** One condition row: [entity] [operator] [value] – entity empty = the widget's own entity. */
  private conditionRow(c: { entity?: string | null; op: string; value?: string }, update: (c: Record<string, unknown>) => void,
    remove: () => void, ownEntity: boolean) {
    const needsValue = !["on", "off"].includes(c.op);
    return html`<div class="cond">
      <cyd-entity-picker .hass=${this.hass} .value=${c.entity ?? null} .domains=${[]}
        @value-changed=${(e: CustomEvent<{ value: string }>) => update({ ...c, entity: e.detail.value })}></cyd-entity-picker>
      ${ownEntity && !c.entity ? html`<span class="muted">${t("this_entity")}</span>` : nothing}
      <div class="crow">
        <select @change=${(e: Event) => update({ ...c, op: (e.target as HTMLSelectElement).value })}>
          ${this.opOptions().map(([v, l]) => html`<option value=${v} ?selected=${c.op === v}>${l}</option>`)}</select>
        ${needsValue ? html`<input type="text" .value=${c.value ?? ""} placeholder=${t("value")}
          @change=${(e: Event) => update({ ...c, value: (e.target as HTMLInputElement).value })} />` : nothing}
        <button class="small danger" @click=${remove}>✕</button>
      </div>
    </div>`;
  }

  private renderConditions(w: Widget) {
    const list = w.visible_if ?? [];
    const set = (next: typeof list) => this.editWidget(w.id, (x) => { x.visible_if = next; });
    return html`<h3>${t("conditions")}</h3>
      <div class="muted">${t("conditions_hint")}</div>
      ${list.map((c, i) => this.conditionRow(c, (nc) => set(list.map((o, j) => (j === i ? (nc as typeof c) : o))),
        () => set(list.filter((_, j) => j !== i)), false))}
      <button class="small" @click=${() => set([...list, { entity: w.entity ?? null, op: "on" }])}>+ ${t("add_condition")}</button>`;
  }

  private renderRules(w: Widget) {
    const list = w.style_rules ?? [];
    const set = (next: typeof list) => this.editWidget(w.id, (x) => { x.style_rules = next; });
    const color = (r: (typeof list)[number], i: number, key: "bg" | "border" | "text" | "icon", label: string) => html`
      <label class="field color"><span>${label}</span><span class="crow">
        <input type="color" .value=${r[key] ?? "#ef4444"} @change=${(e: Event) => set(list.map((o, j) => (j === i ? { ...o, [key]: (e.target as HTMLInputElement).value } : o)))} />
        ${r[key] ? html`<button class="small" @click=${() => set(list.map((o, j) => { if (j !== i) return o; const n = { ...o }; delete n[key]; return n; }))}>↺</button>` : nothing}
      </span></label>`;
    return html`<h3>${t("rules")}</h3>
      <div class="muted">${t("rules_hint")}</div>
      ${list.map((r, i) => html`<div class="rule">
        ${this.conditionRow(r, (nc) => set(list.map((o, j) => (j === i ? { ...o, ...nc } : o))), () => set(list.filter((_, j) => j !== i)), true)}
        <div class="row4">${color(r, i, "bg", t("color_bg"))}${color(r, i, "border", t("color_border"))}${color(r, i, "text", t("color_text"))}${color(r, i, "icon", t("icon"))}</div>
      </div>`)}
      <button class="small" @click=${() => set([...list, { entity: null, op: "gt", value: "25", text: "#ef4444" }])}>+ ${t("add_rule")}</button>`;
  }

  /** Theme of the project with the user's color overrides. */
  private themed() {
    const p = this._project!;
    const th = this.themes[p.theme];
    return { ...th, colors: { ...th.colors, ...(p.theme_overrides ?? {}) } };
  }

  private presetOptions(withDefault: string): [string, string][] {
    return [["", withDefault], ...Object.entries(PRESETS.presets).map(([id, pr]): [string, string] => [id, loc(pr, "name")])];
  }

  /** "Aussehen": preset, colors, opacity, corners, border, icon circle, text size – with apply-to-page / as default. */
  private renderAppearance(w: Widget) {
    const p = this._project!;
    const st = w.style ?? {};
    const resolved = resolveTileStyle(this.themed(), { ...(p.tile_style ?? {}), ...st });
    const set = (key: string, value: unknown) => this.editWidget(w.id, (x) => {
      const next = { ...(x.style ?? {}) };
      if (value === null || value === undefined || value === "") delete next[key];
      else next[key] = value;
      x.style = next;
    });
    const color = (key: keyof typeof resolved, label: string) => html`<label class="field color"><span>${label}</span>
      <span class="crow"><input type="color" .value=${String(resolved[key])} @change=${(e: Event) => set(key, (e.target as HTMLInputElement).value)} />
      ${st[key] ? html`<button class="small" title=${t("reset")} @click=${() => set(key, null)}>↺</button>` : nothing}</span></label>`;
    const range = (key: keyof typeof resolved, label: string, max: number) => html`<label class="field"><span>${label}: ${resolved[key]}</span>
      <input type="range" min="0" max=${max} .value=${String(resolved[key])} @change=${(e: Event) => set(key, Number((e.target as HTMLInputElement).value))} /></label>`;
    const isTile = ["toggle_tile", "sensor_value", "binary_indicator", "scene_button", "page_button"].includes(w.type) || (w.type === "label" && w.props.background);
    return html`
      <h3>${t("appearance")}</h3>
      ${this.select(t("style_preset"), st.preset ?? "", this.presetOptions(t("style_project_default")), (v) => set("preset", v || null))}
      ${isTile ? html`<div class="row2">${color("bg", t("color_bg"))}${w.type === "toggle_tile" ? color("bg_on", t("color_bg_on")) : color("border", t("color_border"))}</div>` : nothing}
      <div class="row2">${color("text", t("color_text"))}${color("icon_on", t("color_icon"))}</div>
      ${w.type === "toggle_tile" ? html`<div class="row2">${color("text_on", t("color_text_on"))}${color("icon", t("color_icon_off"))}</div>` : nothing}
      ${isTile ? html`${range("bg_opa", t("opacity"), 100)}${range("radius", t("corners"), 40)}${range("border_width", t("border_width"), 4)}` : nothing}
      <h4>${t("icon_and_font")}</h4>
      <div class="row2">
        ${this.select(t("icon_size"), resolved.icon_size, [["auto", t("auto")], ["none", t("icon_hidden")], ["s", "S"], ["m", "M"], ["l", "L"]], (v) => set("icon_size", v === "auto" ? null : v))}
        ${this.check(t("icon_circle"), resolved.circle, (v) => set("circle", v))}
      </div>
      <div class="row2">
        ${this.select(t("text_size"), resolved.text_size, [["xs", "XS"], ["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]], (v) => set("text_size", v))}
        ${this.select(t("text_weight"), resolved.text_weight, [["normal", t("weight_normal")], ["bold", t("weight_bold")]], (v) => set("text_weight", v === "normal" ? null : v))}
      </div>
      ${w.type === "sensor_value" ? this.select(t("value_size"), resolved.value_size, [["auto", t("auto")], ["xs", "XS"], ["s", "S"], ["m", "M"], ["l", "L"], ["xl", "XL"]], (v) => set("value_size", v === "auto" ? null : v)) : nothing}
      <div class="row2">
        <button @click=${() => this.editPage((pg) => { for (const x of pg.widgets) if (x.id !== w.id) x.style = { ...(w.style ?? {}) }; })}>${t("style_to_page")}</button>
        <button @click=${() => this.mutate((pp) => {
          pp.tile_style = { ...(w.style ?? {}) };
          for (const pg of pp.pages) for (const x of pg.widgets) if (x.id === w.id && pg.id === this._pageId) x.style = {};
        })}>${t("style_as_default")}</button>
      </div>
      ${Object.keys(st).length ? html`<button class="small" @click=${() => this.editWidget(w.id, (x) => { x.style = {}; })}>↺ ${t("style_reset")}</button>` : nothing}`;
  }

  private pickEntity(w: Widget, entityId: string) {
    const st = this.hass?.states[entityId];
    this.editWidget(w.id, (x) => {
      x.entity = entityId;
      if (!x.props.label && st) x.props.label = String(st.attributes.friendly_name ?? "");
      if (x.type === "sensor_value" && st) {
        if (!x.props.unit && st.attributes.unit_of_measurement) x.props.unit = String(st.attributes.unit_of_measurement);
        x.props.numeric = st.state === "unavailable" || st.state === "unknown" || !Number.isNaN(Number.parseFloat(st.state));
      }
      if (st?.attributes.icon && typeof st.attributes.icon === "string" && st.attributes.icon.startsWith("mdi:")) x.props.icon = st.attributes.icon;
      const domain = entityId.split(".")[0];
      if (st && x.type === "slider" && (domain === "input_number" || domain === "number")) {
        if (st.attributes.min !== undefined) x.props.min = Math.round(Number(st.attributes.min));
        if (st.attributes.max !== undefined) x.props.max = Math.round(Number(st.attributes.max));
        if (st.attributes.unit_of_measurement) x.props.unit = String(st.attributes.unit_of_measurement);
      }
      if (st && x.type === "climate") {
        if (st.attributes.min_temp !== undefined) x.props.min = Math.round(Number(st.attributes.min_temp));
        if (st.attributes.max_temp !== undefined) x.props.max = Math.round(Number(st.attributes.max_temp));
      }
      if (st && (x.type === "gauge" || x.type === "multi_value") && !x.props.unit && st.attributes.unit_of_measurement) {
        x.props.unit = String(st.attributes.unit_of_measurement);
      }
    });
  }

  private pickActionTarget(w: Widget, entityId: string) {
    const st = this.hass?.states[entityId];
    const domain = entityId.split(".")[0];
    this.editWidget(w.id, (x) => {
      x.action = { ...(x.action ?? { service: "" }), target: entityId };
      if (!x.action.service || Object.values(ACTION_SERVICES).includes(x.action.service)) x.action.service = ACTION_SERVICES[domain] ?? `${domain}.turn_on`;
      if (!x.props.label && st) x.props.label = String(st.attributes.friendly_name ?? "");
    });
  }

  private renderPageProps(page: Page) {
    const p = this._project!;
    const parents: [string, string][] = [["", `– ${t("none")} –`], ...p.pages.filter((x) => x.id !== page.id).map((x): [string, string] => [x.id, x.name])];
    return html`
      <h3>${t("page_settings")}</h3>
      ${this.text(t("page_name"), page.name, (v) => this.editPage((pg) => { pg.name = v || pg.name; }))}
      <div class="field"><span>${t("icon")}</span><cyd-icon-picker .value=${page.icon ?? ""}
        @value-changed=${(e: CustomEvent<{ value: string }>) => this.editPage((pg) => { pg.icon = e.detail.value; })}></cyd-icon-picker></div>
      ${this.select(t("parent_page"), page.parent ?? "", parents, (v) => this.editPage((pg) => {
        if (v && rootOf({ ...p, pages: p.pages.map((x) => (x.id === pg.id ? { ...x, parent: v } : x)) }, pg).id === pg.id) return; // cycle
        pg.parent = v || null;
        pg.in_navigation = !pg.parent;
      }))}
      ${!page.parent ? this.check(t("in_navigation"), page.in_navigation ?? true, (v) => this.editPage((pg) => { pg.in_navigation = v; })) : nothing}
      ${this.renderBackground(page.background ?? null, (bg) => this.editPage((pg) => { pg.background = bg; }), t("bg_page_hint"))}
      ${this.num(t("page_timeout"), page.timeout_s ?? null, (v) => this.editPage((pg) => { pg.timeout_s = v && v >= 5 ? v : null; }), 5)}
      <div class="row2">
        <button @click=${() => this.mutate((pp) => { pp.navigation = { ...pp.navigation, home_page: page.id }; })}
          ?disabled=${p.navigation?.home_page === page.id}>⌂ ${t("home_page")}</button>
        <button class="danger" ?disabled=${p.pages.length <= 1} @click=${() => this.deletePage(page.id)}>${t("delete")}</button>
      </div>`;
  }

  private renderProjectProps() {
    const p = this._project!;
    const board = this.boards[p.board];
    const set = (fn: (pp: Project) => void) => this.mutate(fn);
    const variants: [string, string][] = [["", t("variant_default")], ...(board?.display.variants ?? []).map((v): [string, string] => [v.id, loc(v, "label")])];
    const orientations: [string, string][] = Object.keys(board?.orientations ?? {}).map((o) => [o, t(o as "landscape")]);
    const nav = p.navigation ?? {};
    const s = p.settings ?? {};
    return html`
      <h3>${t("project_settings")}</h3>
      ${this.text(t("project_name"), p.name, (v) => set((pp) => { pp.name = v || pp.name; }))}
      ${this.text(t("device_name"), p.device_name, (v) => set((pp) => { pp.device_name = slugify(v); }))}
      ${this.select(t("board"), p.board, Object.values(this.boards).map((b): [string, string] => [b.id, loc(b, "name")]), (v) => set((pp) => { pp.board = v; pp.board_variant = null; }))}
      ${this.select(t("board_variant"), p.board_variant ?? "", variants, (v) => set((pp) => { pp.board_variant = v || null; }))}
      ${this.select(t("orientation"), p.orientation, orientations, (v) => set((pp) => { pp.orientation = v as Project["orientation"]; }))}
      <h3>${t("grid")}</h3>
      <div class="row4">
        ${this.num(t("cols"), p.grid?.cols, (v) => set((pp) => { pp.grid = { ...pp.grid, cols: Math.max(1, Math.min(12, v ?? 4)) }; }), 1, 12)}
        ${this.num(t("rows"), p.grid?.rows, (v) => set((pp) => { pp.grid = { ...pp.grid, rows: Math.max(1, Math.min(12, v ?? 3)) }; }), 1, 12)}
        ${this.num(t("gap"), p.grid?.gap, (v) => set((pp) => { pp.grid = { ...pp.grid, gap: Math.max(0, v ?? 8) }; }), 0, 32)}
        ${this.num(t("padding"), p.grid?.padding, (v) => set((pp) => { pp.grid = { ...pp.grid, padding: Math.max(0, v ?? 8) }; }), 0, 32)}
      </div>
      ${this.select(t("theme"), p.theme, Object.values(this.themes).map((th): [string, string] => [th.id, th.name]), (v) => set((pp) => { pp.theme = v; }))}
      ${this.select(t("style_default"), p.tile_style?.preset ?? "", this.presetOptions(t("style_theme_default")),
        (v) => set((pp) => { pp.tile_style = { ...(pp.tile_style ?? {}), preset: v || undefined }; if (!v) delete pp.tile_style.preset; }))}
      ${this.check(t("icon_circle"), resolveTileStyle(this.themed(), p.tile_style ?? {}).circle,
        (v) => set((pp) => { pp.tile_style = { ...(pp.tile_style ?? {}), circle: v }; }))}
      <label class="field"><span>${t("accent")}</span><input type="color" .value=${p.theme_overrides?.accent ?? this.themes[p.theme]?.colors.accent ?? "#22d3ee"}
        @change=${(e: Event) => set((pp) => { pp.theme_overrides = { ...pp.theme_overrides, accent: (e.target as HTMLInputElement).value }; })} /></label>
      ${this.select(t("language"), s.language ?? "de", [["de", "Deutsch"], ["en", "English"]], (v) => set((pp) => { pp.settings = { ...pp.settings, language: v as "de" | "en" }; }))}
      <h3>${t("background")}</h3>
      ${this.renderBackground(p.background ?? null, (bg) => set((pp) => { pp.background = bg; }), t("bg_project_hint"))}
      <h3>${t("header")}</h3>
      ${this.check(t("header_enabled"), p.global?.header?.enabled ?? true, (v) => set((pp) => {
        pp.global = { ...pp.global, header: { ...(pp.global?.header ?? {}), enabled: v } };
      }))}
      <h3>${t("navigation")}</h3>
      ${this.select(t("nav_style"), nav.style ?? "tabbar", [["tabbar", t("nav_tabbar")], ["none", t("nav_none")]], (v) => set((pp) => { pp.navigation = { ...pp.navigation, style: v }; }))}
      ${nav.style !== "none" ? html`
        ${this.select(t("tabbar_position"), nav.tabbar_position ?? "bottom", [["bottom", t("pos_bottom")], ["top", t("pos_top")], ["left", t("pos_left")]],
          (v) => set((pp) => { pp.navigation = { ...pp.navigation, tabbar_position: v as "bottom" }; }))}
        ${this.check(t("show_icons"), nav.show_icons ?? true, (v) => set((pp) => { pp.navigation = { ...pp.navigation, show_icons: v }; }))}
        ${this.check(t("show_labels"), nav.show_labels ?? true, (v) => set((pp) => { pp.navigation = { ...pp.navigation, show_labels: v }; }))}` : nothing}
      ${this.check(t("swipe"), nav.swipe ?? true, (v) => set((pp) => { pp.navigation = { ...pp.navigation, swipe: v }; }))}
      ${this.check(t("wrap_around"), nav.wrap_around ?? false, (v) => set((pp) => { pp.navigation = { ...pp.navigation, wrap_around: v }; }))}
      ${this.num(t("return_home_after"), s.return_home_after_s ?? 30, (v) => set((pp) => { pp.settings = { ...pp.settings, return_home_after_s: v ?? 0 }; }), 0)}
      <h3>${t("screensaver")}</h3>
      ${this.check(t("screensaver"), s.screensaver?.enabled ?? false, (v) => set((pp) => { pp.settings = { ...pp.settings, screensaver: { ...pp.settings?.screensaver, enabled: v } }; }))}
      ${s.screensaver?.enabled ? this.num(t("screensaver_after"), s.screensaver?.after_s ?? 60, (v) => set((pp) => {
        pp.settings = { ...pp.settings, screensaver: { ...pp.settings?.screensaver, after_s: Math.max(5, v ?? 60) } };
      }), 5) : nothing}
      <div class="row2">
        ${this.num(t("brightness_day"), s.brightness_day ?? 100, (v) => set((pp) => { pp.settings = { ...pp.settings, brightness_day: Math.max(1, Math.min(100, v ?? 100)) }; }), 1, 100)}
        ${this.num(t("brightness_night"), s.brightness_night ?? 25, (v) => set((pp) => { pp.settings = { ...pp.settings, brightness_night: Math.max(0, Math.min(100, v ?? 25)) }; }), 0, 100)}
      </div>
      ${this.check(t("device_actions"), s.device_actions ?? true, (v) => set((pp) => { pp.settings = { ...pp.settings, device_actions: v }; }))}
      ${this.check(t("rgb_led"), s.rgb_led?.enabled ?? false, (v) => set((pp) => { pp.settings = { ...pp.settings, rgb_led: { ...pp.settings?.rgb_led, enabled: v } }; }))}`;
  }
}

customElements.define("cyd-editor", CydEditor);
