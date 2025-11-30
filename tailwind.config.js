/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eaeaea',
          300: '#d4d4d4', // Border color equivalent
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: {
          DEFAULT: '#0070f3', // Next.js Blue
          hover: '#0060df',
          bg: '#f0f7ff',
        },
        success: {
          DEFAULT: '#0070f3', // Keeping consistent with blue for actions, or use #19caad for distinct success
          bg: '#e6fffa',
        },
        error: {
          DEFAULT: '#e00',
          bg: '#fff5f5',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0,0,0,0.02)',
        'md': '0 4px 8px rgba(0,0,0,0.04)',
        'lg': '0 8px 16px rgba(0,0,0,0.04)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderColor: {
        DEFAULT: '#eaeaea',
      }
    },
  },
  plugins: [],
}
