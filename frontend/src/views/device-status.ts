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
    status: { attribute: false },
    _busy: { state: true },
    _done: { state: true },
  };

  declare api: Api;
  declare projectId: string;
  declare deviceName: string;
  declare compact: boolean;
  declare status: DeviceStatus | null;
  declare _busy: boolean;
  declare _done: boolean;

  constructor() {
    super();
    this.compact = false;
    this.status = null;
    this._busy = false;
    this._done = false;
  }

  static styles = css`
    :host { display: block; font-size: 13px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .warn { color: var(--warning-color, #f59e0b); }
    .ok { color: var(--success-color, #22c55e); }
    .muted { color: var(--secondary-text-color); }
    .banner { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--warning-color, #f59e0b);
      background: rgba(245, 158, 11, .1); }
    button { font: inherit; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--warning-color, #f59e0b);
      background: var(--warning-color, #f59e0b); color: #111; cursor: pointer; }
    button:disabled { opacity: .5; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.status) void this.refresh();
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
    if (!s.found) return html`<div class="muted">○ ${t("device_not_found", { name: this.deviceName })}</div>`;
    if (!s.actions_allowed) {
      return html`<div class="row ${this.compact ? "warn" : "banner warn"}">
        <span>⚠ ${t("actions_blocked")}</span>
        <button ?disabled=${this._busy} @click=${() => this.allow()}>${t("allow_actions")}</button></div>`;
    }
    if (this._done) return html`<div class="ok">✓ ${t("actions_allowed_done")}</div>`;
    return s.loaded ? html`<div class="ok">● ${t("device_connected")}</div>` : html`<div class="muted">◐ ${t("device_offline")}</div>`;
  }
}

customElements.define("cyd-device-status", CydDeviceStatus);
