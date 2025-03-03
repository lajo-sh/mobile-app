/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,css}",
    "components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: "#f42e2e",
        text: "#f3f3f3",
        "primary-background": "#020202",
        "secondary-background": "#111112",
        "tertiary-background": "#1a1a1b",
      },
    },
  },
  plugins: [],
};
