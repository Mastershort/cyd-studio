// Dev/test data: the integration's data files loaded through Vite (no Home Assistant needed).
import { parse } from "yaml";
import type { Board, Project, Template, Theme, WidgetDef } from "../src/types";

const boardFiles = import.meta.glob("../../custom_components/cyd_studio/boards/*.yaml", { query: "?raw", import: "default", eager: true });
const widgetFiles = import.meta.glob("../../custom_components/cyd_studio/widgets/*.json", { import: "default", eager: true });
const themeFiles = import.meta.glob("../../custom_components/cyd_studio/themes/*.json", { import: "default", eager: true });
const templateFiles = import.meta.glob("../../custom_components/cyd_studio/templates/*.json", { import: "default", eager: true });
const goldenFiles = import.meta.glob("../../tests/golden/*.json", { import: "default", eager: true });

export const boards = Object.values(boardFiles).map((raw) => parse(raw as string) as Board);
export const widgets = Object.values(widgetFiles) as WidgetDef[];
export const themes = Object.values(themeFiles) as Theme[];
export const templates = Object.values(templateFiles) as Template[];
export const goldens = Object.entries(goldenFiles).map(([path, project]) => ({
  name: path.split("/").pop()!.replace(".json", ""),
  project: project as Project,
}));
export const iconsUrl = new URL("../../custom_components/cyd_studio/data/mdi_codepoints.json", import.meta.url).href;
