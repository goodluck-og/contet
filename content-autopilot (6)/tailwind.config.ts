import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--color-ink)",
        teal: "var(--color-teal)",
        lime: "var(--color-lime)",
        ember: "var(--color-ember)",
        cream: "var(--color-cream)",
      },
    },
  },
  plugins: [],
};
export default config;
