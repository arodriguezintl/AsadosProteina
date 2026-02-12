## Tailwind Config (tailwind.config.js)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'asados-dark': '#0B2B26',      // Verde Bosque (Sidebar/Textos)
        'asados-lime': '#C1FF72',      // Verde Lima (Acentos/Botones/KPIs)
        'asados-bg': '#F4F7F2',        // Gris verdoso suave (Fondo General)
        'asados-surface': '#FFFFFF',   // Blanco (Tarjetas/Widgets)
        'asados-muted': '#6B7280',     // Gris (Textos secundarios)
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 10px 40px rgba(0, 0, 0, 0.04)',
      }
    }
  }
}