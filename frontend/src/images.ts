// Project images: fit a user file to the display size in the browser, load stored images for the preview.
import type { Api } from "./api";
import type { Project } from "./types";

/** Read a file and cover-fit it (center crop) to width x height; returns a PNG data URL. */
export async function fitImageFile(file: File, width: number, height: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("image"));
      i.src = url;
    });
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Asset ids used by a project (project and page backgrounds). */
export function usedAssets(project: Project): string[] {
  const ids: string[] = [];
  for (const bg of [project.background, ...project.pages.map((p) => p.background)]) {
    if (bg?.image && !ids.includes(bg.image)) ids.push(bg.image);
  }
  return ids;
}

/** Load the images of a project as decoded <img> elements, keyed by asset id. */
export async function loadProjectImages(api: Api, project: Project, cache: Record<string, HTMLImageElement> = {}) {
  const out: Record<string, HTMLImageElement> = { ...cache };
  await Promise.all(usedAssets(project).filter((id) => !out[id]).map(async (id) => {
    try {
      const { data_url } = await api.getAsset(project.id, id);
      const img = new Image();
      img.src = data_url;
      await img.decode();
      out[id] = img;
    } catch {
      /* missing image: preview shows the background color */
    }
  }));
  return out;
}
