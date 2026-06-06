/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        overload: {
          background: "#EEF8FB",
          "background-warm": "#F7F1E6",
          border: "#D6E4EA",
          "border-strong": "#BED2DB",
          coral: "#D9857B",
          "coral-muted": "#F8DFD8",
          cream: "#FFF9EF",
          indigo: "#30245F",
          lavender: "#DCD5FF",
          muted: "#6B7584",
          navy: "#17213B",
          nutrition: "#D76D6D",
          sky: "#DDF2F8",
          surface: "#FFFCF6",
          violet: "#7B6BC8",
          workout: "#4EBC7B",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(48, 36, 95, 0.12)",
      },
    },
  },
  plugins: [],
};
