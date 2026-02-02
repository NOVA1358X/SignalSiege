/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00ffff',
        'neon-magenta': '#ff00ff',
        'neon-green': '#00ff88',
        'neon-blue': '#0088ff',
        'neon-yellow': '#ffff00',
        'neon-orange': '#ff8800',
        'neon-red': '#ff0044',
        'neon-purple': '#aa00ff',
        'neon-pink': '#ff00aa',
        'panel': '#0a0a0f',
        'panel-light': '#12121a',
        'panel-border': '#1f1f2e',
        // Dark color palette for backgrounds
        'dark': {
          500: '#1a1a24',
          600: '#14141c',
          700: '#0f0f16',
          800: '#0a0a0f',
          900: '#050508',
        },
      },
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'signal': 'signal 1s ease-out forwards',
        'circuit-flow': 'circuit-flow 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        signal: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
          '100%': { opacity: '0', transform: 'scale(1.2)' },
        },
        'circuit-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
      },
      backgroundImage: {
        'circuit-pattern': `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'circuit': '20px 20px',
      },
    },
  },
  plugins: [],
}
