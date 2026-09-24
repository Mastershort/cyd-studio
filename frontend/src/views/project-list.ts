// <cyd-project-list>: overview with mini preview, status, duplicate/delete, file export/import.
import { LitElement, css, html, nothing } from "lit";
import type { Api } from "../api";
import { loc, t } from "../i18n";
import { normalize, resolveBoard } from "../model";
import { renderScreen, sampleState } from "../preview/renderer";
import type { Board, Project, ProjectSummary, Theme } from "../types";

export class CydProjectList extends LitElement {
  static properties = {
    api: { attribute: false },
    boards: { attribute: false },
    themes: { attribute: false },
    _projects: { state: true },
    _thumbs: { state: true },
  };

  declare api: Api;
  declare boards: Record<string, Board>;
  declare themes: Record<string, Theme>;
  declare _projects: ProjectSummary[] | null;
  declare _thumbs: Record<string, string>;

  constructor() {
    super();
    this._projects = null;
    this._thumbs = {};
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
    .status { font-size: 12px; }
    .status.changed { color: var(--warning-color, #f59e0b); }
    .actions { display: flex; gap: 6px; padding: 0 12px 12px; flex-wrap: wrap; }
    .empty { padding: 48px; text-align: center; color: var(--secondary-text-color); border: 2px dashed var(--divider-color); border-radius: 12px; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    void this.refresh();
  }

  async refresh() {
    this._projects = await this.api.projects();
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
    const clean: Project = { ...project, settings: { ...project.settings, api_key: null } };
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.device_name}.cydstudio.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private importFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.yaml,.yml";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const project = file.name.endsWith(".json") ? await this.api.importProject(JSON.parse(text) as Project) : await this.api.importYaml(text);
        this.open(project.id);
      } catch (err) {
        alert(String((err as { message?: string }).message ?? err));
      }
    };
    input.click();
  }

  render() {
    const list = this._projects;
    return html`
      <div class="head">
        <h1>${t("app_title")}</h1>
        <button @click=${() => this.importFile()}>⤒ ${t("import_file")}</button>
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: true, composed: true }))}>+ ${t("new_project")}</button>
      </div>
      ${list === null ? html`…` : !list.length ? html`<div class="empty">${t("no_projects")}<br /><br />
        <button class="primary" @click=${() => this.dispatchEvent(new CustomEvent("new-project", { bubbles: true, composed: true }))}>+ ${t("new_project")}</button></div>`
        : html`<div class="grid">${list.map((s) => html`<div class="card">
          <div class="thumb" @click=${() => this.open(s.id)}>${this._thumbs[s.id] ? html`<img src=${this._thumbs[s.id]} alt="" />` : nothing}</div>
          <div class="info">
            <span class="name">${s.name}</span>
            <span class="meta">${this.boards[s.board] ? loc(this.boards[s.board], "name") : s.board} · ${s.device_name}</span>
            <span class="meta">${t("pages_count", { n: s.page_count })} · ${t("widgets_count", { n: s.widget_count })}${s.updated ? ` · ${new Date(s.updated).toLocaleString()}` : ""}</span>
            <span class="status ${s.changed_since_export ? "changed" : ""}">${!s.exported ? t("never_exported") : s.changed_since_export ? t("changed_since_export") : `✓ ${t("exported")}`}</span>
          </div>
          <div class="actions">
            <button class="primary" @click=${() => this.open(s.id)}>${t("open")}</button>
            <button @click=${() => this.duplicate(s.id)}>${t("duplicate")}</button>
            <button @click=${() => this.exportFile(s.id)}>${t("export_file")}</button>
            <button @click=${() => this.removeProject(s)}>${t("delete")}</button>
          </div>
        </div>`)}</div>`}`;
  }
}

customElements.define("cyd-project-list", CydProjectList);
