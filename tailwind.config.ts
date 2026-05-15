import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "serif"],
      },
      colors: {
        earth: {
          cream: "#f5f1e8",
          beige: "#e8ddd4",
          tan: "#d4c4b0",
          terracotta: "#c97d60",
          sage: "#9caf88",
          brown: "#8b6f47",
          dark: "#5d4e37",
          charcoal: "#3a3428",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
