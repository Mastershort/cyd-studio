// <cyd-screen>: the display at native resolution, scaled without smoothing.
// Edit mode: selection, drag & drop on the grid, resize, drop from the palette.
// Preview mode: tap and swipe like on the device.
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { cellAt, pageLayout, widgetRect, type Rect } from "../layout";
import type { ResolvedBoard } from "../model";
import type { Project, Theme } from "../types";
import { renderScreen, type HitRegion, type StateResolver } from "./renderer";

export const WIDGET_DND_TYPE = "application/x-cyd-widget";

interface DragState {
  mode: "move" | "resize";
  id: string;
  pointerId: number;
  grab: { x: number; y: number };
  orig: { x: number; y: number; w: number; h: number };
  cur: { x: number; y: number; w: number; h: number };
}

export class CydScreen extends LitElement {
  static properties = {
    project: { attribute: false },
    board: { attribute: false },
    theme: { attribute: false },
    pageId: { attribute: false },
    state: { attribute: false },
    mode: {},
    selected: { attribute: false },
    scale: { type: Number },
    night: { type: Boolean },
    now: { attribute: false },
    overlay: { attribute: false },
    images: { attribute: false },
    _drag: { state: true },
    _dropCell: { state: true },
    _pressed: { state: true },
  };

  declare project: Project;
  declare board: ResolvedBoard;
  declare theme: Theme;
  declare pageId: string;
  declare state: StateResolver;
  declare mode: "edit" | "preview";
  declare selected: string[];
  declare scale: number;
  declare night: boolean;
  declare now: Date;
  declare overlay: { title: string; value: number } | null;
  declare images: Record<string, CanvasImageSource>;
  declare _drag: DragState | null;
  declare _dropCell: { x: number; y: number } | null;
  declare _pressed: string | null;

  private hits: HitRegion[] = [];
  private tapStart: { x: number; y: number; t: number; hit: HitRegion | null } | null = null;

  constructor() {
    super();
    this.mode = "edit";
    this.selected = [];
    this.scale = 2;
    this.night = false;
    this.now = new Date();
    this.overlay = null;
    this.images = {};
    this._drag = null;
    this._dropCell = null;
    this._pressed = null;
  }

