/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}", //어디서 사용할건지를 설정
    "./components/**/*.{js,jsx,ts,tsx}", //어디서 사용할건지를 설정
  ],
  theme: {
    extend: {},
  },
  darkMode: "class", // class, media
  plugins: [require("@tailwindcss/forms"), require("tailwind-scrollbar-hide")], //npm i @tailwindcss/forms
  variants: {
    extend: {
      backgroundColor: ["group-focus"],
    },
  },
}; //<form>하면 기본적 form이 생성됨.
