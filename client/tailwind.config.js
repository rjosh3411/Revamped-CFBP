/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          dark: '#0a1018',
          card: '#121a24',
          cardHover: '#182332',
          border: '#223246',
          accent: '#22c55e',
          gold: '#f59e0b',
          crimson: '#991b1b',
          navy: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Teko', 'Impact', 'Arial Black', 'sans-serif']
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        'turf-gradient': "linear-gradient(to bottom, #0d1722, #070b10)"
      }
    },
  },
  plugins: [],
}
