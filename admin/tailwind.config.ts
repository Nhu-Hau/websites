import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
        tealCustom: "#35509A",
      },
    },
  },
  plugins: [],
} satisfies Config;


