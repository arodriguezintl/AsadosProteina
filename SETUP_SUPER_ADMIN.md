# Configuración Inicial - Crear Super Admin

Para poder acceder al módulo de administración de usuarios, necesitas crear al menos un usuario con rol `super_admin`.

## Opción 1: Crear Super Admin desde Supabase Dashboard (RECOMENDADO)

### Paso 1: Crear el usuario en Authentication
1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication** > **Users**
3. Click en **Add User** > **Create new user**
4. Ingresa:
   - Email: `superadmin@asadosproteina.com` (o el email que prefieras)
   - Password: Una contraseña segura
   - Auto Confirm User: ✅ (activado)
5. Click en **Create user**
6. **IMPORTANTE**: Copia el **User UID** que aparece en la lista

### Paso 2: Crear el perfil en user_profiles
1. Ve a **SQL Editor** en Supabase
2. Ejecuta el siguiente SQL (reemplaza `USER-UID-AQUI` con el UID que copiaste):

```sql
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES (
    'USER-UID-AQUI',  -- Reemplaza con el UID del usuario
    'superadmin@asadosproteina.com',  -- Mismo email que usaste
    'Super Administrador',
    'super_admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET role = 'super_admin', is_active = true;
```

3. Ejecuta el query
4. ¡Listo! Ahora puedes iniciar sesión con ese usuario

---

## Opción 2: Actualizar un usuario existente a Super Admin

Si ya tienes un usuario creado y quieres convertirlo en super_admin:

```sql
UPDATE public.user_profiles
SET role = 'super_admin'
WHERE email = 'tu-email@ejemplo.com';
```

---

## Verificar que funcionó

1. Inicia sesión en la aplicación con el email y contraseña del super_admin
2. Deberías ver el menú **"Usuarios"** en la sección de Administración
3. Al hacer click, podrás ver y gestionar todos los usuarios del sistema

---

## Roles Disponibles

- **super_admin**: Acceso completo al sistema, incluida la gestión de usuarios
- **admin**: Acceso a todas las funciones operativas (sin gestión de usuarios)
- **manager**: Gestión de operaciones diarias
- **cashier**: Operaciones básicas de punto de venta

---

## Notas de Seguridad

⚠️ **IMPORTANTE**: 
- Solo crea usuarios super_admin para personas de máxima confianza
- Usa contraseñas seguras (mínimo 8 caracteres, con mayúsculas, minúsculas y números)
- Mantén el email del super_admin en secreto
- Considera habilitar autenticación de dos factores (2FA) en Supabase para mayor seguridad
