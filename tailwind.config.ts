import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#4D869C",
        heading: "#171A1F",
        subHeading: "#9095A0",
        placeholder: "#BCC1CA",
        stroke: "#BCC1CA",
        success: "#10BC17",
        error: "#913838",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        archivo: ["Archivo"],
      },
      boxShadow: {
        button: "0 5px 10px 0 rgba(0, 0, 0, 0.15)",
        buttonHover: "0 3px 6px 0 rgba(0, 0, 0, 0.15)",
        card: "0 0 2px 0 rgba(23, 26, 31, 0.12)",
      },
      keyframes: {
        "border-gradient": {
          "0%": { borderColor: "rgb(29, 78, 216)" }, // blue
          "50%": { borderColor: "rgb(126, 34, 206)" }, // yellow
          "75%": { borderColor: "rgb(219, 39, 119)" }, // pink
          "100%": { borderColor: "rgb(29, 78, 216)" }, // blue
        },
        "background-gradient": {
          "0%": { background: "rgb(29, 78, 216)" }, // blue
          "50%": { background: "rgb(126, 34, 206)" }, // yellow
          "75%": { background: "rgb(219, 39, 119)" }, // pink
          "100%": { background: "rgb(29, 78, 216)" }, // blue
        },
      },
      animation: {
        "border-gradient": "border-gradient 4s infinite linear",
        "background-gradient": "background-gradient 4s infinite linear",
      },
    },
  },
  plugins: [],
};
export default config;
