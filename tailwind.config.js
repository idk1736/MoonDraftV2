/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        moon: {
          light: "#C2A8FF",
          DEFAULT: "#8B5CF6",
          dark: "#5B21B6"
        },
        sky: {
          light: "#7DD3FC",
          DEFAULT: "#38BDF8",
          dark: "#0369A1"
        },
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0,0,0,0.1)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [],
}
