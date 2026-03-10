import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
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
        th: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'border-hover': 'rgb(var(--color-border-hover) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
export default config;
