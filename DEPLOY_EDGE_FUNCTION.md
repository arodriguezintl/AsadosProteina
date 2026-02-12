# Desplegar Edge Function para Crear Usuarios

## 📋 Pasos para Desplegar

### **1. Instalar Supabase CLI (si no lo tienes)**

```powershell
# Usando npm
npm install -g supabase

# O usando scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **2. Iniciar Sesión en Supabase**

```powershell
npx supabase login
```

Esto abrirá tu navegador para autenticarte.

### **3. Vincular tu Proyecto**

```powershell
npx supabase link --project-ref qcnjzkfgydtpudkikvky
```

Te pedirá la contraseña de la base de datos.

### **4. Desplegar la Edge Function**

```powershell
npx supabase functions deploy create-user
```

### **5. Verificar el Despliegue**

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Edge Functions**
3. Deberías ver `create-user` en la lista

---

## 🔑 Configurar Variables de Entorno (Opcional)

Si necesitas configurar variables de entorno adicionales:

```powershell
npx supabase secrets set MY_SECRET=value --project-ref qcnjzkfgydtpudkikvky
```

---

## ✅ Probar la Función

Después de desplegar, puedes probar desde la app:

1. Ve a **Administración** > **Usuarios**
2. Click en **"Nuevo Usuario"**
3. Completa el formulario
4. Click en **"Crear Usuario"**

Si todo está bien, el usuario se creará automáticamente.

---

## 🐛 Debugging

Si hay errores, puedes ver los logs:

```powershell
npx supabase functions logs create-user --project-ref qcnjzkfgydtpudkikvky
```

O en Supabase Dashboard:
- **Edge Functions** > **create-user** > **Logs**

---

## 📝 Notas Importantes

- ✅ La función valida que solo **super_admin** pueda crear usuarios
- ✅ Usa el **service_role key** de forma segura (no expuesto al frontend)
- ✅ Crea el usuario en Auth y el perfil en la BD en una sola operación
- ✅ Si falla la creación del perfil, elimina el usuario de Auth (rollback)

---

## 🔄 Actualizar la Función

Si haces cambios en `supabase/functions/create-user/index.ts`:

```powershell
npx supabase functions deploy create-user
```

---

## ❓ Solución de Problemas

### Error: "Function not found"
- Verifica que desplegaste la función
- Revisa que el nombre sea exactamente `create-user`

### Error: "Only super_admin can create users"
- Asegúrate de estar logueado como super_admin
- Verifica tu rol en la tabla `user_profiles`

### Error: "No authorization header"
- Cierra sesión y vuelve a iniciar
- Verifica que el token de sesión sea válido

---

## 🚀 Comando Rápido (Todo en Uno)

```powershell
# Desplegar la función
npx supabase functions deploy create-user --project-ref qcnjzkfgydtpudkikvky
```
