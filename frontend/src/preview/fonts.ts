// Fonts identical to the generated firmware: Montserrat 500/700 (gfonts://Montserrat@500, @700)
// and Material Design Icons 7.4.47 (same version as the ESPHome icon font).
import montserratUrl from "@fontsource/montserrat/files/montserrat-latin-500-normal.woff2";
import montserratExtUrl from "@fontsource/montserrat/files/montserrat-latin-ext-500-normal.woff2";
import montserratBoldUrl from "@fontsource/montserrat/files/montserrat-latin-700-normal.woff2";
import montserratBoldExtUrl from "@fontsource/montserrat/files/montserrat-latin-ext-700-normal.woff2";
import mdiUrl from "@mdi/font/fonts/materialdesignicons-webfont.woff2";

export const TEXT_FAMILY = "CYD Montserrat";
export const ICON_FAMILY = "CYD MDI";

const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

let loading: Promise<void> | null = null;

export function loadFonts(): Promise<void> {
  if (loading) return loading;
  const faces = [
    new FontFace(TEXT_FAMILY, `url(${montserratUrl})`, { weight: "500", unicodeRange: LATIN }),
    new FontFace(TEXT_FAMILY, `url(${montserratExtUrl})`, { weight: "500" }),
    new FontFace(TEXT_FAMILY, `url(${montserratBoldUrl})`, { weight: "700", unicodeRange: LATIN }),
    new FontFace(TEXT_FAMILY, `url(${montserratBoldExtUrl})`, { weight: "700" }),
    new FontFace(ICON_FAMILY, `url(${mdiUrl})`),
  ];
  loading = Promise.all(faces.map(async (f) => {
    const loaded = await f.load();
    document.fonts.add(loaded);
  })).then(() => undefined);
  return loading;
}

export function textFont(size: number, bold = false): string {
  return `${bold ? 700 : 500} ${size}px "${TEXT_FAMILY}"`;
}

export function iconFont(size: number): string {
  return `${size}px "${ICON_FAMILY}"`;
}
