/* eslint global-require: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */

const defaultTheme = require("tailwindcss/defaultTheme")

module.exports = {
  purge: [
    "./layouts/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false,
  theme: {
    screens: {
      "2xs": "360px",
      xs: "480px",
      ...defaultTheme.screens,
    },
    extend: {},
  },
  variants: {
    extend: {
      backgroundColor: ["disabled"],
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
  ],
}
