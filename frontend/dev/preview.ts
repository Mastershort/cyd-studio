// Renders every page of every golden project with fixed sample data and a fixed clock.
// Used by the Playwright snapshot tests (e2e/preview.spec.ts) and for manual checks.
import { normalize, resolveBoard } from "../src/model";
import { loadFonts } from "../src/preview/fonts";
import { loadIcons } from "../src/preview/icons";
import { renderScreen, sampleState } from "../src/preview/renderer";
import { boards, goldens, iconsUrl, themes } from "./data";

const FIXED_NOW = new Date(2026, 8, 24, 10, 30, 15);
// test images next to the golden files (tests/esphome/cyd_studio/<device>/<asset>.png)
const imageFiles = import.meta.glob("../../tests/esphome/cyd_studio/*/*.png", { query: "?url", import: "default", eager: true });

async function loadImages(): Promise<Record<string, HTMLImageElement>> {
  const out: Record<string, HTMLImageElement> = {};
  for (const [path, url] of Object.entries(imageFiles)) {
    const img = new Image();
    img.src = url as string;
    await img.decode();
    out[path.split("/").pop()!.replace(".png", "")] = img;
  }
  return out;
}

async function main() {
  await Promise.all([loadFonts(), loadIcons(iconsUrl)]);
  const images = await loadImages();
  const root = document.getElementById("root")!;
  for (const { name, project: raw } of goldens) {
    const project = normalize(raw);
    const board = boards.find((b) => b.id === project.board)!;
    const theme = themes.find((t) => t.id === project.theme)!;
    const resolved = resolveBoard(board, project.board_variant, project.orientation);
    for (const page of project.pages) {
      const figure = document.createElement("figure");
      const canvas = document.createElement("canvas");
      canvas.dataset.snapshot = `${name}--${page.id}`;
      renderScreen(canvas, {
        project, board: resolved, theme: { ...theme, colors: { ...theme.colors, ...(project.theme_overrides ?? {}) } },
        pageId: page.id, state: sampleState(project), now: FIXED_NOW, images,
      });
      canvas.style.width = `${resolved.width * 2}px`;
      const caption = document.createElement("figcaption");
      caption.textContent = `${name} / ${page.id}`;
      figure.append(canvas, caption);
      root.append(figure);
    }
  }
  // Long press overlay on the reference layout (value 80 %)
  const ref = goldens.find((g) => g.name === "reference_home_like");
  if (ref) {
    const project = normalize(ref.project);
    const board = boards.find((b) => b.id === project.board)!;
    const theme = themes.find((t) => t.id === project.theme)!;
    const resolved = resolveBoard(board, project.board_variant, project.orientation);
    const canvas = document.createElement("canvas");
    canvas.dataset.snapshot = "reference_home_like--overlay";
    renderScreen(canvas, {
      project, board: resolved, theme, pageId: project.pages[0].id, state: sampleState(project), now: FIXED_NOW,
      overlay: { title: "Schrank", value: 80 },
    });
    canvas.style.width = `${resolved.width * 2}px`;
    root.append(canvas);
    // light overlay: brightness, color temperature and color
    const light = document.createElement("canvas");
    light.dataset.snapshot = "reference_home_like--light";
    renderScreen(light, {
      project, board: resolved, theme, pageId: project.pages[0].id, state: sampleState(project), now: FIXED_NOW,
      overlay: { title: "Wohnzimmer", value: 80, light: { ct: 3000, hue: 200, hasCt: true, hasHs: true } },
    });
    light.style.width = `${resolved.width * 2}px`;
    root.append(light);
  }
  // Message from Home Assistant (show_message) on top of the "more" project
  const more = goldens.find((g) => g.name === "more");
  if (more) {
    const project = normalize(more.project);
    const board = boards.find((b) => b.id === project.board)!;
    const theme = themes.find((t) => t.id === project.theme)!;
    const resolved = resolveBoard(board, project.board_variant, project.orientation);
    const canvas = document.createElement("canvas");
    canvas.dataset.snapshot = "more--message";
    renderScreen(canvas, {
      project, board: resolved, theme, pageId: "zwei", state: sampleState(project), now: FIXED_NOW, images,
      message: { title: "Paket", text: "Das Paket wurde geliefert und liegt vor der Haustür. Bitte bald hereinholen." },
    });
    canvas.style.width = `${resolved.width * 2}px`;
    root.append(canvas);
  }
  document.body.dataset.ready = "1";
}

void main();
