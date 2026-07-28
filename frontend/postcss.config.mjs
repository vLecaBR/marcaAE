/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Mudamos de 'tailwindcss' para '@tailwindcss/postcss'
    autoprefixer: {},
  },
};

export default config;