  static styles = css`
    :host { display: inline-block; position: relative; }
    .frame { position: relative; line-height: 0; box-shadow: 0 0 0 6px #111, 0 0 0 7px #333, 0 8px 24px rgba(0,0,0,.4); border-radius: 2px; }
    canvas { image-rendering: pixelated; image-rendering: crisp-edges; display: block; touch-action: none; }
    .overlay { position: absolute; inset: 0; }
    .w { position: absolute; box-sizing: border-box; cursor: move; border: 1px dashed rgba(255,255,255,.18); }
    .w:hover { border-color: rgba(34,211,238,.6); }
    .w.sel { border: 2px solid var(--primary-color, #22d3ee); }
    .handle { position: absolute; right: -6px; bottom: -6px; width: 12px; height: 12px; background: var(--primary-color, #22d3ee); border-radius: 2px; cursor: nwse-resize; }
    .ghost { position: absolute; box-sizing: border-box; border: 2px solid var(--primary-color, #22d3ee); background: rgba(34,211,238,.15); pointer-events: none; }
    .cell { position: absolute; box-sizing: border-box; border: 1px dotted rgba(255,255,255,.08); pointer-events: none; }
    .preview canvas { cursor: pointer; }
  `;

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    const canvas = this.renderRoot.querySelector("canvas");
    if (!canvas || !this.project || !this.board || !this.theme) return;
    this.hits = renderScreen(canvas, {
      project: this.project, board: this.board, theme: this.theme, pageId: this.pageId,
      state: this.state, now: this.now, pressed: this._pressed, night: this.night,
      overlay: this.mode === "preview" ? this.overlay : null, images: this.images,
    });
  }

  /** Current canvas as PNG data URL (native resolution). */
  toPng(): string {
    return (this.renderRoot.querySelector("canvas") as HTMLCanvasElement).toDataURL("image/png");
  }

  private get page() {
    return this.project.pages.find((p) => p.id === this.pageId) ?? this.project.pages[0];
  }

  private toScreen(ev: PointerEvent | DragEvent): { x: number; y: number } {
    const canvas = this.renderRoot.querySelector("canvas")!;
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / this.scale, y: (ev.clientY - r.top) / this.scale };
  }

  render() {
    if (!this.project || !this.board) return nothing;
    const { width, height } = this.board;
    const s = this.scale;
    const page = this.page;
    const layout = page ? pageLayout(this.project, page, width, height) : null;
    const px = (r: Rect) => `left:${r.x * s}px;top:${r.y * s}px;width:${r.w * s}px;height:${r.h * s}px`;
    const edit = this.mode === "edit";
    return html`
      <div class="frame ${edit ? "edit" : "preview"}" style="width:${width * s}px;height:${height * s}px">
        <canvas style="width:${width * s}px;height:${height * s}px"
          @pointerdown=${this.onCanvasDown} @pointerup=${this.onCanvasUp} @pointercancel=${() => (this._pressed = null)}></canvas>
        ${edit && layout && page ? html`
          <div class="overlay" @pointerdown=${this.onBackgroundDown}
            @dragover=${this.onDragOver} @dragleave=${() => (this._dropCell = null)} @drop=${this.onDrop}>
            ${page.layout !== "free" ? this.renderCells(layout, px) : nothing}
            ${page.widgets.map((w) => {
              const r = this._drag?.id === w.id ? widgetRect(layout.content, layout.grid, this._drag.cur) : layout.widgets[w.id];
              const sel = this.selected.includes(w.id);
              return html`<div class="w ${sel ? "sel" : ""}" style=${px(r)} title=${w.type}
                  @pointerdown=${(e: PointerEvent) => this.onWidgetDown(e, w.id, "move")}
                  @pointermove=${this.onPointerMove} @pointerup=${this.onPointerUp}>
                  ${sel && this.selected.length === 1 ? html`<div class="handle"
                    @pointerdown=${(e: PointerEvent) => this.onWidgetDown(e, w.id, "resize")}></div>` : nothing}
                </div>`;
            })}
            ${this._dropCell ? html`<div class="ghost" style=${px(widgetRect(layout.content, layout.grid, { ...this._dropCell, w: 1, h: 1 }))}></div>` : nothing}
          </div>` : nothing}
      </div>`;
  }

  private renderCells(layout: ReturnType<typeof pageLayout>, px: (r: Rect) => string) {
    const cells = [];
    for (let y = 0; y < layout.grid.rows; y++) {
      for (let x = 0; x < layout.grid.cols; x++) {
        cells.push(html`<div class="cell" style=${px(widgetRect(layout.content, layout.grid, { x, y, w: 1, h: 1 }))}></div>`);
      }
    }
    return cells;
  }

  // -- edit mode ------------------------------------------------------------
  private onBackgroundDown(ev: PointerEvent) {
    if (ev.target === ev.currentTarget || (ev.target as HTMLElement).classList.contains("cell")) {
      this.emit("select", { ids: [] });
    }
  }

  private onWidgetDown(ev: PointerEvent, id: string, mode: "move" | "resize") {
    ev.stopPropagation();
    ev.preventDefault();
    const page = this.page;
    const w = page.widgets.find((x) => x.id === id);
    if (!w) return;
    if (mode === "move") {
      const additive = ev.ctrlKey || ev.metaKey || ev.shiftKey;
      if (additive) {
        const ids = this.selected.includes(id) ? this.selected.filter((x) => x !== id) : [...this.selected, id];
        this.emit("select", { ids });
        return;
      }
      if (!this.selected.includes(id)) this.emit("select", { ids: [id] });
    }
    if (page.layout === "free") return;
    const layout = pageLayout(this.project, page, this.board.width, this.board.height);
    const pt = this.toScreen(ev);
    const grab = cellAt(layout.content, layout.grid, pt.x, pt.y);
    const target = (mode === "resize" ? (ev.currentTarget as HTMLElement).parentElement! : ev.currentTarget) as HTMLElement;
    target.setPointerCapture(ev.pointerId);
    const orig = { x: w.x, y: w.y, w: w.w, h: w.h };
    this._drag = { mode, id, pointerId: ev.pointerId, grab, orig, cur: { ...orig } };
  }

  private onPointerMove(ev: PointerEvent) {
    const d = this._drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    const page = this.page;
    const layout = pageLayout(this.project, page, this.board.width, this.board.height);
    const pt = this.toScreen(ev);
    const cell = cellAt(layout.content, layout.grid, pt.x, pt.y);
    const { cols, rows } = layout.grid;
    let cur;
    if (d.mode === "move") {
      const x = Math.max(0, Math.min(cols - d.orig.w, d.orig.x + cell.x - d.grab.x));
      const y = Math.max(0, Math.min(rows - d.orig.h, d.orig.y + cell.y - d.grab.y));
      cur = { ...d.orig, x, y };
    } else {
      const w = Math.max(1, Math.min(cols - d.orig.x, cell.x - d.orig.x + 1));
      const h = Math.max(1, Math.min(rows - d.orig.y, cell.y - d.orig.y + 1));
      cur = { ...d.orig, w, h };
    }
    if (cur.x !== d.cur.x || cur.y !== d.cur.y || cur.w !== d.cur.w || cur.h !== d.cur.h) {
      this._drag = { ...d, cur };
    }
  }

  private onPointerUp(ev: PointerEvent) {
    const d = this._drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    this._drag = null;
    const c = d.cur;
    if (c.x !== d.orig.x || c.y !== d.orig.y || c.w !== d.orig.w || c.h !== d.orig.h) {
      this.emit("widget-change", { id: d.id, changes: c });
    }
  }

  private onDragOver(ev: DragEvent) {
    if (!ev.dataTransfer?.types.includes(WIDGET_DND_TYPE)) return;
    ev.preventDefault();
    const layout = pageLayout(this.project, this.page, this.board.width, this.board.height);
    const pt = this.toScreen(ev);
    this._dropCell = cellAt(layout.content, layout.grid, pt.x, pt.y);
  }

  private onDrop(ev: DragEvent) {
    const type = ev.dataTransfer?.getData(WIDGET_DND_TYPE);
    const cell = this._dropCell;
    this._dropCell = null;
    if (!type || !cell) return;
    ev.preventDefault();
    this.emit("widget-add", { type, x: cell.x, y: cell.y });
  }

  // -- preview mode ---------------------------------------------------------
  private hitAt(x: number, y: number): HitRegion | null {
    // overlay first (most specific part), then top layer (tabs, back), then page widgets
    const rank = (h: HitRegion) => ({ "overlay-slider": 0, "overlay-close": h.id === "close" ? 1 : 3, "overlay-panel": 2 } as Record<string, number>)[h.kind]
      ?? (h.kind === "widget" ? 5 : 4);
    const order = [...this.hits].sort((a, b) => rank(a) - rank(b));
    return order.find((h) => x >= h.rect.x && x < h.rect.x + h.rect.w && y >= h.rect.y && y < h.rect.y + h.rect.h) ?? null;
  }

  private onCanvasDown(ev: PointerEvent) {
    if (this.mode !== "preview") return;
    const pt = this.toScreen(ev);
    const hit = this.hitAt(pt.x, pt.y);
    this.tapStart = { ...pt, t: Date.now(), hit };
    if (hit?.kind === "widget") this._pressed = hit.id;
  }

  private onCanvasUp(ev: PointerEvent) {
    if (this.mode !== "preview" || !this.tapStart) return;
    const pt = this.toScreen(ev);
    const start = this.tapStart;
    this.tapStart = null;
    this._pressed = null;
    const dx = pt.x - start.x;
    const dy = pt.y - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      this.emit("preview-swipe", { direction: dx < 0 ? "left" : "right" });
      return;
    }
    const hit = this.hitAt(pt.x, pt.y);
    if (hit && start.hit && hit.id === start.hit.id && hit.kind === start.hit.kind) {
      this.emit("preview-tap", { hit, long: Date.now() - start.t > 500, point: pt });
    }
  }

  private emit(name: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

customElements.define("cyd-screen", CydScreen);
