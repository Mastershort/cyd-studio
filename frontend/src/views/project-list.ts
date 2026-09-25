// <cyd-project-list>: overview with mini preview, status, duplicate/delete, file export/import.
import { LitElement, css, html, nothing } from "lit";
import type { Api } from "../api";
import { loc, t } from "../i18n";
import { normalize, resolveBoard } from "../model";
import { renderScreen, sampleState } from "../preview/renderer";
import { loadProjectImages, usedAssets } from "../images";
import "./device-status";
import type { Board, DeviceStatus, Project, ProjectSummary, Theme } from "../types";

export class CydProjectList extends LitElement {
  static properties = {
    api: { attribute: false },
    boards: { attribute: false },
    themes: { attribute: false },
    _projects: { state: true },
    _thumbs: { state: true },
    _devices: { state: true },
    _design: { state: true },
    _undo: { state: true },
  };

  declare api: Api;
  declare boards: Record<string, Board>;
  declare themes: Record<string, Theme>;
  declare _projects: ProjectSummary[] | null;
  declare _thumbs: Record<string, string>;
  declare _devices: Record<string, DeviceStatus>;
  /** "Design übernehmen" dialog: target project and chosen source (project id or a loaded file) */
  declare _design: { target: ProjectSummary; source: string; file: ProjectFile | null; busy: boolean } | null;
  /** last design change, can be undone from the history */
  declare _undo: { id: string; name: string } | null;

  constructor() {
    super();
    this._projects = null;
    this._thumbs = {};
    this._devices = {};
    this._design = null;
    this._undo = null;
  }

