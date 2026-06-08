/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 14px 30px rgba(48, 36, 95, 0.12)",
        soft: "0 10px 24px rgba(48, 36, 95, 0.12)",
      },
      colors: {
        overload: {
          background: "#EEF8FB",
          "background-warm": "#F7F1E6",
          surface: "#FFFCF6",
          "surface-muted": "#F4F7F5",
          elevated: "#FFFFFF",
          ink: "#17213B",
          muted: "#6B7584",
          border: "#D6E4EA",
          "border-strong": "#BED2DB",
          primary: "#30245F",
          "primary-muted": "#E6E0FF",
          accent: "#7B6BC8",
          "accent-muted": "#EFEAFF",
          coral: "#D9857B",
          "coral-muted": "#F8DFD8",
          danger: "#C85C5C",
          "danger-muted": "#F8DEDE",
          success: "#3B9D70",
          "success-muted": "#DDF3E8",
          nutrition: "#D76D6D",
          workout: "#4EBC7B",
          onPrimary: "#FFFCF6",
          green: "#3B9D70",
          mint: "#DDF3E8",
          blue: "#7B6BC8",
          amber: "#D9857B",
        },
      },
    },
  },
  plugins: [],
};
