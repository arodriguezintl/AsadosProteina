# Solución Rápida - Menú No Se Ve

Si no ves nada en el menú lateral, es porque tu usuario no tiene un perfil en la tabla `user_profiles`.

## Solución Temporal (Para Desarrollo)

El sistema ahora usa **'admin'** como rol por defecto si no encuentra un perfil. Esto significa que deberías ver casi todos los módulos excepto "Usuarios".

## Solución Permanente

### Opción 1: Crear perfil manualmente en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Authentication** > **Users**
3. Copia el **User UID** de tu usuario
4. Ve a **SQL Editor**
5. Ejecuta este SQL (reemplaza `TU-USER-UID` con el UID que copiaste):

```sql
-- Crear perfil de usuario
INSERT INTO public.user_profiles (id, email, full_name, role, is_active, store_id)
VALUES (
    'TU-USER-UID',  -- Reemplaza con tu User UID
    'tu-email@ejemplo.com',  -- Tu email
    'Tu Nombre',
    'admin',  -- o 'super_admin' para acceso completo
    true,
    '00000000-0000-0000-0000-000000000001'  -- ID de tienda por defecto
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_active = true;
```

### Opción 2: Verificar en la consola del navegador

1. Abre la aplicación en el navegador (http://localhost:5174)
2. Abre las **Herramientas de Desarrollador** (F12)
3. Ve a la pestaña **Console**
4. Busca estos mensajes:
   - `🔐 Auth Debug:` - Te dirá si encontró tu perfil
   - `✅ User Role:` - Te dirá qué rol se asignó
   - `📋 Menu Permissions:` - Te dirá qué permisos tienes

### Opción 3: Crear usuario super_admin

Si quieres acceso completo (incluyendo gestión de usuarios):

```sql
-- Primero crea el usuario en Authentication > Users
-- Luego ejecuta esto con su UID:

INSERT INTO public.user_profiles (id, email, full_name, role, is_active, store_id)
VALUES (
    'TU-USER-UID',
    'superadmin@asadosproteina.com',
    'Super Administrador',
    'super_admin',  -- ⭐ Acceso total
    true,
    '00000000-0000-0000-0000-000000000001'
);
```

## Verificar que Funcionó

Después de crear el perfil:

1. **Recarga la página** (F5)
2. Deberías ver en la consola:
   ```
   🔐 Auth Debug: { userId: "...", email: "...", profile: {...} }
   ✅ User Role: admin
   📋 Menu Permissions: { role: "admin", canViewDashboard: true, ... }
   ```
3. El menú lateral debería mostrar todos los módulos según tu rol

## Roles Disponibles

- **`super_admin`** - Ve TODO (incluyendo Usuarios)
- **`admin`** - Ve TODO excepto Usuarios
- **`manager`** - Ve todo pero con restricciones
- **`cashier`** - Solo POS y consultas básicas

## Si Aún No Funciona

1. Verifica que la tabla `user_profiles` existe:
   ```sql
   SELECT * FROM public.user_profiles;
   ```

2. Verifica que tu usuario existe en Auth:
   - Ve a **Authentication** > **Users** en Supabase

3. Verifica los logs en la consola del navegador

4. Si ves errores, compártelos conmigo para ayudarte mejor
