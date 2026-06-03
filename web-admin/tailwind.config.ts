import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Paleta El Brasero ─────────────────────────────────────
        "brasero-primary":       "#BF391B",
        "brasero-dark":          "#8C2510",
        "brasero-light":         "#E54D2A",

        // Neutros
        "brasero-black":         "#0D0D0D",
        "brasero-surface-dark":  "#1A1A1A",
        "brasero-card-dark":     "#242424",
        "brasero-white":         "#FFFFFF",
        "brasero-off-white":     "#F8F9FA",
        "brasero-light-gray":    "#F0F2F5",
        "brasero-border-gray":   "#E4E7EC",
        "brasero-muted":         "#9AA0A6",

        // Estados
        "brasero-success":       "#1A8952",
        "brasero-info":          "#1A6FBF",
        "brasero-purple":        "#7B4FBF",
        "brasero-warning":       "#F59E0B",

        // Aliases Tailwind-friendly
        background:              "#F0F2F5",
        "surface-lowest":        "#FFFFFF",
        "surface-low":           "#F8F9FA",
        "surface-container":     "#ECEEF1",
        "on-background":         "#191C1E",
        secondary:               "#5F5E5E",
        "primary-container":     "#BF391B",
        "on-primary":            "#FFFFFF",
        tertiary:                "#6437A7",
        "tertiary-container":    "#7D51C1",
        outline:                 "#8D706A",
        "on-surface-variant":    "#5A413B",
        "on-surface":            "#191C1E",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        sans:     ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        "2xl":   "0.875rem",
        "card":  "14px",
        "btn":   "10px",
        full:    "9999px",
      },
      boxShadow: {
        card:   "0 2px 8px rgba(0,0,0,0.03)",
        ember:  "0 8px 32px rgba(140,37,16,0.18)",
        "ember-sm": "0 4px 16px rgba(140,37,16,0.12)",
      },
      backgroundImage: {
        "ember-gradient":
          "linear-gradient(135deg, #8C2510 0%, #BF391B 50%, #E54D2A 100%)",
        "sidebar-gradient":
          "linear-gradient(to bottom, #111111 0%, #1A1A1A 100%)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":    "fadeIn 0.2s ease-out",
        "slide-in":   "slideIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
