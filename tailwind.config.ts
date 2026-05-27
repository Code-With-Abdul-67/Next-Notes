import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    nextui({
      addCommonColors: true,
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#040209", // Darkest violet-black
            foreground: "#F4F2F7",
            primary: {
              DEFAULT: "#8B5CF6", // Vivid Purple
              foreground: "#FFFFFF",
            },
            focus: "#8B5CF6",
          },
        },
      },
    }),
  ],
};

export default config;
