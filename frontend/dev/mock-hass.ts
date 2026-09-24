// Minimal fake `hass` for developing the panel without Home Assistant (npm run dev:panel).
// The backend commands are emulated in memory; code generation returns a placeholder.
import type { Hass, HassEntity, Project } from "../src/types";
import { boards, goldens, iconsUrl, templates, themes, widgets } from "./data";

const entity = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): HassEntity => ({
  entity_id, state, attributes: { friendly_name: entity_id.split(".")[1].replace(/_/g, " "), ...attributes },
});

const states: Record<string, HassEntity> = Object.fromEntries([
  entity("light.wohnzimmer", "on", { friendly_name: "Wohnzimmer Decke" }),
  entity("switch.stehlampe", "off", { friendly_name: "Stehlampe" }),
  entity("cover.rollladen", "open", { friendly_name: "Rollladen" }),
  entity("sensor.wohnzimmer_temperatur", "21.4", { friendly_name: "Temperatur Wohnzimmer", unit_of_measurement: "°C" }),
  entity("sensor.wohnzimmer_luftfeuchte", "48", { friendly_name: "Luftfeuchte", unit_of_measurement: "%" }),
  entity("sensor.wohnzimmer_co2", "612", { friendly_name: "CO₂", unit_of_measurement: "ppm" }),
  entity("binary_sensor.fenster_wohnzimmer", "off", { friendly_name: "Fenster Wohnzimmer" }),
  entity("script.alles_aus", "off", { friendly_name: "Alles aus" }),
  entity("scene.abend", "unknown", { friendly_name: "Abendstimmung" }),
].map((e) => [e.entity_id, e]));

const projects = new Map<string, Project>();
const allowed = new Set<string>();
const assets = new Map<string, string>();
for (const g of goldens) projects.set(g.project.id, structuredClone(g.project));

const handlers: Record<string, (msg: Record<string, unknown>) => unknown> = {
  "cyd_studio/info": () => ({
    version: "dev", generator_version: "dev", esphome_min_version: "2026.9.0", icons_url: iconsUrl,
    hardware_hints: true, hardware_info_url: "https://mastershort.de/cyd-studio/hardware?src=cyd-studio",
    default_theme: "mastershort_dark", preview_real_actions: true,
  }),
  "cyd_studio/boards/list": () => boards,
  "cyd_studio/widgets/list": () => widgets,
  "cyd_studio/themes/list": () => themes,
  "cyd_studio/templates/list": () => templates,
  "cyd_studio/projects/list": () => [...projects.values()].map((p) => ({
    id: p.id, name: p.name, device_name: p.device_name, board: p.board, orientation: p.orientation,
    updated: p.meta?.updated ?? null, page_count: p.pages.length,
    widget_count: p.pages.reduce((n, pg) => n + pg.widgets.length, 0), exported: null, changed_since_export: false,
  })),
  "cyd_studio/projects/get": (m) => structuredClone(projects.get(m.project_id as string)),
  "cyd_studio/projects/save": (m) => {
    const p = structuredClone(m.project as Project);
    p.id ||= Math.random().toString(16).slice(2);
    p.meta = { ...p.meta, updated: new Date().toISOString() };
    projects.set(p.id, p);
    return structuredClone(p);
  },
  "cyd_studio/projects/delete": (m) => { projects.delete(m.project_id as string); return null; },
  "cyd_studio/projects/duplicate": (m) => {
    const p = structuredClone(projects.get(m.project_id as string)!);
    p.id = Math.random().toString(16).slice(2);
    p.name += " (Kopie)";
    projects.set(p.id, p);
    return p;
  },
  // golden projects: no ESPHome device in HA yet; projects created in the dev panel: found, actions blocked
  "cyd_studio/esphome/devices": () => Object.fromEntries([...projects.values()].map((p) => [p.id,
    goldens.some((g) => g.project.id === p.id)
      ? { found: false, entry_id: null, title: null, loaded: false, actions_allowed: false }
      : { found: true, entry_id: "e1", title: p.name, loaded: true, actions_allowed: allowed.has(p.id) }])),
  "cyd_studio/esphome/allow_actions": (m) => {
    allowed.add(m.project_id as string);
    return { found: true, entry_id: "e1", title: "Display", loaded: true, actions_allowed: true };
  },
  "cyd_studio/assets/upload": (m) => {
    const id = (assets.size + 1).toString(16).padStart(12, "0");
    assets.set(id, m.data as string);
    return { asset_id: id };
  },
  "cyd_studio/assets/get": (m) => ({ data_url: assets.get(m.asset_id as string) }),
  "cyd_studio/esphome/status": () => ({ directory: "/config/esphome", directory_exists: true }),
  // first save: hand-edited file -> conflict with diff; with overwrite: saved, secrets missing
  "cyd_studio/esphome/save": (m) => m.overwrite
    ? { status: "saved", path: "/config/esphome/cyd-dev.yaml", backup: "/config/esphome/cyd-dev.yaml.bak-1", secrets_missing: ["wifi_ssid", "wifi_password"], missing_images: [] }
    : { status: "conflict", state: "modified", path: "/config/esphome/cyd-dev.yaml", diff: ["-  name: alt", "+  name: neu"].join("\n") },
  "cyd_studio/esphome/secrets_set": () => ({ secrets_missing: [] }),
  "cyd_studio/generate/yaml": () => ({ ok: true, yaml: "# Dev-Modus: YAML erzeugt nur das echte Backend\n", issues: [], memory: null }),
};

export const mockHass: Hass = {
  states,
  language: "de",
  entities: {},
  devices: {},
  areas: {},
  async callWS<T>(msg: Record<string, unknown>): Promise<T> {
    const handler = handlers[msg.type as string];
    if (!handler) throw new Error(`unknown command ${String(msg.type)}`);
    return handler(msg) as T;
  },
  async callService(domain: string, service: string, data?: Record<string, unknown>) {
    console.info("callService", domain, service, data);
    return null;
  },
};
