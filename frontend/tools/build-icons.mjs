// Generates the MDI name -> codepoint table used by the generator (Python)
// and the preview (served as static file). Pinned to the same MDI version
// as the icon font that ESPHome downloads (see generator/fonts.py).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(resolve(here, "../node_modules/@mdi/svg/meta.json"), "utf8"));
const table = {};
for (const icon of [...meta].sort((a, b) => a.name.localeCompare(b.name))) {
  table[icon.name] = icon.codepoint;
  for (const alias of icon.aliases ?? []) table[alias] ??= icon.codepoint;
}
const sorted = Object.fromEntries(Object.entries(table).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const out = resolve(here, "../../custom_components/cyd_studio/data/mdi_codepoints.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(sorted) + "\n");
console.log(`wrote ${Object.keys(sorted).length} icons to ${out}`);
