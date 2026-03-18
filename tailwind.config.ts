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
        brand: {
          ink: "#0d0a14",
          navy: "#0e2a47",
          purple: "#5227FF",
          pink: "#FF9FFC",
          lilac: "#B19EEF",
          teal: "#27FFC8",
        },
        surface: {
          0: "#ffffff",
          1: "#f5f7fb",
          2: "#eef2ff",
        },
      },
      boxShadow: {
        glowTeal: "0 0 20px rgba(39,255,200,0.25)",
        glowPurple: "0 0 28px rgba(82,39,255,0.18)",
        card: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "26px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-40%)" },
          "100%": { transform: "translateX(140%)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
