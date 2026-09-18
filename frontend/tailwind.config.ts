import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06090e",
        surface: {
          50: "#131b28",
          100: "#0f1622",
          200: "#0b1019",
          border: "rgba(255, 255, 255, 0.08)",
          glass: "rgba(13, 19, 31, 0.75)",
        },
        brand: {
          cyan: "#00f0ff",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(0, 240, 255, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
