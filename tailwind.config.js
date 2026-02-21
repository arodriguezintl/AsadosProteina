/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'asados-dark': '#0B2B26',      // Verde Bosque (Sidebar/Textos)
        'asados-lime': '#C1FF72',      // Verde Lima (Acentos/Botones/KPIs)
        'asados-bg': '#F4F7F2',        // Gris verdoso suave (Fondo General)
        'asados-surface': '#FFFFFF',   // Blanco (Tarjetas/Widgets)
        'asados-muted': '#6B7280',     // Gris (Textos secundarios)
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(242, 110, 33, 0.3)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
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

