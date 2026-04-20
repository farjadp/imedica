// ============================================================================
// File: apps/web/tailwind.config.js
// Version: 1.0.0 — 2026-04-20
// Why: Tailwind CSS configuration. Defines brand colors, dark-mode 
//      surface colors, and custom Framer Motion keyframe animations.
// Env / Identity: Build Step (Tailwind/PostCSS)
// ============================================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          400: '#38bdf8', // Light Cyan (sky-400)
          500: '#06b6d4', // Cyan (cyan-500)
          600: '#0d9488', // Teal (teal-600)
          900: '#115e59', // Dark Teal
        },
        surface: '#0f172a', // Deep Slate backgrounds
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
