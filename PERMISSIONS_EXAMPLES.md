# Ejemplos Visuales de Permisos por Rol

Este documento muestra cómo se ve el menú lateral para cada tipo de usuario.

---

## 🔴 SUPER ADMIN - Acceso Total

```
┌─────────────────────────────┐
│  Asados P.                  │
│  ERP Management             │
├─────────────────────────────┤
│  PRINCIPAL                  │
│  ✅ Inicio                  │
│  ✅ Pedidos                 │
│  ✅ Punto de Venta          │
├─────────────────────────────┤
│  OPERACIONES                │
│  ✅ Productos               │
│  ✅ Categorías Inv.         │
│  ✅ Recetas                 │
├─────────────────────────────┤
│  ADMINISTRACIÓN             │
│  ✅ Finanzas                │
│  ✅ Transacciones           │
│  ✅ Gastos                  │
│  ✅ Categorías Fin.         │
│  ✅ Reportes                │
│  ✅ Clientes                │
│  ✅ RH                      │
│  ✅ Usuarios ⭐             │
└─────────────────────────────┘
```

**Permisos especiales:**
- ⭐ **Único rol con acceso a Usuarios**
- Puede crear otros super_admins
- Control total del sistema

---

## 🟣 ADMIN - Gestión Completa (sin usuarios)

```
┌─────────────────────────────┐
│  Asados P.                  │
│  ERP Management             │
├─────────────────────────────┤
│  PRINCIPAL                  │
│  ✅ Inicio                  │
│  ✅ Pedidos                 │
│  ✅ Punto de Venta          │
├─────────────────────────────┤
│  OPERACIONES                │
│  ✅ Productos               │
│  ✅ Categorías Inv.         │
│  ✅ Recetas                 │
├─────────────────────────────┤
│  ADMINISTRACIÓN             │
│  ✅ Finanzas                │
│  ✅ Transacciones           │
│  ✅ Gastos                  │
│  ✅ Categorías Fin.         │
│  ✅ Reportes                │
│  ✅ Clientes                │
│  ✅ RH                      │
│  ❌ Usuarios (oculto)       │
└─────────────────────────────┘
```

**Diferencias con Super Admin:**
- ❌ No puede gestionar usuarios
- ✅ Todo lo demás igual que super_admin

---

## 🔵 MANAGER - Gestión Operativa

```
┌─────────────────────────────┐
│  Asados P.                  │
│  ERP Management             │
├─────────────────────────────┤
│  PRINCIPAL                  │
│  ✅ Inicio                  │
│  ✅ Pedidos                 │
│  ✅ Punto de Venta          │
├─────────────────────────────┤
│  OPERACIONES                │
│  ✅ Productos               │
│  ✅ Categorías Inv.         │
│  ✅ Recetas                 │
├─────────────────────────────┤
│  ADMINISTRACIÓN             │
│  ✅ Finanzas (solo ver) 👁️  │
│  ✅ Transacciones (ver) 👁️  │
│  ✅ Gastos (ver) 👁️         │
│  ✅ Categorías Fin. (ver)   │
│  ✅ Reportes                │
│  ✅ Clientes                │
│  ✅ RH (solo ver) 👁️        │
│  ❌ Usuarios (oculto)       │
└─────────────────────────────┘
```

**Restricciones:**
- 👁️ **Solo lectura** en Finanzas y RH
- ❌ No puede **eliminar** registros
- ✅ Puede crear y editar en operaciones

---

## 🟢 CASHIER - Operaciones Básicas

```
┌─────────────────────────────┐
│  Asados P.                  │
│  ERP Management             │
├─────────────────────────────┤
│  PRINCIPAL                  │
│  ✅ Inicio                  │
│  ✅ Pedidos (solo ver) 👁️   │
│  ✅ Punto de Venta          │
├─────────────────────────────┤
│  OPERACIONES                │
│  ✅ Productos (solo ver) 👁️ │
│  ✅ Categorías (ver) 👁️     │
│  ✅ Recetas (solo ver) 👁️   │
├─────────────────────────────┤
│  ADMINISTRACIÓN             │
│  ❌ Finanzas (oculto)       │
│  ❌ Reportes (oculto)       │
│  ✅ Clientes (solo ver) 👁️  │
│  ❌ RH (oculto)             │
│  ❌ Usuarios (oculto)       │
└─────────────────────────────┘
```

