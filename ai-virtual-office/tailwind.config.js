/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "ui-monospace", "monospace"] },
      colors: {
        ink: { 950: "#07080c", 900: "#0c0e14", 850: "#11141c", 800: "#161a24", 700: "#202634", 600: "#2c3446" },
      },
    },
  },
  plugins: [],
};
