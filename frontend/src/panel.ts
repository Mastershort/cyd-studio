// <cyd-studio-panel>: entry point registered by the integration (panel_custom).
import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { Api } from "./api";
import { setLanguage } from "./i18n";
import { loadFonts } from "./preview/fonts";
import { loadIcons } from "./preview/icons";
import "./views/project-list";
import "./views/wizard";
import "./editor/editor";
import type { Board, Hass, StudioInfo, Template, Theme, WidgetDef } from "./types";

type View = { name: "list" } | { name: "wizard" } | { name: "editor"; id: string };

class CydStudioPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
    panel: { attribute: false },
    _ready: { state: true },
    _error: { state: true },
    _view: { state: true },
  };

  declare hass: Hass;
  declare narrow: boolean;
  declare _ready: boolean;
  declare _error: string | null;
  declare _view: View;

  private api?: Api;
  private info?: StudioInfo;
  private boards: Record<string, Board> = {};
  private widgetDefs: Record<string, WidgetDef> = {};
  private themes: Record<string, Theme> = {};
  private templates: Template[] = [];

  constructor() {
    super();
    this._ready = false;
    this._error = null;
    this._view = { name: "list" };
  }

  static styles = css`
    :host { display: block; height: 100%; background: var(--primary-background-color); font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
    .error { padding: 24px; color: var(--error-color); }
    .loading { padding: 24px; color: var(--secondary-text-color); }
    cyd-editor { height: 100vh; }
  `;

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass) {
      setLanguage(this.hass.language ?? "en");
      if (!this.api) {
        this.api = new Api(this.hass);
        void this.init();
      } else {
        this.api.setHass(this.hass);
      }
    }
  }

  private async init() {
    try {
      const api = this.api!;
      const [info, boards, widgets, themes, templates] = await Promise.all([
        api.info(), api.boards(), api.widgets(), api.themes(), api.templates(),
      ]);
      this.info = info;
      this.boards = Object.fromEntries(boards.map((b) => [b.id, b]));
      this.widgetDefs = Object.fromEntries(widgets.map((w) => [w.type, w]));
      this.themes = Object.fromEntries(themes.map((th) => [th.id, th]));
      this.templates = templates;
      await Promise.all([loadFonts(), loadIcons(info.icons_url)]);
      const hash = location.hash.match(/^#project=(\w+)/);
      if (hash) this._view = { name: "editor", id: hash[1] };
      this._ready = true;
    } catch (err) {
      this._error = String((err as { message?: string }).message ?? err);
    }
  }

  private go(view: View) {
    this._view = view;
    history.replaceState(null, "", view.name === "editor" ? `#project=${view.id}` : location.pathname);
  }

  render() {
    if (this._error) return html`<div class="error">CYD Studio: ${this._error}</div>`;
    if (!this._ready) return html`<div class="loading">CYD Studio …</div>`;
    const v = this._view;
    if (v.name === "wizard") {
      return html`<cyd-wizard .hass=${this.hass} .api=${this.api} .info=${this.info} .boards=${this.boards} .templates=${this.templates}
        @cancel=${() => this.go({ name: "list" })}
        @open-project=${(e: CustomEvent<{ id: string }>) => this.go({ name: "editor", id: e.detail.id })}></cyd-wizard>`;
    }
    if (v.name === "editor") {
      return html`<cyd-editor .hass=${this.hass} .api=${this.api} .info=${this.info} .boards=${this.boards}
        .widgetDefs=${this.widgetDefs} .themes=${this.themes} .projectId=${v.id} .narrow=${this.narrow}
        @close-editor=${() => this.go({ name: "list" })}></cyd-editor>`;
    }
    return html`${nothing}<cyd-project-list .api=${this.api} .info=${this.info} .boards=${this.boards} .themes=${this.themes}
      @new-project=${() => this.go({ name: "wizard" })}
      @open-project=${(e: CustomEvent<{ id: string }>) => this.go({ name: "editor", id: e.detail.id })}></cyd-project-list>`;
  }
}

customElements.define("cyd-studio-panel", CydStudioPanel);
