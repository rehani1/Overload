/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 16px 50px rgba(17, 24, 39, 0.08)",
      },
      colors: {
        overload: {
          ink: "#13231f",
          green: "#1f6f58",
          mint: "#d9f3e7",
          blue: "#2563eb",
          amber: "#d97706",
          coral: "#dc4a38",
        },
      },
    },
  },
  plugins: [],
};
