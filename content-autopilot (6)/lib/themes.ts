// Theme palettes - "Original Ink" is the default (from the first palette
// you sent). The rest are pulled from the other coolors.co palettes you
// shared. Pastel-only palettes (no genuinely dark color) get a fixed
// neutral dark background so text stays readable - flagged below.

export type Theme = {
  id: string;
  name: string;
  colors: {
    ink: string; // background
    teal: string; // card/border accent
    lime: string; // primary action color
    ember: string; // secondary accent / warnings
    cream: string; // text
  };
};

export const THEMES: Theme[] = [
  {
    id: "original",
    name: "Original Ink",
    colors: { ink: "#002626", teal: "#0E4749", lime: "#95C623", ember: "#E55812", cream: "#EFE7DA" },
  },
  {
    id: "deep-teal-coral",
    name: "Deep Teal Coral",
    colors: { ink: "#071E22", teal: "#1D7874", lime: "#F4C095", ember: "#EE2E31", cream: "#F2EFEA" },
  },
  {
    id: "midnight-navy",
    name: "Midnight Navy",
    colors: { ink: "#0A1128", teal: "#034078", lime: "#1282A2", ember: "#E2725B", cream: "#FEFCFB" },
  },
  {
    id: "ember-fire",
    name: "Ember Fire",
    colors: { ink: "#230007", teal: "#5A0002", lime: "#D7CF07", ember: "#D98324", cream: "#FBF6E3" },
  },
  {
    id: "maroon-sunset",
    name: "Maroon Sunset",
    colors: { ink: "#721121", teal: "#A5402D", lime: "#FFC07F", ember: "#F15156", cream: "#FFF4E6" },
  },
  {
    id: "olive-neon",
    name: "Olive Neon",
    colors: { ink: "#420217", teal: "#436436", lime: "#D2FF28", ember: "#C84C09", cream: "#F3FBE8" },
  },
  {
    id: "pastel-orchid",
    name: "Pastel Orchid",
    // pastel-only source palette - using a fixed dark base (#18020C, which
    // IS in your palette) to keep contrast readable, pastel tones as accents
    colors: { ink: "#18020C", teal: "#634B66", lime: "#FFD5FF", ember: "#B47EB3", cream: "#E5FFDE" },
  },
];

export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
