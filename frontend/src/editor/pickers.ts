// Own pickers (reliable inside a custom panel; HA's ha-entity-picker is lazy-loaded
// by the HA frontend and not guaranteed to be available – see docs/ASSUMPTIONS.md).
import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { t } from "../i18n";
import { iconChar, searchIcons } from "../preview/icons";
import { ICON_FAMILY } from "../preview/fonts";
import type { Hass } from "../types";

const pickerStyles = css`
  :host { display: block; position: relative; }
  input { width: 100%; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color, #444);
    background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color, #eee); font: inherit; }
  .list { position: absolute; z-index: 20; left: 0; right: 0; max-height: 320px; overflow: auto; margin-top: 2px;
    background: var(--card-background-color, #1c1c1c); border: 1px solid var(--divider-color, #444); border-radius: 6px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  .item { padding: 6px 8px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
  .item:hover, .item.active { background: rgba(127,127,127,.18); }
  .main { flex: 1; min-width: 0; }
  .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color, #999); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .state { font-size: 12px; color: var(--secondary-text-color, #999); }
  .glyph { font-family: "${unsafeCSS(ICON_FAMILY)}"; font-size: 22px; width: 26px; text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 2px; padding: 4px; }
  .grid .item { justify-content: center; padding: 6px 0; }
  .row { display: flex; gap: 6px; align-items: center; }
  .preview { font-family: "${unsafeCSS(ICON_FAMILY)}"; font-size: 24px; width: 32px; text-align: center; }
`;

export class CydEntityPicker extends LitElement {
  static properties = {
    hass: { attribute: false },
    value: {},
    domains: { attribute: false },
    _open: { state: true },
    _query: { state: true },
  };

  declare hass: Hass;
  declare value: string | null;
  declare domains: string[];
  declare _open: boolean;
  declare _query: string;

  static styles = pickerStyles;

  constructor() {
    super();
    this.value = null;
    this.domains = [];
    this._open = false;
    this._query = "";
  }

  private areaName(entityId: string): string {
    const reg = this.hass.entities?.[entityId];
    const areaId = reg?.area_id ?? (reg?.device_id ? this.hass.devices?.[reg.device_id]?.area_id : null);
    return areaId ? this.hass.areas?.[areaId]?.name ?? "" : "";
  }

  private candidates() {
    const q = this._query.toLowerCase();
    return Object.values(this.hass?.states ?? {})
      .filter((s) => !this.domains.length || this.domains.includes(s.entity_id.split(".")[0]))
      .map((s) => ({
        id: s.entity_id,
        name: String(s.attributes.friendly_name ?? s.entity_id),
        area: this.areaName(s.entity_id),
        state: `${s.state}${s.attributes.unit_of_measurement ? " " + String(s.attributes.unit_of_measurement) : ""}`,
      }))
      .filter((c) => !q || c.id.includes(q) || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 100);
  }

  render() {
    const current = this.value ? this.hass?.states[this.value] : undefined;
    const label = current ? String(current.attributes.friendly_name ?? this.value) : this.value ?? "";
    return html`
      <input .value=${this._open ? this._query : label} placeholder=${t("pick_entity")}
        @focus=${() => { this._open = true; this._query = ""; }}
        @input=${(e: InputEvent) => (this._query = (e.target as HTMLInputElement).value)}
        @blur=${() => setTimeout(() => (this._open = false), 150)} />
      ${this.value && !this._open ? html`<div class="sub">${this.value}${current ? html` · ${current.state}` : html` · ⚠`}</div>` : nothing}
      ${this._open ? html`<div class="list">
        ${this.candidates().map((c) => html`<div class="item" @mousedown=${() => this.pick(c.id)}>
          <div class="main"><div class="name">${c.name}</div><div class="sub">${c.id}${c.area ? ` · ${c.area}` : ""}</div></div>
          <div class="state">${c.state}</div></div>`)}
      </div>` : nothing}`;
  }

  private pick(id: string) {
    this.value = id;
    this._open = false;
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: id }, bubbles: true, composed: true }));
  }
}

export class CydIconPicker extends LitElement {
  static properties = {
    value: {},
    _open: { state: true },
    _query: { state: true },
  };

  declare value: string;
  declare _open: boolean;
  declare _query: string;

  static styles = pickerStyles;

  constructor() {
    super();
    this.value = "";
    this._open = false;
    this._query = "";
  }

  render() {
    return html`
      <div class="row">
        <span class="preview">${iconChar(this.value) ?? ""}</span>
        <input .value=${this._open ? this._query : this.value} placeholder="mdi:lightbulb"
          @focus=${() => { this._open = true; this._query = this.value?.replace(/^mdi:/, "") ?? ""; }}
          @input=${(e: InputEvent) => (this._query = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter") this.pick(this._query.startsWith("mdi:") ? this._query : `mdi:${this._query}`); }}
          @blur=${() => setTimeout(() => (this._open = false), 150)} />
      </div>
      ${this._open ? html`<div class="list"><div class="grid">
        ${searchIcons(this._query, 120).map((name) => html`<div class="item" title=${name} @mousedown=${() => this.pick(name)}>
          <span class="glyph">${iconChar(name)}</span></div>`)}
      </div></div>` : nothing}`;
  }

  private pick(name: string) {
    this.value = name;
    this._open = false;
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value: name }, bubbles: true, composed: true }));
  }
}

customElements.define("cyd-entity-picker", CydEntityPicker);
customElements.define("cyd-icon-picker", CydIconPicker);
