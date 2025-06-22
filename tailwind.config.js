/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}", //어디서 사용할건지를 설정
    "./components/**/*.{js,jsx,ts,tsx}", //어디서 사용할건지를 설정
  ],
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  darkMode: "class", // class, media
  plugins: [require("@tailwindcss/forms")], //npm i @tailwindcss/forms
  variants: {
    extend: {
      backgroundColor: ["group-focus"],
    },
  },
}; //<form>하면 기본적 form이 생성됨.
