/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Roboto Mono"', 'monospace']
      },
      colors: {
        'primary-bg': 'var(--bg-primary)',
        'secondary-bg': 'var(--bg-secondary)',
        'primary-border': 'var(--border-primary)',
        'secondary-border': 'var(--border-secondary)',
        'primary-text': 'var(--text-primary)',
        'secondary-text': 'var(--text-secondary)',
        'accent': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'danger': 'var(--danger)',
        'success': 'var(--success)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-down': 'slide-down 0.5s ease-in-out forwards',
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'flicker': 'flicker 1.5s infinite',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-in-up': { from: { opacity: 0, transform: 'translateY(1rem)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)', opacity: 0.8 }, to: { transform: 'translateX(0)', opacity: 1 } },
        'slide-down': { from: { maxHeight: 0, opacity: 0, transform: 'translateY(-10px)' }, to: { maxHeight: '500px', opacity: 1, transform: 'translateY(0)' } },
        'pulse-glow': { 
          '0%, 100%': { boxShadow: '0 0 15px -5px var(--accent-primary), 0 0 5px -5px var(--accent-primary)' },
          '50%': { boxShadow: '0 0 25px 0px var(--accent-primary), 0 0 10px 0px var(--accent-primary)' }
        },
        'flicker': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}