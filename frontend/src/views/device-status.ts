// <cyd-device-status>: is the ESPHome device of a project in HA, and may it perform actions?
import { LitElement, css, html, nothing } from "lit";
import type { Api } from "../api";
import { t } from "../i18n";
import type { DeviceStatus } from "../types";

export class CydDeviceStatus extends LitElement {
  static properties = {
    api: { attribute: false },
    projectId: {},
    deviceName: {},
    compact: { type: Boolean },
    collapsed: { type: Boolean },
    status: { attribute: false },
    _busy: { state: true },
    _done: { state: true },
    _copied: { state: true },
  };

  declare api: Api;
  declare projectId: string;
  declare deviceName: string;
  declare compact: boolean;
  declare collapsed: boolean;
  declare status: DeviceStatus | null;
  declare _busy: boolean;
  declare _done: boolean;
  declare _copied: boolean;
  private timer?: number;

  constructor() {
    super();
    this.compact = false;
    this.collapsed = false;
    this.status = null;
    this._busy = false;
    this._done = false;
    this._copied = false;
  }

  static styles = css`
    :host { display: block; font-size: 13px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .warn { color: var(--warning-color, #f59e0b); }
    .ok { color: var(--success-color, #22c55e); }
    .muted { color: var(--secondary-text-color); }
    details { margin-top: 2px; }
    summary { cursor: pointer; color: var(--secondary-text-color); }
    ol { margin: 6px 0; padding-left: 20px; line-height: 1.5; }
    code { font-size: 12px; }
    a { color: var(--primary-color); }
    .btn2 { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #000); }
    .banner { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--warning-color, #f59e0b);
      background: rgba(245, 158, 11, .1); }
    button { font: inherit; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--warning-color, #f59e0b);
      background: var(--warning-color, #f59e0b); color: #111; cursor: pointer; }
    button:disabled { opacity: .5; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.status) void this.refresh();
    // Editor / export dialog: keep the status current while the user connects the display
    if (!this.compact) this.timer = window.setInterval(() => void this.refresh(), 10000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }

  private async copyKey() {
    const project = await this.api.project(this.projectId);
    const key = project.settings?.api_key;
    if (!key) return;
    await navigator.clipboard.writeText(key);
    this._copied = true;
    setTimeout(() => (this._copied = false), 2500);
  }

  private keyButton() {
    return html`<button class="btn2" @click=${() => this.copyKey()}>${this._copied ? t("key_copied") : t("copy_key")}</button>`;
  }

  private guideNotFound() {
    return html`<details ?open=${!this.compact && !this.collapsed}>
      <summary>○ ${t("device_not_found", { name: this.deviceName })} – ${t("how_to_connect")}</summary>
      <ol>
        <li>${t("connect_step_flash")}</li>
        <li>${t("connect_step_discovered")} <a href="/config/integrations/dashboard" target="_top">${t("open_integrations")}</a></li>
        <li>${t("connect_step_key")} ${this.keyButton()}</li>
        <li>${t("connect_step_manual")}</li>
      </ol>
    </details>`;
  }

  private guideOffline() {
    return html`<details>
      <summary>◐ ${t("device_offline")} – ${t("what_to_do")}</summary>
      <ol>
        <li>${t("offline_step_power")}</li>
        <li>${t("offline_step_key")} ${this.keyButton()}</li>
      </ol>
    </details>`;
  }

  async refresh() {
    try {
      this.status = (await this.api.devices())[this.projectId] ?? null;
    } catch {
      this.status = null;
    }
  }

  private async allow() {
    const s = this.status;
    if (!s?.found || !confirm(t("allow_actions_confirm", { device: s.title ?? this.deviceName }))) return;
    this._busy = true;
    try {
      this.status = await this.api.allowActions(this.projectId);
      this._done = true;
    } finally {
      this._busy = false;
    }
  }

  render() {
    const s = this.status;
    if (!s) return nothing;
    if (!s.found) return this.guideNotFound();
    if (!s.actions_allowed) {
      return html`<div class="row ${this.compact ? "warn" : "banner warn"}">
        <span>⚠ ${t("actions_blocked")}</span>
        <button ?disabled=${this._busy} @click=${() => this.allow()}>${t("allow_actions")}</button></div>`;
    }
    if (this._done) return html`<div class="ok">✓ ${t("actions_allowed_done")}</div>`;
    return s.loaded ? html`<div class="ok">● ${t("device_connected")}</div>` : this.guideOffline();
  }
}

customElements.define("cyd-device-status", CydDeviceStatus);
