# Guía de Configuración de Usuario Administrador

## 📝 Pasos para Crear tu Usuario

### 1️⃣ Crear Usuario en Supabase Auth

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Navega a **Authentication** > **Users** (en el menú lateral)
3. Haz clic en **Add User** (botón verde arriba a la derecha)
4. Completa el formulario:
   - **Email**: Tu correo (ej: `admin@asadosproteina.com`)
   - **Password**: Crea una contraseña temporal (opcional, puedes dejarlo vacío para usar solo Magic Links)
   - **Auto Confirm User**: ✅ **Activa esta opción** (muy importante)
5. Haz clic en **Create User**
6. **COPIA EL UUID** del usuario que aparece en la tabla (lo necesitarás en el siguiente paso)

---

### 2️⃣ Crear Perfil de Administrador

1. En Supabase, ve a **SQL Editor** (en el menú lateral)
2. Haz clic en **New Query**
3. Copia y pega el siguiente script:

```sql
-- Reemplaza 'TU_EMAIL_AQUI' con el email que usaste en el paso anterior
INSERT INTO public.user_profiles (id, full_name, role, store_id)
SELECT 
    id, 
    'Administrador Principal',
    'super_admin',
    '00000000-0000-0000-0000-000000000001'
FROM auth.users 
WHERE email = 'TU_EMAIL_AQUI'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.users.id
);

-- Verificar que se creó correctamente
SELECT 
    up.id,
    up.full_name,
    up.role,
    au.email
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'super_admin';
```

4. **Reemplaza** `'TU_EMAIL_AQUI'` con tu email real
5. Haz clic en **Run** (o presiona `Ctrl + Enter`)
6. Deberías ver un resultado confirmando que se creó el perfil

---

### 3️⃣ Iniciar Sesión en la Aplicación

1. Regresa a **http://localhost:5173/**
2. Ingresa tu email
3. Haz clic en **Ingresar con Magic Link**
4. Revisa tu bandeja de entrada
5. Haz clic en el enlace del correo
6. ¡Deberías estar dentro del sistema! 🎉

---

## 🔍 Verificación

Una vez dentro, verifica:
- ✅ El sidebar muestra "Asados Proteína"
- ✅ En el footer del sidebar aparece tu email
- ✅ Al hacer clic en tu email, ves "Rol: super_admin"
- ✅ Puedes navegar por todos los módulos

---

## ⚠️ Solución de Problemas

**Si el Magic Link no llega:**
- Revisa tu carpeta de spam
- Verifica que el email esté confirmado en Supabase (columna `email_confirmed_at`)

**Si aparece "No autorizado" al navegar:**
- Verifica que el `store_id` en `user_profiles` sea `00000000-0000-0000-0000-000000000001`
- Revisa que las políticas RLS estén habilitadas en Supabase

**Si necesitas cambiar tu rol:**
```sql
UPDATE public.user_profiles 
SET role = 'super_admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL');
```
