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
        mint: "#10b981",
        warn: "#f97316",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
