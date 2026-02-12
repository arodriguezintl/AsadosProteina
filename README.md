# 🥩 Asados Proteína - Sistema ERP

Sistema de gestión empresarial (ERP) completo para la cadena de restaurantes Asados Proteína. Desarrollado con React, TypeScript, Vite y Supabase.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.6-3178c6.svg)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Despliegue](#-despliegue)
- [Documentación](#-documentación)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### **Módulos Principales**

- 📊 **Dashboard**: Panel de control con métricas en tiempo real
- 🛒 **Punto de Venta (POS)**: Sistema completo de ventas
- 📦 **Inventario**: Gestión de productos y stock
- 🍽️ **Recetas**: Control de ingredientes y costos
- 🚚 **Pedidos**: Seguimiento de órdenes y entregas
- 👥 **CRM**: Gestión de clientes y fidelización
- 💼 **Recursos Humanos**: Empleados, turnos y nómina
- 💰 **Finanzas**: Control de ingresos, gastos y reportes
- 🔐 **Administración**: Gestión de usuarios y permisos

### **Sistema de Permisos**

- **4 niveles de roles**: Super Admin, Admin, Manager, Cashier
- **Control granular**: View, Create, Edit, Delete por módulo
- **Menú dinámico**: Se adapta según permisos del usuario
- **Protección de rutas**: Acceso restringido por rol

### **Características Técnicas**

- ⚡ **Rendimiento**: Optimizado con Vite y React
- 🎨 **UI/UX**: Diseño moderno con Tailwind CSS y Shadcn UI
- 🔒 **Seguridad**: Autenticación con Supabase Auth
- 📱 **Responsive**: Funciona en desktop, tablet y móvil
- 🌐 **Real-time**: Actualizaciones en tiempo real con Supabase
- 📈 **Gráficos**: Visualización de datos con Recharts

---

## 🛠️ Tecnologías

### **Frontend**
- [React 18](https://react.dev/) - Biblioteca de UI
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Vite](https://vitejs.dev/) - Build tool y dev server
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Shadcn UI](https://ui.shadcn.com/) - Componentes de UI
- [Recharts](https://recharts.org/) - Gráficos y visualizaciones
- [Lucide React](https://lucide.dev/) - Iconos
- [React Router](https://reactrouter.com/) - Navegación

### **Backend & Database**
- [Supabase](https://supabase.com/) - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Edge Functions
  - Storage

### **State Management**
- [Zustand](https://zustand-demo.pmnd.rs/) - Gestión de estado global

---

## 📦 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **yarn** >= 1.22.0
- **Git**
- Cuenta en [Supabase](https://supabase.com)

---

## 🚀 Instalación

### **1. Clonar el repositorio**

```bash
git clone https://github.com/TU-USUARIO/asados-proteina-erp.git
cd asados-proteina-erp
```

### **2. Instalar dependencias**

```bash
npm install
```

### **3. Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Para obtener estas claves:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings > API
3. Copia **Project URL** y **anon/public key**

### **4. Configurar la base de datos**

Ejecuta las migraciones SQL en Supabase SQL Editor:

```bash
# En orden:
1. 001_initial_schema.sql
2. 002_products_and_categories.sql
3. 003_recipes.sql
4. 004_orders.sql
5. 005_hr_and_finance.sql
6. 006_user_profiles_update.sql
```

### **5. Crear tu primer usuario**

Sigue las instrucciones en `SETUP_SUPER_ADMIN.md` o usa `create_user_profile.sql`

---

## ⚙️ Configuración

### **Desarrollo Local**

```bash
# Iniciar servidor de desarrollo
npm run dev

# La app estará disponible en http://localhost:5174
```

### **Build para Producción**

```bash
# Crear build optimizado
npm run build

# Preview del build
npm run preview
```

### **Linting**

```bash
# Ejecutar ESLint
npm run lint
```

---

## 💻 Uso

### **Iniciar Sesión**

1. Ve a `http://localhost:5174`
2. Ingresa tu email
3. Recibirás un código OTP por email
4. Ingresa el código para acceder

### **Roles y Permisos**

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Super Admin** | Control total del sistema | Todos los módulos + Gestión de usuarios |
| **Admin** | Administrador de tienda | Todos los módulos excepto usuarios |
| **Manager** | Gerente operativo | Operaciones diarias con restricciones |
| **Cashier** | Cajero | Solo POS y consultas básicas |

### **Modificar Permisos**

Edita `src/config/permissions.ts`:

```typescript
export const ROLE_PERMISSIONS: RolePermissions = {
    manager: {
        finance: ['view', 'create'], // Ahora puede crear en finanzas
    }
}
```

---

## 📁 Estructura del Proyecto

```
asados-proteina/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── layout/         # Layout y navegación
│   │   └── ui/             # Componentes UI (Shadcn)
│   ├── config/             # Configuración
│   │   └── permissions.ts  # Sistema de permisos
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilidades y configuración
│   │   └── supabase.ts     # Cliente de Supabase
│   ├── pages/              # Páginas de la aplicación
│   │   ├── admin/          # Módulo de administración
│   │   ├── finance/        # Módulo de finanzas
│   │   ├── hr/             # Recursos humanos
│   │   └── ...
│   ├── services/           # Servicios y lógica de negocio
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos de TypeScript
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Entry point
├── supabase/
│   └── functions/          # Edge Functions
│       └── create-user/    # Función para crear usuarios
├── public/                 # Archivos estáticos
├── *.sql                   # Migraciones de base de datos
├── *.md                    # Documentación
└── package.json
```

---

## 🌐 Despliegue

### **Vercel (Recomendado)**

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

Ver guía completa: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### **Netlify**

Similar a Vercel, con despliegue automático desde GitHub.

### **Edge Functions**

```bash
# Login en Supabase CLI
npx supabase login

# Desplegar función
npx supabase functions deploy create-user --project-ref TU-PROJECT-ID
```

---

## 📚 Documentación

- [PERMISSIONS_GUIDE.md](./PERMISSIONS_GUIDE.md) - Sistema de permisos
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de despliegue
- [HOW_TO_CREATE_USERS.md](./HOW_TO_CREATE_USERS.md) - Crear usuarios
- [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) - Resumen del proyecto
- [TROUBLESHOOTING_MENU.md](./TROUBLESHOOTING_MENU.md) - Solución de problemas

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/TU-USUARIO/asados-proteina-erp/issues) con:

- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots (si aplica)
- Información del navegador/sistema

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [TU-USUARIO](https://github.com/TU-USUARIO)

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el excelente BaaS
- [Shadcn UI](https://ui.shadcn.com/) por los componentes
- [Vercel](https://vercel.com) por el hosting
- La comunidad de React y TypeScript

---

## 📞 Contacto

- **Email**: tu-email@ejemplo.com
- **Website**: https://asadosproteina.com
- **GitHub**: [@TU-USUARIO](https://github.com/TU-USUARIO)

---

## 🗺️ Roadmap

- [ ] Implementar notificaciones push
- [ ] App móvil con React Native
- [ ] Integración con sistemas de pago
- [ ] Reportes avanzados con IA
- [ ] Multi-idioma (i18n)
- [ ] Modo offline
- [ ] Integración con WhatsApp Business

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**

---

_Última actualización: 11 de Febrero, 2026_