  static styles = css`
    :host { display: block; padding: 24px; max-width: 1200px; margin: 0 auto; color: var(--primary-text-color); }
    .head { display: flex; gap: 8px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .head h1 { flex: 1; margin: 0; font-size: 24px; font-weight: 500; }
    button { font: inherit; padding: 7px 12px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .thumb { background: #000; display: flex; justify-content: center; align-items: center; height: 180px; cursor: pointer; }
    .thumb img { image-rendering: pixelated; max-width: 100%; max-height: 180px; }
    .info { padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .name { font-size: 16px; font-weight: 500; }
    .meta { font-size: 12px; color: var(--secondary-text-color); }
    .badge { align-self: flex-start; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-top: 4px;
      background: rgba(127,127,127,.15); color: var(--secondary-text-color); }
    .badge.changed { background: color-mix(in srgb, var(--warning-color, #f59e0b) 18%, transparent); color: var(--warning-color, #f59e0b); }
    .badge.ok { background: color-mix(in srgb, var(--success-color, #22c55e) 18%, transparent); color: var(--success-color, #22c55e); }
    .actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; padding: 0 12px 12px; margin-top: auto; }
    .actions .open { grid-column: 1 / -1; }
    button.quiet { border-color: transparent; background: transparent; font-size: 12px; padding: 6px 4px; white-space: nowrap; color: var(--secondary-text-color); }
    button.quiet:hover { color: var(--primary-text-color); background: rgba(127,127,127,.12); }
    button.quiet.danger:hover { color: var(--error-color, #ef4444); }
    .card { transition: border-color .15s, transform .15s; }
    .card:hover { border-color: var(--primary-color); }
    .info { flex: 1; }
    .notice { display: flex; gap: 12px; align-items: center; padding: 10px 14px; margin-bottom: 16px; border-radius: 10px;
      background: color-mix(in srgb, var(--success-color, #22c55e) 14%, transparent); }
    .notice span { flex: 1; }
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 10; padding: 16px; }
    .dialog { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 12px; padding: 20px;
      width: min(480px, 100%); display: flex; flex-direction: column; gap: 12px; }
    .dialog h2 { margin: 0; font-size: 18px; font-weight: 500; }
    .dialog p { margin: 0; font-size: 13px; color: var(--secondary-text-color); line-height: 1.45; }
    .dialog select { font: inherit; padding: 7px 8px; border-radius: 6px; border: 1px solid var(--divider-color);
      background: var(--card-background-color); color: var(--primary-text-color); }
    .dialog .warn { color: var(--warning-color, #f59e0b); }
    .dialog .buttons { display: flex; gap: 8px; justify-content: flex-end; }
    .empty { padding: 48px; text-align: center; color: var(--secondary-text-color); border: 2px dashed var(--divider-color); border-radius: 12px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    void this.refresh();
  }

  async refresh() {
    this._projects = await this.api.projects();
    this._devices = await this.api.devices().catch(() => ({}));
    for (const s of this._projects) void this.thumb(s.id);
  }

  private async thumb(id: string) {
    const project = normalize(await this.api.project(id));
    const board = this.boards[project.board];
    const theme = this.themes[project.theme];
    if (!board || !theme) return;
    const canvas = document.createElement("canvas");
    renderScreen(canvas, {
      project, board: resolveBoard(board, project.board_variant, project.orientation),
      theme: { ...theme, colors: { ...theme.colors, ...(project.theme_overrides ?? {}) } },
      pageId: project.navigation?.home_page ?? project.pages[0]?.id ?? "", state: sampleState(project), now: new Date(),
      images: await loadProjectImages(this.api, project),
    });
    this._thumbs = { ...this._thumbs, [id]: canvas.toDataURL() };
  }

  private open(id: string) {
    this.dispatchEvent(new CustomEvent("open-project", { detail: { id }, bubbles: true, composed: true }));
  }

  private async duplicate(id: string) {
    await this.api.duplicate(id);
    await this.refresh();
  }

  private async removeProject(s: ProjectSummary) {
    if (!confirm(t("delete_confirm", { name: s.name }))) return;
    await this.api.remove(s.id);
    await this.refresh();
  }

  private async exportFile(id: string) {
    const project = await this.api.project(id);
    // images travel inside the file (id -> PNG data URL), the API key never does
    const images: Record<string, string> = {};
    for (const assetId of usedAssets(project)) {
      try {
        images[assetId] = (await this.api.getAsset(id, assetId)).data_url;
      } catch {
        /* missing image: exported without it */
      }
    }
    const clean: ProjectFile = { ...project, settings: { ...project.settings, api_key: null }, _assets: images };
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.device_name}.cydstudio.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** Let the user pick a file; resolves with its name and text (null when cancelled). */
  private pickFile(accept: string): Promise<{ name: string; text: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = async () => {
        const file = input.files?.[0];
        resolve(file ? { name: file.name, text: await file.text() } : null);
      };
      input.click();
    });
  }

  private async importFile() {
    const file = await this.pickFile(".json,.yaml,.yml");
    if (!file) return;
    try {
      let project: Project;
      if (file.name.endsWith(".json")) {
        const { _assets, ...data } = JSON.parse(file.text) as ProjectFile;
        project = await this.api.importProject(data as Project, _assets);
      } else project = await this.api.importYaml(file.text);
      this.open(project.id);
    } catch (err) {
      alert(String((err as { message?: string }).message ?? err));
    }
  }

  private async loadDesignFile() {
    const file = await this.pickFile(".json");
    const d = this._design;
    if (!d) return;
    if (!file) {
      this._design = { ...d };  // re-render: the select falls back to the previous choice
      return;
    }
    try {
      const data = JSON.parse(file.text) as ProjectFile;
      if (!Array.isArray(data.pages)) throw new Error(t("design_file_invalid"));
      this._design = { ...d, source: "file", file: data };
    } catch (err) {
      this._design = { ...d };
      alert(String((err as { message?: string }).message ?? err));
    }
  }

  private async applyDesign() {
    const d = this._design;
    if (!d || !d.source || (d.source === "file" && !d.file)) return;
    this._design = { ...d, busy: true };
    try {
      if (d.source === "file") {
        const { _assets, ...project } = d.file!;
        await this.api.applyDesign(d.target.id, { project: project as Project, assets: _assets });
      } else {
        await this.api.applyDesign(d.target.id, { source_project_id: d.source });
      }
      this._undo = { id: d.target.id, name: d.target.name };
      this._design = null;
      await this.refresh();
    } catch (err) {
      this._design = { ...d, busy: false };
      alert(String((err as { message?: string }).message ?? err));
    }
  }

  private async undoDesign() {
    const u = this._undo;
    if (!u) return;
    const [latest] = await this.api.history(u.id);
    if (latest) await this.api.restore(u.id, latest.index);
    this._undo = null;
    await this.refresh();
  }

  /** Source differs in board or orientation from the target: the grid may not fit the same way. */
  private designMismatch(): boolean {
    const d = this._design;
    if (!d) return false;
    const src = d.source === "file" ? d.file : this._projects?.find((p) => p.id === d.source);
    if (!src) return false;
    const portrait = (o: string | undefined) => (o ?? "landscape").startsWith("portrait");  // flipped = same size
    return src.board !== d.target.board || portrait(src.orientation) !== portrait(d.target.orientation);
  }

  private renderDesignDialog() {
    const d = this._design!;
    const others = (this._projects ?? []).filter((p) => p.id !== d.target.id);
    return html`<div class="backdrop" @click=${(e: Event) => { if (e.target === e.currentTarget && !d.busy) this._design = null; }}>
      <div class="dialog">
        <h2>${t("design_apply_title", { name: d.target.name })}</h2>
        <p>${t("design_apply_text")}</p>
        <select @change=${(e: Event) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v === "file") void this.loadDesignFile();
          else this._design = { ...d, source: v, file: null };
        }}>
          <option value="" ?selected=${!d.source}>${t("design_choose_source")}</option>
          ${others.map((p) => html`<option value=${p.id} ?selected=${d.source === p.id}>${p.name} (${p.device_name})</option>`)}
          <option value="file" ?selected=${d.source === "file"}>${d.file ? `${t("design_from_file")}: ${d.file.name}` : `${t("design_from_file")}…`}</option>
        </select>
        ${this.designMismatch() ? html`<p class="warn">${t("design_mismatch")}</p>` : nothing}
        <div class="buttons">
          <button ?disabled=${d.busy} @click=${() => { this._design = null; }}>${t("cancel")}</button>
          <button class="primary" ?disabled=${d.busy || !d.source || (d.source === "file" && !d.file)} @click=${() => this.applyDesign()}>${t("design_apply")}</button>
        </div>
      </div>
    </div>`;
  }

  render() {
    const list = this._projects;
    return html`
      <div class="head">
        <h1>${t("app_title")}</h1>
        <button @click=${() => this.importFile()}>⤒ ${t("import_file")}</button>
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: true, composed: true }))}>+ ${t("new_project")}</button>
      </div>
      ${this._undo ? html`<div class="notice"><span>${t("design_applied", { name: this._undo.name })}</span>
        <button @click=${() => this.undoDesign()}>${t("undo")}</button>
        <button class="quiet" @click=${() => { this._undo = null; }}>✕</button></div>` : nothing}
      ${this._design ? this.renderDesignDialog() : nothing}
      ${list === null ? html`…` : !list.length ? html`<div class="empty">${t("no_projects")}<br /><br />
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: true, composed: true }))}>+ ${t("new_project")}</button></div>`
        : html`<div class="grid">${list.map((s) => html`<div class="card">
          <div class="thumb" @click=${() => this.open(s.id)}>${this._thumbs[s.id] ? html`<img src=${this._thumbs[s.id]} alt="" />` : nothing}</div>
          <div class="info">
            <span class="name">${s.name}</span>
            <span class="meta">${this.boards[s.board] ? loc(this.boards[s.board], "name") : s.board} · ${s.device_name}</span>
            <span class="meta">${t("pages_count", { n: s.page_count })} · ${t("widgets_count", { n: s.widget_count })}${s.updated ? ` · ${new Date(s.updated).toLocaleString()}` : ""}</span>
            <cyd-device-status compact .api=${this.api} .projectId=${s.id} .deviceName=${s.device_name}
              .status=${this._devices[s.id] ?? null}></cyd-device-status>
            <span class="badge ${!s.exported ? "new" : s.changed_since_export ? "changed" : "ok"}">${!s.exported ? t("never_exported") : s.changed_since_export ? t("changed_since_export") : `✓ ${t("exported")}`}</span>
          </div>
          <div class="actions">
            <button class="primary open" @click=${() => this.open(s.id)}>${t("open")}</button>
            <button class="quiet" title=${t("duplicate")} @click=${() => this.duplicate(s.id)}>${t("duplicate")}</button>
            <button class="quiet" title=${t("export_file")} @click=${() => this.exportFile(s.id)}>${t("export_file")}</button>
            <button class="quiet" title=${t("design_apply_hint")} @click=${() => { this._design = { target: s, source: "", file: null, busy: false }; }}>${t("design_apply_button")}</button>
            <button class="quiet danger" title=${t("delete")} @click=${() => this.removeProject(s)}>${t("delete")}</button>
          </div>
        </div>`)}</div>`}`;
  }
}

/** Project file as exported: the project plus its images (asset id -> PNG data URL). */
type ProjectFile = Project & { _assets?: Record<string, string> };

customElements.define("cyd-project-list", CydProjectList);
