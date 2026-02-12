# PROMPT MAESTRO - ERP LUNCHES SALUDABLES

## CONTEXTO
Construir ERP cloud para negocio de lunches saludables en Guanajuato, México.
- 200+ órdenes/día, 15 productos, 10 empleados
- Gestión actual: Excel/papel (informal)
- Nómina: semanal (Ley Federal del Trabajo MX)
- Pagos: efectivo, transferencia
- Pedidos: teléfono, WhatsApp

## STACK
Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
Backend: Supabase (PostgreSQL + Auth + Realtime)
Idioma: Español (es-MX)
Moneda: MXN

## ARQUITECTURA
Multi-tenant (store_id en todas las tablas)
RLS estricto (super_admin, admin, cashier, cook, delivery, accountant)
Real-time en: órdenes, inventario, dashboard

## MÓDULOS (Prioridad)
1. **PoS** (crítico): carrito rápido, efectivo/transferencia, ticket
2. **Inventario**: productos, stock, alertas, descuento al vender
3. **Delivery**: órdenes, estados, asignación repartidor
4. **CRM**: clientes, direcciones, historial
5. **Recetas**: ingredientes, costeo automático
6. **RRHH**: empleados, check-in/out, asistencias
7. **Nómina**: semanal, ISR/IMSS, recibos PDF
8. **Finanzas**: ingresos/egresos, flujo caja, P&L
9. **Dashboard**: ventas, inventario crítico, asistencias
10. **Admin**: usuarios, permisos granulares, tiendas

## REQUISITOS TÉCNICOS
- PoS ultra-rápido (< 3 clicks por orden)
- Mobile-responsive (tablets en tienda)
- Offline-first en PoS (sync cuando haya conexión)
- Validaciones Zod en formularios
- Manejo de errores user-friendly
- Formato de moneda: $1,234.56 MXN
- Fechas: DD/MM/YYYY
- Zona horaria: America/Mexico_City

## SEGURIDAD
- RLS en todas las tablas
- Validación backend + frontend
- Encriptación de datos sensibles (nómina)
- Rate limiting en Edge Functions
- Audit logs en acciones críticas

## BASE DE DATOS
Esquemas: auth, public, inventory, recipes, sales, delivery, crm, hr, payroll, finance
Políticas RLS:
- super_admin: acceso total
- admin: solo su tienda
- cashier: solo PoS
- cook: solo órdenes y recetas
- delivery: solo entregas asignadas
- accountant: solo finanzas/nómina

Índices en: store_id, created_at, status, employee_id, customer_id

## UX PRINCIPLES
- Español claro (no tecnicismos innecesarios)
- Feedback inmediato (toast notifications)
- Confirmaciones en acciones destructivas
- Shortcuts de teclado en PoS
- Colores semánticos (verde=éxito, rojo=error, amarillo=advertencia)

## PLAN DE DESARROLLO
Semana 1: Auth + PoS básico
Semana 2: Inventario + Delivery
Semana 3: CRM + Dashboard
Semana 4: Recetas
Semana 5: RRHH
Semana 6: Nómina
Semana 7: Finanzas
Semana 8: Multi-tenant
Semana 9: Admin Panel
Semana 10: Deploy + Testing

## ENTREGABLES
- Código TypeScript tipado
- Componentes reutilizables
- Tests unitarios (funciones críticas)
- README por módulo
- Commits atómicos en español

## COMANDOS ÚTILES
npm create vite@latest erp-lunches -- --template react-ts
npm install @supabase/supabase-js zustand react-query react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx shadcn-ui@latest init

## READY TO BUILD
Confirma stack y comienza por Sprint 1: Auth + PoS básico.
```

---

## Estructura del Repositorio GitHub
```
erp-lunches-saludables/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── layout/
│   │   ├── pos/
│   │   ├── inventory/
│   │   ├── delivery/
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── hooks/
│   ├── pages/
│   ├── stores/ (Zustand)
│   ├── i18n/
│   └── App.tsx
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
├── docs/
│   ├── database-schema.md
│   ├── user-manual.md
│   └── api-docs.md
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md