/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0713',
        veil: '#150e26',
        mist: '#241a3d',
        gold: '#d9b168',
        glow: '#a78bfa',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
};
