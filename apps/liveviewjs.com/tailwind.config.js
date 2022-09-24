/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "rgba(12, 175, 186, 0.2);",
          DEFAULT: "rgba(12, 175, 186, 1)",
        },
      },
      fontFamily: {
        brand: ["LibreFranklin", "sans-serif"],
      },
    },
  },
  plugins: [],
};
