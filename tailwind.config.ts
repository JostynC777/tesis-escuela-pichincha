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
        institutional: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#c7d9fe",
          300: "#a0befe",
          400: "#7096fb",
          500: "#486df5",
          600: "#2d4beb",
          700: "#1e37d6",
          800: "#1a2dad",
          900: "#1b2b88",
          950: "#121953",
        },
      },
    },
  },
  plugins: [],
};

export default config;
