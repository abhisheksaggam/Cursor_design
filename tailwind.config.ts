import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        variable: {
          blue: "#2563eb",
          "blue-hover": "#1d4ed8",
          green: "#16a34a",
          "green-hover": "#15803d",
          purple: "#9333ea",
          "purple-hover": "#7e22ce",
          orange: "#ea580c",
          "orange-hover": "#c2410c",
          pink: "#ec4899",
          "pink-hover": "#db2777",
          soft: {
            blue: "#dbeafe",
            green: "#dcfce7",
            purple: "#f3e8ff",
            orange: "#ffedd5",
            pink: "#fce7f3"
          }
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f7f7f8",
          muted: "#eeeef1"
        },
        ink: {
          DEFAULT: "#111118",
          soft: "#4a4a55",
          muted: "#8a8a95"
        },
        accent: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff"
        },
        success: {
          DEFAULT: "#16a34a",
          soft: "#ecfdf5"
        },
        warning: {
          DEFAULT: "#b45309",
          soft: "#fef3c7"
        },
        danger: {
          DEFAULT: "#b91c1c",
          soft: "#fee2e2"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 17, 24, 0.04), 0 4px 12px rgba(17, 17, 24, 0.04)"
      }
    }
  },
  plugins: []
};

export default config;
