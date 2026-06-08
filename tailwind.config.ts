import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        line: "#d8dee8",
        brand: "#2563eb",
        mint: "#059669",
        warn: "#f97316",
        pearl: "#f7f8fb",
        obsidian: "#0b1020",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 24, 39, 0.08)",
        premium: "0 24px 80px rgba(15, 23, 42, 0.14)",
        control: "0 12px 28px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
