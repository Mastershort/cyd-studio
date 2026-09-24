// <cyd-export-dialog>: shows the generated YAML (copy / download) with install instructions.
import { LitElement, css, html, nothing } from "lit";
import type { Api } from "../api";
import { lang, t } from "../i18n";
import type { EsphomeSaveResult, GenerateResult, Project, StudioInfo } from "../types";
import "../views/device-status";

export function highlightYaml(yaml: string) {
  return yaml.split("\n").map((line) => {
    if (/^\s*#/.test(line)) return html`<span class="c">${line}</span>\n`;
    const m = /^(\s*-?\s*)([A-Za-z0-9_."$\\{}-]+:)(.*)$/.exec(line);
    if (m) {
      const rest = m[3];
      const cls = /^\s*!/.test(rest) ? "t" : /^\s*"/.test(rest) ? "s" : "v";
      return html`${m[1]}<span class="k">${m[2]}</span><span class=${cls}>${rest}</span>\n`;
    }
    return html`${line}\n`;
  });
}

export class CydExportDialog extends LitElement {
  static properties = {
    api: { attribute: false },
    project: { attribute: false },
    info: { attribute: false },
    _result: { state: true },
    _copied: { state: true },
    _error: { state: true },
    _dir: { state: true },
    _save: { state: true },
    _saving: { state: true },
    _secretsDone: { state: true },
  };

  declare api: Api;
  declare project: Project;
  declare info: StudioInfo;
  declare _result: GenerateResult | null;
  declare _copied: boolean;
  declare _error: string | null;
  declare _dir: { directory: string; directory_exists: boolean } | null;
  declare _save: EsphomeSaveResult | null;
  declare _saving: boolean;
  declare _secretsDone: boolean;

  constructor() {
    super();
    this._result = null;
    this._copied = false;
    this._error = null;
    this._dir = null;
    this._save = null;
    this._saving = false;
    this._secretsDone = false;
  }

  static styles = css`
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .dialog { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(1000px, 96vw); max-height: 92vh;
      display: flex; flex-direction: column; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    header { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--divider-color); }
    header h2 { margin: 0; font-size: 18px; font-weight: 500; flex: 1; }
    .body { display: grid; grid-template-columns: 1fr 300px; gap: 0; min-height: 0; flex: 1; }
    pre { margin: 0; padding: 12px 16px; overflow: auto; font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; background: #0d1117; color: #c9d1d9; min-height: 300px; }
    .c { color: #8b949e; } .k { color: #7ee787; } .s { color: #a5d6ff; } .t { color: #ff7b72; } .v { color: #c9d1d9; }
    aside { padding: 14px 16px; overflow: auto; font-size: 13px; border-left: 1px solid var(--divider-color); }
    aside h4 { margin: 12px 0 6px; font-size: 13px; }
    aside h4:first-child { margin-top: 0; }
    aside p { margin: 0 0 8px; color: var(--secondary-text-color); }
    button { font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); cursor: pointer; }
    button.primary { background: var(--primary-color); color: var(--text-primary-color, #000); border-color: var(--primary-color); }
    .error { color: var(--error-color, #ef4444); } .warning { color: var(--warning-color, #f59e0b); }
    ul { padding-left: 18px; margin: 4px 0 8px; }
    .notice { border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; }
    .notice.ok { border: 1px solid var(--success-color, #22c55e); background: rgba(34,197,94,.08); }
    .notice.warning { border: 1px solid var(--warning-color, #f59e0b); background: rgba(245,158,11,.08); }
    .notice p { margin: 0 0 6px; color: var(--primary-text-color); }
    .notice input { width: 100%; box-sizing: border-box; margin-bottom: 6px; padding: 6px; border-radius: 6px;
      border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); }
    pre.diff { max-height: 200px; min-height: 0; font-size: 11px; padding: 6px; }
    .muted { color: var(--secondary-text-color); }
    a.btn { display: inline-block; padding: 6px 12px; border-radius: 6px; background: var(--primary-color);
      color: var(--text-primary-color, #000); text-decoration: none; }
    .blocked { padding: 18px; }
    @media (max-width: 800px) { .body { grid-template-columns: 1fr; } aside { border-left: 0; border-top: 1px solid var(--divider-color); } }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    void this.generate();
  }

  private async generate() {
    this.api.esphomeStatus().then((d) => (this._dir = d)).catch(() => (this._dir = null));
    try {
      this._result = await this.api.generate(this.project, true);
    } catch (err) {
      this._error = String((err as { message?: string }).message ?? err);
    }
  }

  private async copy() {
    if (!this._result) return;
    await navigator.clipboard.writeText(this._result.yaml);
    this._copied = true;
    setTimeout(() => (this._copied = false), 2000);
  }

  private download() {
    if (!this._result) return;
    const blob = new Blob([this._result.yaml], { type: "text/yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${this.project.device_name}.yaml`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private async saveToEsphome(overwrite = false) {
    this._saving = true;
    try {
      this._save = await this.api.esphomeSave(this.project.id, overwrite);
    } catch (err) {
      this._error = String((err as { message?: string }).message ?? err);
    } finally {
      this._saving = false;
    }
  }

  private async saveSecrets(form: HTMLFormElement) {
    const data = new FormData(form);
    await this.api.secretsSet(String(data.get("ssid") ?? ""), String(data.get("password") ?? ""));
    this._secretsDone = true;
  }

  private renderSave() {
    const sv = this._save;
    if (this._dir && !this._dir.directory_exists) {
      return html`<p class="muted">${t("no_esphome_dir", { path: this._dir.directory })}</p>`;
    }
    if (!sv) return nothing;
    if (sv.status === "conflict") {
      return html`<div class="notice warning">
        <p>${t(sv.state === "foreign" ? "conflict_foreign" : "conflict_modified", { path: sv.path ?? "" })}</p>
        ${sv.diff ? html`<pre class="diff">${sv.diff}</pre>` : nothing}
        <button class="primary" @click=${() => this.saveToEsphome(true)}>${t("overwrite")}</button>
      </div>`;
    }
    if (sv.status === "saved") {
      return html`<div class="notice ok">
        <p>✓ ${t("saved_to_esphome", { path: sv.path ?? "" })}</p>
        ${sv.backup ? html`<p class="muted">${t("backup_created", { path: sv.backup })}</p>` : nothing}
        ${sv.secrets_missing?.length && !this._secretsDone ? html`<form @submit=${(e: Event) => { e.preventDefault(); void this.saveSecrets(e.target as HTMLFormElement); }}>
          <p>${t("secrets_missing")}</p>
          <input name="ssid" placeholder=${t("wifi_ssid")} required />
          <input name="password" type="password" placeholder=${t("wifi_password")} />
          <button class="primary" type="submit">${t("save_secrets")}</button>
        </form>` : this._secretsDone ? html`<p>✓ ${t("secrets_saved")}</p>` : nothing}
        <p>${t("next_install")}</p>
        <a class="btn" href="/hassio/ingress/5c53de3b_esphome" target="_top">${t("open_esphome")}</a>
      </div>`;
    }
    return nothing;
  }

  /** Example automation actions for the device actions (esphome.<device>_<action>). */
  private actionsExample(): string {
    const dev = this.project.device_name.replace(/-/g, "_");
    const page = this.project.pages[0]?.id ?? "home";
    return [
      `action: esphome.${dev}_show_message`,
      "data:",
      '  title: "Paket"',
      '  message: "Das Paket wurde geliefert."',
      "  duration: 15",
      "",
      `action: esphome.${dev}_show_page`,
      "data:",
      `  page: "${page}"`,
      "",
      `action: esphome.${dev}_set_brightness`,
      "data:",
      "  brightness: 60",
      "",
      `# ${dev}_wake · ${dev}_dim${this.project.settings?.rgb_led?.enabled ? ` · ${dev}_set_led (red, green, blue)` : ""}`,
    ].join("\n");
  }

  private close() {
    this.dispatchEvent(new CustomEvent("closed", { bubbles: true, composed: true }));
  }

  render() {
    const r = this._result;
    const msg = (i: { message: string; message_en: string }) => (lang() === "de" ? i.message : i.message_en);
    const errors = r?.issues.filter((i) => i.level === "error") ?? [];
    const warnings = r?.issues.filter((i) => i.level === "warning") ?? [];
    const mem = r?.memory;
    return html`<div class="backdrop" @click=${(e: Event) => e.target === e.currentTarget && this.close()}>
      <div class="dialog" role="dialog" aria-modal="true">
        <header>
          <h2>${t("export_title")} · ${this.project.device_name}.yaml</h2>
          ${r?.ok && this._dir?.directory_exists ? html`<button class="primary" ?disabled=${this._saving}
            @click=${() => this.saveToEsphome()}>${this._saving ? t("saving_to_esphome") : t("save_to_esphome")}</button>` : nothing}
          ${r?.ok ? html`<button class=${this._dir?.directory_exists ? "" : "primary"} @click=${() => this.copy()}>${this._copied ? t("copied") : t("copy_code")}</button>
            <button @click=${() => this.download()}>⤓ ${t("download")}</button>` : nothing}
          <button @click=${() => this.close()}>${t("close")}</button>
        </header>
        ${this._error ? html`<div class="blocked error">${this._error}</div>` : !r ? html`<div class="blocked">${t("generating")}</div>`
          : !r.ok ? html`<div class="blocked"><p>${t("export_blocked")}</p><ul>${errors.map((i) => html`<li class="error">${msg(i)}</li>`)}</ul></div>`
          : html`<div class="body">
            <pre>${highlightYaml(r.yaml)}</pre>
            <aside>
              ${this.renderSave()}
              <h4>${t("how_to_install")}</h4>
              <p>${t("install_steps")}</p>
              <p>${t("secrets_hint")}</p>
              <p><strong>${t("allow_actions_hint")}</strong></p>
              ${this.project.id ? html`<cyd-device-status .api=${this.api} .projectId=${this.project.id}
                .deviceName=${this.project.device_name}></cyd-device-status>` : nothing}
              ${this.project.settings?.device_actions !== false ? html`<h4>${t("ha_actions")}</h4>
                <p>${t("ha_actions_hint")}</p>
                <pre class="diff">${this.actionsExample()}</pre>` : nothing}
              <h4>${t("first_install")}</h4>
              <p>${t("first_install_steps")}</p>
              ${mem ? html`<h4>${t("memory")}</h4><p>${t("memory_estimate", {
                objects: mem.objects, ram: Math.round(mem.ram_bytes / 1024), pct: Math.round(mem.ratio * 100),
                flash: Math.round(mem.flash_fonts_bytes / 1024) })}</p>` : nothing}
              ${warnings.length ? html`<h4>${t("validation")}</h4><ul>${warnings.map((i) => html`<li class="warning">${msg(i)}</li>`)}</ul>` : nothing}
              ${this.info?.hardware_hints ? html`<p><a href=${this.info.hardware_info_url} target="_blank" rel="noopener">${t("where_to_buy")} · ${t("matching_case")}</a></p>` : nothing}
            </aside>
          </div>`}
      </div>
    </div>`;
  }
}

customElements.define("cyd-export-dialog", CydExportDialog);
