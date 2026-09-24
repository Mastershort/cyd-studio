// Tile styles – exact port of custom_components/cyd_studio/generator/style.py.
// Presets are data (styles/tile_presets.json, bundled at build time).
import presetsData from "../../custom_components/cyd_studio/styles/tile_presets.json";
import type { Theme } from "./types";

export interface TileStyle {
  preset: string;
  bg: string;
  bg_on: string;
  border: string;
  border_on: string;
  text: string;
  text_on: string;
  sub: string;
  sub_on: string;
  icon: string;
  icon_on: string;
  circle_bg: string;
  circle_bg_on: string;
  bg_opa: number;
  bg_opa_on: number;
  border_width: number;
  radius: number;
  circle: boolean;
  text_size: string;
  value_size: string;
  icon_size: string;
  text_weight: string;
}

type PresetData = { presets: Record<string, Record<string, unknown>>; role_defaults: Record<string, string> };
export const PRESETS = presetsData as unknown as PresetData;

const COLOR_KEYS = ["bg", "bg_on", "border", "border_on", "text", "text_on", "sub", "sub_on",
  "icon", "icon_on", "circle_bg", "circle_bg_on"] as const;
const NUMBER_KEYS = ["bg_opa", "bg_opa_on", "border_width", "radius"] as const;
export const TEXT_SIZES = ["xs", "s", "m", "l", "xl"];
export const ICON_SIZES = ["auto", "none", "s", "m", "l"];
const WEIGHTS = ["normal", "bold"];

function color(value: unknown, colors: Record<string, string>, roleDefaults: Record<string, string>): string {
  const text = String(value);
  if (text.startsWith("#")) return text.toLowerCase();
  return String(colors[text] || roleDefaults[text] || colors.text || "#ffffff").toLowerCase();
}

export function resolveTileStyle(theme: Theme, style: Record<string, unknown> | null | undefined, data: PresetData = PRESETS): TileStyle {
  const st = style ?? {};
  const defaultName = String((theme as unknown as Record<string, unknown>).default_tile_style ?? "card");
  const name = String(st.preset || defaultName);
  const base = data.presets[name] ?? data.presets.card;
  const merged: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(st)) if (v !== null && v !== undefined && v !== "") merged[k] = v;
  const colors = theme.colors ?? {};
  const out: Record<string, unknown> = { preset: name in data.presets ? name : "card" };
  for (const key of COLOR_KEYS) out[key] = color(merged[key], colors, data.role_defaults ?? {});
  for (const key of NUMBER_KEYS) {
    let value = merged[key];
    if (value === "theme") value = (theme as unknown as Record<string, unknown>)[key] ?? 0;
    out[key] = Math.max(0, Math.trunc(Number(value)));
  }
  out.bg_opa = Math.min(out.bg_opa as number, 100);
  out.bg_opa_on = Math.min(out.bg_opa_on as number, 100);
  out.circle = Boolean(merged.circle ?? false);
  const size = String(merged.text_size ?? "s");
  out.text_size = TEXT_SIZES.includes(size) ? size : "s";
  const valueSize = String(merged.value_size ?? "auto");
  out.value_size = TEXT_SIZES.includes(valueSize) ? valueSize : "auto";
  const iconSize = String(merged.icon_size ?? "auto");
  out.icon_size = ICON_SIZES.includes(iconSize) ? iconSize : "auto";
  const weight = String(merged.text_weight ?? "normal");
  out.text_weight = WEIGHTS.includes(weight) ? weight : "normal";
  return out as unknown as TileStyle;
}

/** Props the layout needs from the resolved style (icon circle and size, text size and weight). */
export function layoutProps(props: Record<string, unknown>, style: TileStyle): Record<string, unknown> {
  return {
    ...props, icon_circle: style.circle, text_size: style.text_size, value_size: style.value_size,
    icon_size: style.icon_size, text_weight: style.text_weight,
  };
}
