# Estructura Jerárquica de Permisos (RBAC)

Este documento detalla los niveles de acceso y permisos por rol para cada módulo del sistema ERP Asados Proteína.
El control de acceso se implementa a nivel de base de datos utilizando **Row Level Security (RLS)** de PostgreSQL.

## Roles del Sistema

| Rol | Descripción | Nivel de Acceso |
| :--- | :--- | :--- |
| **Super Admin** | Acceso total al sistema y todas las tiendas. | Global (Multi-tienda) |
| **Admin** | Administrador de una sucursal específica. | Tienda (Total) |
| **Manager** | Gerente operativo de sucursal. | Tienda (Operativo) |
| **Accountant** | Contador o auxiliar administrativo. | Tienda (Finanzas/RRHH) |
| **Cashier** | Cajero / Vendedor. | Tienda (Ventas/Clientes) |
| **Cook** | Cocinero / Jefe de Cocina. | Tienda (Cocina/Inventario) |
| **Delivery** | Repartidor. | Tienda (Entregas) |

---

## Matriz de Permisos por Módulo

### 1. Inventario y Productos
*Tablas: `inventory.products`, `inventory.categories`, `inventory.movements`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Productos** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gest. Productos** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ver Categorías** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gest. Categorías**| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reg. Movimientos**| ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

> **Nota**: Los movimientos de inventario (entradas/salidas) pueden ser registrados por cajeros (ventas) y cocineros (mermas/uso), pero solo Admins/Managers gestionan el catálogo.

### 2. Recetas
*Tablas: `recipes.recipes`, `recipes.recipe_ingredients`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Recetas** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gest. Recetas** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3. Ventas y Punto de Venta (POS)
*Tablas: `sales.orders`, `sales.order_items`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Órdenes** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Crear/Edit Órdenes**| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### 4. Clientes (CRM)
*Tablas: `crm.customers`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Clientes** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gest. Clientes** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 5. Recursos Humanos
*Tablas: `hr.employees`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Empleados** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Gest. Empleados** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 6. Finanzas
*Tablas: `finance.transactions`*

| Acción | Super Admin | Admin | Manager | Cashier | Cook | Delivery | Accountant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Finanzas** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Gest. Finanzas** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7. Usuarios y Tiendas
*Tablas: `public.user_profiles`, `public.stores`*

- **Super Admin**: Control total sobre usuarios y tiendas.
- **Admin/Manager**: Pueden ver los perfiles de usuario de SU tienda.
- **Todos**: Pueden ver su propio perfil y la información básica de la tienda asignada.

---

## Implementación Técnica
La seguridad se fuerza a nivel de base de datos. Ejemplo de política RLS para productos:

```sql
CREATE POLICY "Manage products" ON inventory.products
  FOR ALL USING (
    public.get_my_role() = 'super_admin' OR
    (public.get_my_role() IN ('admin', 'manager') AND store_id = public.get_my_store())
  );
```
Esto asegura que incluso si la API es consultada directamente, un usuario solo puede realizar acciones permitidas por su rol.