**Acceso Limitado:**
- ✅ **Puede usar POS** y crear ventas
- 👁️ **Solo lectura** en casi todo
- ❌ **Sin acceso** a Finanzas, Reportes, RH, Usuarios
- Ideal para personal de caja

---

## 📊 Comparación Rápida

| Módulo | Super Admin | Admin | Manager | Cashier |
|--------|-------------|-------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| POS | ✅ Full | ✅ Full | ✅ Full | ✅ Crear |
| Pedidos | ✅ Full | ✅ Full | ✅ Editar | 👁️ Ver |
| Inventario | ✅ Full | ✅ Full | ✅ Editar | 👁️ Ver |
| Recetas | ✅ Full | ✅ Full | ✅ Editar | 👁️ Ver |
| Finanzas | ✅ Full | ✅ Full | 👁️ Ver | ❌ Sin acceso |
| Reportes | ✅ Ver | ✅ Ver | ✅ Ver | ❌ Sin acceso |
| CRM | ✅ Full | ✅ Full | ✅ Editar | 👁️ Ver |
| RH | ✅ Full | ✅ Full | 👁️ Ver | ❌ Sin acceso |
| **Usuarios** | ✅ Full | ❌ Sin acceso | ❌ Sin acceso | ❌ Sin acceso |

**Leyenda:**
- ✅ Full = Ver, Crear, Editar, Eliminar
- ✅ Editar = Ver, Crear, Editar (sin eliminar)
- ✅ Crear = Ver, Crear (sin editar ni eliminar)
- 👁️ Ver = Solo lectura
- ❌ Sin acceso = Módulo oculto

---

## 🎯 Casos de Uso Recomendados

### Super Admin
- **Quién:** Dueño del negocio, Director General
- **Cuándo:** Configuración inicial, gestión de usuarios
- **Cantidad:** 1-2 personas máximo

### Admin
- **Quién:** Gerente General, Encargado de Sucursal
- **Cuándo:** Operaciones diarias, gestión completa
- **Cantidad:** 2-5 personas

### Manager
- **Quién:** Supervisor de Turno, Jefe de Cocina
- **Cuándo:** Supervisión operativa, reportes
- **Cantidad:** 5-10 personas

### Cashier
- **Quién:** Cajeros, Personal de Mostrador
- **Cuándo:** Atención al cliente, ventas
- **Cantidad:** Ilimitado

---

## 🔄 Flujo de Trabajo Típico

```
1. Super Admin crea usuarios
   ↓
2. Asigna roles según función
   ↓
3. Cada usuario ve solo su menú
   ↓
4. Sistema valida permisos automáticamente
   ↓
5. Acceso denegado si intenta acceder sin permisos
```

---

## 💡 Consejos de Seguridad

1. **Mínimo de Super Admins**: Solo 1-2 personas de máxima confianza
2. **Revisar Roles**: Auditar permisos cada 3-6 meses
3. **Principio de Menor Privilegio**: Dar solo lo necesario
4. **Capacitación**: Entrenar a usuarios en sus módulos
5. **Monitoreo**: Revisar logs de acceso regularmente

---

## 📝 Notas Importantes

⚠️ **Los permisos se aplican en:**
- Menú lateral (oculta opciones)
- Rutas (bloquea acceso directo)
- Botones de acción (oculta crear/editar/eliminar)

✅ **Los permisos NO se aplican en:**
- API (necesitas validación backend adicional)
- Datos en base de datos (usa RLS de Supabase)

🔒 **Para máxima seguridad:**
- Implementa Row Level Security (RLS) en Supabase
- Valida permisos también en el backend
- Usa HTTPS en producción
