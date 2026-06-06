/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        overload: {
          background: "#EEF8FB",
          border: "#D6E4EA",
          coral: "#D9857B",
          cream: "#FFF9EF",
          indigo: "#30245F",
          lavender: "#DCD5FF",
          muted: "#6B7584",
          navy: "#17213B",
          sky: "#DDF2F8",
          surface: "#FFFCF6",
          violet: "#7B6BC8",
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
