// WebSocket API of the backend (custom_components/cyd_studio/websocket_api.py)
import type {
  Board, DeviceStatus, EsphomeSaveResult, GenerateResult, Hass, Project, ProjectSummary, StudioInfo, Template, Theme, WidgetDef,
} from "./types";

export class Api {
  constructor(private hass: Hass) {}

  setHass(hass: Hass): void {
    this.hass = hass;
  }

  private ws<T>(type: string, data: Record<string, unknown> = {}): Promise<T> {
    return this.hass.callWS<T>({ type: `cyd_studio/${type}`, ...data });
  }

  info = () => this.ws<StudioInfo>("info");
  boards = () => this.ws<Board[]>("boards/list");
  widgets = () => this.ws<WidgetDef[]>("widgets/list");
  themes = () => this.ws<Theme[]>("themes/list");
  templates = () => this.ws<Template[]>("templates/list");
  projects = () => this.ws<ProjectSummary[]>("projects/list");
  project = (projectId: string) => this.ws<Project>("projects/get", { project_id: projectId });
  save = (project: Project) => this.ws<Project>("projects/save", { project });
  remove = (projectId: string) => this.ws<null>("projects/delete", { project_id: projectId });
  duplicate = (projectId: string) => this.ws<Project>("projects/duplicate", { project_id: projectId });
  importProject = (project: Project) => this.ws<Project>("projects/import", { project });
  importYaml = (yaml: string) => this.ws<Project>("projects/import", { yaml });
  devices = () => this.ws<Record<string, DeviceStatus>>("esphome/devices");
  allowActions = (projectId: string) => this.ws<DeviceStatus>("esphome/allow_actions", { project_id: projectId });
  uploadAsset = (projectId: string, data: string, width: number, height: number) =>
    this.ws<{ asset_id: string }>("assets/upload", { project_id: projectId, data, width, height });
  getAsset = (projectId: string, assetId: string) =>
    this.ws<{ data_url: string }>("assets/get", { project_id: projectId, asset_id: assetId });
  /** Link to the installed ESPHome add-on (slug differs: official, beta, dev, community); null without Supervisor. */
  async esphomeUrl(): Promise<string | null> {
    try {
      const res = await this.hass.callWS<{ addons?: { slug: string; state?: string }[] }>(
        { type: "supervisor/api", endpoint: "/addons", method: "get" });
      const addons = (res.addons ?? []).filter((a) => /(^|_)esphome(-beta|-dev)?$/.test(a.slug));
      const best = addons.find((a) => a.state === "started") ?? addons[0];
      return best ? `/hassio/ingress/${best.slug}` : null;
    } catch {
      return null;
    }
  }

  esphomeStatus = () => this.ws<{ directory: string; directory_exists: boolean }>("esphome/status");
  esphomeSave = (projectId: string, overwrite = false) =>
    this.ws<EsphomeSaveResult>("esphome/save", { project_id: projectId, overwrite });
  secretsSet = (ssid: string, password: string) =>
    this.ws<{ secrets_missing: string[] }>("esphome/secrets_set", { wifi_ssid: ssid, wifi_password: password });
  generate = (project: Project, markExported = false) =>
    this.ws<GenerateResult>("generate/yaml", { project, mark_exported: markExported });
}
