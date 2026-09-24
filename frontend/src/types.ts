// Project model (see custom_components/cyd_studio/schema/project.schema.json)

export interface GridConfig {
  cols?: number;
  rows?: number;
  gap?: number;
  padding?: number;
}

export interface WidgetAction {
  service: string;
  target?: string | null;
  data?: Record<string, unknown>;
}

export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  entity?: string | null;
  action?: WidgetAction | null;
  props: Record<string, unknown>;
  /** appearance overrides (preset, colors, opacity, radius, circle, text size) – see styles/tile_presets.json */
  style?: Record<string, unknown>;
}

export interface Background {
  color?: string | null;
  image?: string | null;
}

export interface Page {
  id: string;
  name: string;
  icon?: string;
  parent?: string | null;
  in_navigation?: boolean;
  layout?: "grid" | "free";
  grid_override?: GridConfig | null;
  timeout_s?: number | null;
  show_header?: boolean;
  background?: Background | null;
  widgets: Widget[];
}

export interface BarItem {
  type: string;
  align?: "left" | "center" | "right";
}

export interface Project {
  schema: number;
  id: string;
  name: string;
  device_name: string;
  board: string;
  board_variant?: string | null;
  orientation: "landscape" | "portrait" | "landscape_flipped" | "portrait_flipped";
  grid?: GridConfig;
  theme: string;
  theme_overrides?: Record<string, string>;
  /** project wide tile style (applies to every widget, widgets can override) */
  tile_style?: Record<string, unknown>;
  /** background of all pages (pages can override) */
  background?: Background | null;
  settings?: {
    brightness_day?: number;
    brightness_night?: number;
    screensaver?: { enabled?: boolean; after_s?: number; action?: string };
    return_home_after_s?: number | null;
    rgb_led?: { enabled?: boolean; show_status?: boolean };
    wifi?: { use_secrets?: boolean; ap_fallback?: boolean };
    language?: "de" | "en";
    api_key?: string | null;
    [key: string]: unknown;
  };
  global?: {
    header?: { enabled?: boolean; height?: number; widgets?: BarItem[] };
    footer?: { enabled?: boolean; height?: number; widgets?: BarItem[] };
  };
  pages: Page[];
  navigation?: {
    style?: string;
    tabbar_position?: "bottom" | "top" | "left";
    show_labels?: boolean;
    show_icons?: boolean;
    swipe?: boolean;
    wrap_around?: boolean;
    home_page?: string | null;
    transition?: string;
  };
  popups?: unknown[];
  meta?: { created?: string; updated?: string; [key: string]: unknown };
}

export interface ProjectSummary {
  id: string;
  name: string;
  device_name: string;
  board: string;
  orientation: string;
  updated: string | null;
  page_count: number;
  widget_count: number;
  exported: { updated: string; checksum: string; at: string } | null;
  changed_since_export: boolean;
}

export interface PropDef {
  key: string;
  type: "text" | "icon" | "bool" | "int" | "select" | "page" | "entity";
  domains?: string[];
  /** only shown when the widget's "count" property is at least this number (button_grid) */
  min_count?: number;
  default: unknown;
  label: string;
  label_en: string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface WidgetDef {
  type: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon: string;
  domains: string[];
  entity: "required" | "optional" | "none" | "action";
  default_size: { w: number; h: number };
  min_size: { w: number; h: number };
  props: PropDef[];
}

export interface BoardVariant {
  id: string;
  label: string;
  label_en: string;
  native?: { width: number; height: number };
  orientations?: Record<string, { rotation: number }>;
}

export interface Board {
  id: string;
  name: string;
  name_en?: string;
  native: { width: number; height: number };
  display: { model: string; variants?: BoardVariant[] };
  orientations: Record<string, { rotation: number; usb?: string }>;
  notes_de?: string;
  notes_en?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  radius: number;
  border_width: number;
  font_sizes: Record<string, number>;
  icon_sizes: Record<string, number>;
}

export interface Template {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  placeholders: { key: string; label: string; label_en: string; domains: string[] }[];
  project: Partial<Project>;
}

export interface Issue {
  level: "error" | "warning";
  code: string;
  message: string;
  message_en: string;
  page: string | null;
  widget: string | null;
}

export interface GenerateResult {
  ok: boolean;
  yaml: string;
  issues: Issue[];
  memory: { objects: number; ram_bytes: number; flash_fonts_bytes: number; budget_bytes: number; ratio: number } | null;
}

export interface DeviceStatus {
  found: boolean;
  entry_id: string | null;
  title: string | null;
  loaded: boolean;
  actions_allowed: boolean;
}

export interface EsphomeSaveResult {
  status: "saved" | "conflict" | "invalid";
  state?: "foreign" | "modified";
  path?: string;
  diff?: string;
  backup?: string | null;
  secrets_missing?: string[];
  missing_images?: string[];
  issues?: Issue[];
}

export interface StudioInfo {
  version: string;
  generator_version: string;
  esphome_min_version: string;
  icons_url: string;
  hardware_hints: boolean;
  hardware_info_url: string;
  default_theme: string;
  preview_real_actions: boolean;
}

// Minimal subset of Home Assistant's frontend `hass` object we rely on
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface Hass {
  states: Record<string, HassEntity>;
  entities?: Record<string, { entity_id: string; area_id?: string | null; device_id?: string | null; name?: string | null }>;
  devices?: Record<string, { id: string; area_id?: string | null; name?: string | null }>;
  areas?: Record<string, { area_id: string; name: string }>;
  language: string;
  themes?: { darkMode?: boolean };
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
}
