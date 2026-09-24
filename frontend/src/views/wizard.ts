// <cyd-wizard>: new project – board → orientation → template (+ entity mapping) → name.
import { LitElement, css, html, nothing } from "lit";
import type { Api } from "../api";
import { lang, loc, t, type I18nKey } from "../i18n";
import { applyTemplate, normalize, slugify } from "../model";
import "../editor/pickers";
import type { Board, Hass, Project, StudioInfo, Template } from "../types";

export class CydWizard extends LitElement {
  static properties = {
    hass: { attribute: false },
    api: { attribute: false },
    info: { attribute: false },
    boards: { attribute: false },
    templates: { attribute: false },
    _step: { state: true },
    _board: { state: true },
    _variant: { state: true },
    _orientation: { state: true },
    _template: { state: true },
    _mapping: { state: true },
    _name: { state: true },
    _device: { state: true },
    _busy: { state: true },
  };

  declare hass: Hass;
  declare api: Api;
  declare info: StudioInfo;
  declare boards: Record<string, Board>;
  declare templates: Template[];
  declare _step: number;
  declare _board: string;
  declare _variant: string;
  declare _orientation: string;
  declare _template: string;
  declare _mapping: Record<string, string>;
  declare _name: string;
  declare _device: string;
  declare _busy: boolean;

  constructor() {
    super();
    this._step = 0;
    this._board = "";
    this._variant = "";
    this._orientation = "landscape";
    this._template = "room_panel";
    this._mapping = {};
    this._name = "";
    this._device = "";
    this._busy = false;
  }

