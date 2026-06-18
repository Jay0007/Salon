// postcss.config.js
import tailwindPostcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindPostcss(), // ← the new Tailwind PostCSS plugin
    autoprefixer() // ← autoprefixer
  ]
}
