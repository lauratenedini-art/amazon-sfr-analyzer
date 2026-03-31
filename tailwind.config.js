/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    // Dynamic color classes used in components
    { pattern: /bg-(blue|indigo|red|amber|emerald|green|purple|gray|violet|pink|orange|yellow|slate)-(50|100|200|500|600|700|800)/ },
    { pattern: /text-(blue|indigo|red|amber|emerald|green|purple|gray|violet|pink|orange|yellow|slate)-(100|200|400|500|600|700|800)/ },
    { pattern: /border-(blue|indigo|red|amber|emerald|green|purple|gray|violet|pink|orange|yellow|slate)-(200|300|500)/ },
    { pattern: /border-l-(blue|indigo|red|amber|emerald|green)-(500)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
