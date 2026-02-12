# Cómo Crear Usuarios en el Sistema

## ⚠️ Limitación Actual

Por razones de seguridad, la creación de usuarios desde el frontend requiere permisos especiales (service_role key) que no pueden exponerse en el navegador.

**Actualmente, los usuarios deben crearse manualmente en Supabase Dashboard.**

---

## 📋 Proceso para Crear un Usuario

### **Paso 1: Crear el Usuario en Authentication**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Authentication** > **Users**
3. Click en **"Add User"** > **"Create new user"**
4. Completa el formulario:
   - **Email**: El email del nuevo usuario
   - **Password**: Una contraseña segura (mínimo 8 caracteres)
   - **Auto Confirm User**: ✅ **ACTIVAR** (importante)
5. Click en **"Create user"**
6. **IMPORTANTE**: Copia el **User UID** que aparece en la lista

---

### **Paso 2: Crear el Perfil del Usuario**

1. Ve a **SQL Editor** en Supabase
2. Copia y pega este SQL (reemplaza los valores):

```sql
INSERT INTO public.user_profiles (id, email, full_name, role, is_active, store_id)
VALUES (
    'PEGA-AQUI-EL-USER-UID',  -- ⚠️ Reemplazar con el UID del paso 1
    'email@ejemplo.com',       -- ⚠️ Mismo email que usaste
    'Nombre Completo',         -- ⚠️ Nombre del usuario
    'cashier',                 -- ⚠️ Rol: super_admin, admin, manager, cashier
    true,                      -- Usuario activo
    '00000000-0000-0000-0000-000000000001'  -- ID de tienda por defecto
);
```

3. Click en **"Run"** para ejecutar
4. Verifica que se creó correctamente:

```sql
SELECT * FROM public.user_profiles WHERE email = 'email@ejemplo.com';
```

---

### **Paso 3: Verificar en la Aplicación**

1. Ve a la aplicación web
2. Navega a **Administración** > **Usuarios**
3. Click en **"Recargar"** o presiona F5
4. Deberías ver el nuevo usuario en la lista

---

## 🎯 Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **super_admin** | Super Administrador | Acceso total + gestión de usuarios |
| **admin** | Administrador | Acceso total excepto usuarios |
| **manager** | Gerente | Gestión operativa con restricciones |
| **cashier** | Cajero | Solo POS y consultas básicas |

---

## 📝 Ejemplo Completo

**Crear un cajero llamado "María González":**

```sql
-- Paso 1: Crear en Authentication (Supabase Dashboard)
-- Email: maria.gonzalez@asadosproteina.com
-- Password: MiPassword123!
-- Auto Confirm: ✅
-- Copiar User UID: abc123-def456-ghi789

-- Paso 2: Ejecutar este SQL
INSERT INTO public.user_profiles (id, email, full_name, role, is_active, store_id)
VALUES (
    'abc123-def456-ghi789',
    'maria.gonzalez@asadosproteina.com',
    'María González',
    'cashier',
    true,
    '00000000-0000-0000-0000-000000000001'
);

-- Paso 3: Verificar
SELECT * FROM public.user_profiles WHERE email = 'maria.gonzalez@asadosproteina.com';
```

---

## 🚀 Solución Futura: Edge Function

Para permitir la creación de usuarios desde la aplicación, necesitarás implementar una **Supabase Edge Function** que:

1. Use el `service_role` key de forma segura
2. Valide que solo super_admins puedan crear usuarios
3. Cree el usuario en Auth y el perfil en la base de datos

### Pasos para Implementar (Avanzado):

1. **Crear Edge Function**:
```bash
npx supabase functions new create-user
```

2. **Implementar la función** (ver documentación de Supabase)

3. **Actualizar `user.service.ts`** para llamar a la Edge Function

---

## ❓ Preguntas Frecuentes

### **¿Por qué no puedo crear usuarios desde la app?**
Por seguridad. El `service_role` key tiene permisos completos y no debe exponerse en el frontend.

### **¿Puedo automatizar esto?**
Sí, implementando una Edge Function (ver sección anterior).

### **¿Qué pasa si olvido crear el perfil?**
El usuario podrá iniciar sesión pero no verá ningún módulo en el menú.

### **¿Puedo cambiar el rol después?**
Sí, desde la página de Usuarios puedes editar el rol de cualquier usuario.

---

## 📚 Recursos

- [Supabase Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
