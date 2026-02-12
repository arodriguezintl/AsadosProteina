# Sistema de Permisos por Módulo

Este documento explica cómo funciona el sistema de permisos y cómo habilitar/deshabilitar módulos para cada rol de usuario.

---

## 📋 Tabla de Permisos por Rol

### **Super Admin** (super_admin)
✅ **Acceso Completo** a todos los módulos con todos los permisos (view, create, edit, delete)

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | - | - | - |
| POS | ✅ | ✅ | ✅ | ✅ |
| Pedidos | ✅ | ✅ | ✅ | ✅ |
| Inventario | ✅ | ✅ | ✅ | ✅ |
| Recetas | ✅ | ✅ | ✅ | ✅ |
| Finanzas | ✅ | ✅ | ✅ | ✅ |
| Reportes | ✅ | - | - | - |
| CRM | ✅ | ✅ | ✅ | ✅ |
| RH | ✅ | ✅ | ✅ | ✅ |
| **Usuarios** | ✅ | ✅ | ✅ | ✅ |

---

### **Administrador** (admin)
✅ Acceso completo **excepto** gestión de usuarios

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | - | - | - |
| POS | ✅ | ✅ | ✅ | ✅ |
| Pedidos | ✅ | ✅ | ✅ | ✅ |
| Inventario | ✅ | ✅ | ✅ | ✅ |
| Recetas | ✅ | ✅ | ✅ | ✅ |
| Finanzas | ✅ | ✅ | ✅ | ✅ |
| Reportes | ✅ | - | - | - |
| CRM | ✅ | ✅ | ✅ | ✅ |
| RH | ✅ | ✅ | ✅ | ✅ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |

---

### **Gerente** (manager)
✅ Gestión operativa con algunas restricciones

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | - | - | - |
| POS | ✅ | ✅ | ✅ | ❌ |
| Pedidos | ✅ | ✅ | ✅ | ❌ |
| Inventario | ✅ | ✅ | ✅ | ❌ |
| Recetas | ✅ | ✅ | ✅ | ❌ |
| Finanzas | ✅ | ❌ | ❌ | ❌ |
| Reportes | ✅ | - | - | - |
| CRM | ✅ | ✅ | ✅ | ❌ |
| RH | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |

---

### **Cajero** (cashier)
✅ Acceso básico para operaciones de punto de venta

| Módulo | Ver | Crear | Editar | Eliminar |
|--------|-----|-------|--------|----------|
| Dashboard | ✅ | - | - | - |
| POS | ✅ | ✅ | ❌ | ❌ |
| Pedidos | ✅ | ❌ | ❌ | ❌ |
| Inventario | ✅ | ❌ | ❌ | ❌ |
| Recetas | ✅ | ❌ | ❌ | ❌ |
| Finanzas | ❌ | ❌ | ❌ | ❌ |
| Reportes | ❌ | ❌ | ❌ | ❌ |
| CRM | ✅ | ❌ | ❌ | ❌ |
| RH | ❌ | ❌ | ❌ | ❌ |
| Usuarios | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 Cómo Modificar Permisos

### 1. Editar Configuración de Permisos

Abre el archivo: `src/config/permissions.ts`

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Record<ModuleName, Permission[]>> = {
    cashier: {
        dashboard: ['view'],
        pos: ['view', 'create'], // Cajero puede usar POS
        orders: ['view'],        // Solo ver pedidos
        inventory: ['view'],     // Solo ver inventario
        recipes: ['view'],       // Solo ver recetas
        finance: [],             // ❌ SIN ACCESO a finanzas
        reports: [],             // ❌ SIN ACCESO a reportes
        crm: ['view'],           // Solo ver clientes
        hr: [],                  // ❌ SIN ACCESO a RH
        users: [],               // ❌ SIN ACCESO a usuarios
    },
    // ... otros roles
}
```

### 2. Tipos de Permisos Disponibles

- **`'view'`** - Ver/Leer información
- **`'create'`** - Crear nuevos registros
- **`'edit'`** - Editar registros existentes
- **`'delete'`** - Eliminar registros

### 3. Ejemplos de Modificación

#### Ejemplo 1: Dar acceso a Finanzas al Gerente (solo lectura)
```typescript
manager: {
    // ... otros módulos
    finance: ['view'], // ✅ Ahora puede ver finanzas
}
```

#### Ejemplo 2: Permitir que Cajero edite pedidos
```typescript
cashier: {
    // ... otros módulos
    orders: ['view', 'edit'], // ✅ Ahora puede editar pedidos
}
```

#### Ejemplo 3: Quitar acceso a RH para Manager
```typescript
manager: {
    // ... otros módulos
    hr: [], // ❌ Sin acceso a RH
}
```

---

## 💻 Uso en el Código

### 1. Proteger una Página Completa

```typescript
import { ProtectedModule } from '@/components/auth/ProtectedModule'

export default function FinancePage() {
    return (
        <ProtectedModule module="finance">
            {/* Contenido de la página */}
        </ProtectedModule>
    )
}
```

### 2. Usar el Hook de Permisos

```typescript
import { usePermissions } from '@/hooks/usePermissions'

export default function ProductsPage() {
    const { canView, canCreate, canEdit, canDelete } = usePermissions('inventory')

    return (
        <div>
            {canView && <ProductList />}
            {canCreate && <Button>Nuevo Producto</Button>}
            {canEdit && <EditButton />}
            {canDelete && <DeleteButton />}
        </div>
    )
}
```

### 3. Verificar Acceso Manualmente

```typescript
import { hasModuleAccess, hasPermission } from '@/config/permissions'
import { useAuthStore } from '@/store/auth.store'

const { role } = useAuthStore()

// Verificar acceso al módulo
if (hasModuleAccess(role, 'finance')) {
    // Usuario tiene acceso a finanzas
}

// Verificar permiso específico
if (hasPermission(role, 'inventory', 'delete')) {
    // Usuario puede eliminar en inventario
}
```

---

## 🎯 Comportamiento del Sistema

### Menú Lateral
- **Se ocultan automáticamente** los módulos a los que el usuario no tiene acceso
- **Se agrupan por secciones** solo si hay al menos un módulo visible en esa sección

### Rutas Protegidas
- Si un usuario intenta acceder directamente a una URL sin permisos, ve un mensaje de "Acceso Denegado"
- Se puede personalizar el mensaje de error

### Botones y Acciones
- Los botones de crear/editar/eliminar se pueden ocultar según los permisos
- Usa el hook `usePermissions` para controlar la visibilidad

---

## 🔒 Mejores Prácticas

1. **Principio de Menor Privilegio**: Da solo los permisos necesarios
2. **Revisar Regularmente**: Audita los permisos periódicamente
3. **Documentar Cambios**: Anota por qué se dieron ciertos permisos
4. **Probar con Diferentes Roles**: Verifica que cada rol funcione correctamente
5. **Proteger Rutas Sensibles**: Siempre usa `ProtectedModule` en páginas importantes

---

## 📝 Resumen

✅ **Archivo de configuración**: `src/config/permissions.ts`  
✅ **Hook de permisos**: `usePermissions(module)`  
✅ **Componente protector**: `<ProtectedModule module="...">`  
✅ **Funciones helper**: `hasModuleAccess()`, `hasPermission()`  

**Para cambiar permisos**: Edita `ROLE_PERMISSIONS` en `permissions.ts` y reinicia el servidor de desarrollo.
