/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        neu: {
          base: '#EEF1F6',
          'base-dark': '#2D3748', // Dark cooling gray
          dark: '#D1D9E6',
          light: '#FFFFFF',
          text: '#7D8CA3',
          'text-dark': '#CBD5E0',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      boxShadow: {
        'neu-flat': '9px 9px 16px rgb(209, 217, 230, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 6px 6px 10px 0 rgb(209, 217, 230, 0.8), inset -6px -6px 10px 0 rgba(255, 255, 255, 0.8)',
        'neu-icon': '5px 5px 10px rgb(209, 217, 230, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.8)',
        
        // Dark Mode Shadows
        'neu-flat-dark': '5px 5px 10px #1a202c, -5px -5px 10px #404e67',
        'neu-pressed-dark': 'inset 5px 5px 10px #1a202c, inset -5px -5px 10px #404e67',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}