  static styles = css`
    :host { display: block; padding: 24px; max-width: 820px; margin: 0 auto; color: var(--primary-text-color); }
    h1 { font-size: 22px; font-weight: 500; }
    .steps { display: flex; gap: 8px; margin-bottom: 20px; font-size: 13px; color: var(--secondary-text-color); }
    .steps .active { color: var(--primary-color); font-weight: 600; }
    .options { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .opt { border: 2px solid var(--divider-color); border-radius: 10px; padding: 12px; cursor: pointer; background: var(--card-background-color); }
    .opt.sel { border-color: var(--primary-color); }
    .opt .t { font-weight: 500; }
    .opt .d { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; }
    .field { display: flex; flex-direction: column; gap: 4px; margin: 12px 0; font-size: 13px; }
    .field > span { color: var(--secondary-text-color); }
    input, select { padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); font: inherit; }
    .nav { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
    button { font: inherit; padding: 8px 14px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    button:disabled { opacity: .4; }
    a { color: var(--primary-color); font-size: 12px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._board ||= Object.keys(this.boards)[0] ?? "";
  }

  private get template(): Template | undefined {
    return this.templates.find((x) => x.id === this._template);
  }

  private async create() {
    this._busy = true;
    try {
      const tpl = this.template?.project ?? { pages: [] };
      const filled = applyTemplate(tpl, this._mapping);
      const project: Project = normalize({
        ...filled,
        name: this._name || "CYD",
        device_name: this._device || slugify(this._name || "cyd"),
        board: this._board,
        board_variant: this._variant || null,
        orientation: this._orientation as Project["orientation"],
        theme: this.info?.default_theme ?? "mastershort_dark",
        settings: { language: lang() },
      });
      if (!project.pages.length) project.pages = [{ id: "home", name: lang() === "de" ? "Start" : "Home", icon: "mdi:home", parent: null, in_navigation: true, widgets: [] }];
      project.navigation!.home_page = project.pages[0].id;
      const saved = await this.api.save(project);
      this.dispatchEvent(new CustomEvent("open-project", { detail: { id: saved.id }, bubbles: true, composed: true }));
    } finally {
      this._busy = false;
    }
  }

  render() {
    const steps: I18nKey[] = ["step_board", "step_orientation", "step_template", "step_name"];
    return html`
      <h1>${t("wizard_title")}</h1>
      <div class="steps">${steps.map((s, i) => html`<span class=${i === this._step ? "active" : ""}>${i + 1}. ${t(s)}</span>`)}</div>
      ${[this.stepBoard, this.stepOrientation, this.stepTemplate, this.stepName][this._step].call(this)}
      <div class="nav">
        <button @click=${() => (this._step === 0 ? this.dispatchEvent(new CustomEvent("cancel", { bubbles: true, composed: true })) : this._step--)}>
          ${this._step === 0 ? t("cancel") : t("back")}</button>
        ${this._step < 3 ? html`<button class="primary" ?disabled=${!this._board} @click=${() => this._step++}>${t("next")}</button>`
          : html`<button class="primary" ?disabled=${this._busy || !this._name} @click=${() => this.create()}>${t("create")}</button>`}
      </div>`;
  }

  private stepBoard() {
    const board = this.boards[this._board];
    return html`<div class="options">${Object.values(this.boards).map((b) => html`
      <div class="opt ${b.id === this._board ? "sel" : ""}" @click=${() => { this._board = b.id; this._variant = ""; }}>
        <div class="t">${loc(b, "name")}</div>
        <div class="d">${lang() === "de" ? b.notes_de : b.notes_en}</div>
        ${this.info?.hardware_hints ? html`<div class="d"><a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${t("where_to_buy")}</a>
          · <a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${t("matching_case")}</a></div>` : nothing}
      </div>`)}</div>
      ${board?.display.variants?.length ? html`<label class="field"><span>${t("board_variant")}</span>
        <select @change=${(e: Event) => (this._variant = (e.target as HTMLSelectElement).value)}>
          <option value="">${t("variant_default")} (${board.display.model})</option>
          ${board.display.variants.map((v) => html`<option value=${v.id} ?selected=${v.id === this._variant}>${loc(v, "label")}</option>`)}
        </select></label>` : nothing}`;
  }

  private stepOrientation() {
    const board = this.boards[this._board];
    return html`<div class="options">${Object.entries(board?.orientations ?? {}).map(([key, o]) => html`
      <div class="opt ${key === this._orientation ? "sel" : ""}" @click=${() => (this._orientation = key)}>
        <div class="t">${t(key as I18nKey)}</div>
        ${o.usb ? html`<div class="d">${t("usb_side", { side: t(`usb_${o.usb}` as I18nKey) })}</div>` : nothing}
      </div>`)}</div>`;
  }

  private stepTemplate() {
    const tpl = this.template;
    return html`<div class="options">${this.templates.map((x) => html`
      <div class="opt ${x.id === this._template ? "sel" : ""}" @click=${() => { this._template = x.id; this._mapping = {}; }}>
        <div class="t">${loc(x, "name")}</div><div class="d">${loc(x, "description")}</div>
      </div>`)}</div>
      ${tpl?.placeholders.map((ph) => html`<div class="field"><span>${t("assign_placeholder", { label: loc(ph, "label") })}</span>
        <cyd-entity-picker .hass=${this.hass} .value=${this._mapping[ph.key] ?? null} .domains=${ph.domains}
          @value-changed=${(e: CustomEvent<{ value: string }>) => (this._mapping = { ...this._mapping, [ph.key]: e.detail.value })}></cyd-entity-picker></div>`)}`;
  }

  private stepName() {
    return html`
      <label class="field"><span>${t("project_name")}</span>
        <input .value=${this._name} @input=${(e: InputEvent) => {
          const v = (e.target as HTMLInputElement).value;
          const autoDevice = !this._device || this._device === slugify(this._name);
          this._name = v;
          if (autoDevice) this._device = slugify(v);
        }} /></label>
      <label class="field"><span>${t("device_name")} – ${t("device_name_hint")}</span>
        <input .value=${this._device} @change=${(e: Event) => (this._device = slugify((e.target as HTMLInputElement).value))} /></label>`;
  }
}

customElements.define("cyd-wizard", CydWizard);
