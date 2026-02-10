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
        background: "var(--background)",
        foreground: "var(--foreground)",
        poolGreen: "#0D5C2C",
        poolFelt: "#1B7A43",
        dangerZone: "#FF4500",
        warningZone: "#FFA500",
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FFA500, 0 0 10px #FFA500' },
          '100%': { boxShadow: '0 0 20px #FF4500, 0 0 40px #FF4500' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
