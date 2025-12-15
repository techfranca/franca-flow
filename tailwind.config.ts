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
        franca: {
          green: "#7DE08D",
          "green-dark": "#598F74",
          blue: "#081534",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        "franca": "0 10px 30px -5px rgba(125, 224, 141, 0.3)",
        "franca-lg": "0 20px 40px -10px rgba(125, 224, 141, 0.4)",
      },
      animation: {
        "slide-in": "slideIn 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
