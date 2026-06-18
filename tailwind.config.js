/** @type {import('tailwindcss').Config} */
export default {
  // make sure these globs match your .vue files
  content: ['./index.html', 'src/**/*.{js,ts,jsx,tsx, vue}'],
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}
