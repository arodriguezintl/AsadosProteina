# Guía de Despliegue - Asados Proteína ERP

Esta guía te ayudará a desplegar tu aplicación en GitHub y en servicios de hosting como Vercel, Netlify o GitHub Pages.

---

## 📋 Tabla de Contenidos

1. [Preparar el Proyecto](#1-preparar-el-proyecto)
2. [Subir a GitHub](#2-subir-a-github)
3. [Desplegar en Vercel (Recomendado)](#3-desplegar-en-vercel-recomendado)
4. [Desplegar en Netlify (Alternativa)](#4-desplegar-en-netlify-alternativa)
5. [Configurar Variables de Entorno](#5-configurar-variables-de-entorno)
6. [Desplegar Edge Functions](#6-desplegar-edge-functions)
7. [Solución de Problemas](#7-solución-de-problemas)

---

## 1. Preparar el Proyecto

### **Paso 1.1: Crear archivo .gitignore**

Crea un archivo `.gitignore` en la raíz del proyecto:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Supabase
.supabase/

# Temporary files
*.tmp
.cache/
```

### **Paso 1.2: Crear archivo .env.example**

Crea `.env.example` para documentar las variables necesarias:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### **Paso 1.3: Verificar que .env está en .gitignore**

⚠️ **IMPORTANTE**: Nunca subas tu archivo `.env` con las claves reales a GitHub.

```powershell
# Verificar que .env está ignorado
git status
# No debería aparecer .env en la lista
```

---

## 2. Subir a GitHub

### **Paso 2.1: Inicializar Git (si no lo has hecho)**

```powershell
# En la raíz del proyecto
git init
```

### **Paso 2.2: Crear repositorio en GitHub**

1. Ve a [github.com](https://github.com)
2. Click en **"New repository"** (botón verde)
3. Nombre: `asados-proteina-erp`
4. Descripción: `Sistema ERP para Asados Proteína`
5. Visibilidad: **Private** (recomendado para proyectos de negocio)
6. **NO** marques "Initialize with README"
7. Click **"Create repository"**

### **Paso 2.3: Conectar y subir el código**

```powershell
# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: ERP system with permissions and user management"

# Agregar el repositorio remoto (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/asados-proteina-erp.git

# Cambiar a rama main
git branch -M main

# Subir el código
git push -u origin main
```

### **Paso 2.4: Verificar**

Ve a tu repositorio en GitHub y verifica que todos los archivos estén ahí.

---

## 3. Desplegar en Vercel (Recomendado)

Vercel es ideal para aplicaciones React/Vite y tiene excelente integración con Supabase.

### **Paso 3.1: Crear cuenta en Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Usa **"Continue with GitHub"**
4. Autoriza a Vercel

### **Paso 3.2: Importar proyecto**

1. En Vercel Dashboard, click **"Add New..."** > **"Project"**
2. Busca `asados-proteina-erp`
3. Click **"Import"**

### **Paso 3.3: Configurar el proyecto**

**Framework Preset**: Vite  
**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Install Command**: `npm install`

### **Paso 3.4: Agregar Variables de Entorno**

En la sección **"Environment Variables"**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://qcnjzkfgydtpudkikvky.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Tu anon key de Supabase |

Para obtener las claves:
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings > API
3. Copia **Project URL** y **anon/public key**

### **Paso 3.5: Desplegar**

1. Click **"Deploy"**
2. Espera 2-3 minutos
3. ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

---

## 4. Desplegar en Netlify (Alternativa)

### **Paso 4.1: Crear cuenta en Netlify**

1. Ve a [netlify.com](https://netlify.com)
2. Sign up con GitHub

### **Paso 4.2: Nuevo sitio desde Git**

1. Click **"Add new site"** > **"Import an existing project"**
2. Selecciona **GitHub**
3. Busca `asados-proteina-erp`
4. Click en el repositorio

### **Paso 4.3: Configuración de build**

**Build command**: `npm run build`  
**Publish directory**: `dist`

### **Paso 4.4: Variables de entorno**

En **Site settings** > **Environment variables**:

```
VITE_SUPABASE_URL = https://qcnjzkfgydtpudkikvky.supabase.co
VITE_SUPABASE_ANON_KEY = tu-anon-key
```

### **Paso 4.5: Desplegar**

Click **"Deploy site"**

---

## 5. Configurar Variables de Entorno

### **Opción A: Archivo .env (Local)**

Crea `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://qcnjzkfgydtpudkikvky.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### **Opción B: En el código (No recomendado para producción)**

Si necesitas hardcodear temporalmente, edita `src/lib/supabase.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qcnjzkfgydtpudkikvky.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key'
```

⚠️ **Advertencia**: Nunca subas claves reales al código en GitHub público.

---

## 6. Desplegar Edge Functions

### **Paso 6.1: Vincular proyecto Supabase**

```powershell
npx supabase login
npx supabase link --project-ref hoaixbdbswvfzyijxrhy
```

### **Paso 6.2: Desplegar funciones**

```powershell
npx supabase functions deploy create-user
npx supabase functions deploy admin-action
```

### **Paso 6.3: Verificar**

1. Ve a Supabase Dashboard
2. Edge Functions
3. Verifica que `create-user` y `admin-action` estén listadas

## 7. Configuración de Base de Datos (CRÍTICO)

Para que el sistema de permisos (RBAC) y el inicio de sesión funcionen correctamente en producción, debes ejecutar el script de migración SQL.

1. Ve a **Supabase Dashboard** > **SQL Editor**.
2. Abre el archivo `supabase/migrations/20260212_fix_rbac.sql` de tu proyecto.
3. Copia todo el contenido.
4. Pégalo en el SQL Editor de Supabase.
5. Haz click en **Run**.

Esto habilitará:
- Que los usuarios puedan leer su propio perfil (necesario para login).
- Que los Super Admins tengan acceso total.
- Que las restricciones de seguridad (RLS) funcionen correctamente.

---

## 8. Solución de Problemas

### **Error: "Module not found"**

```powershell
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### **Error: "Environment variables not defined"**

Verifica que las variables estén configuradas en Vercel/Netlify:
- Settings > Environment Variables
- Redeploy después de agregar variables

### **Error: "Build failed"**

Revisa los logs de build en Vercel/Netlify y verifica:
- Todas las dependencias están en `package.json`
- No hay errores de TypeScript
- El comando de build es correcto

### **Error: "CORS" en producción**

Agrega tu dominio de producción a Supabase:
1. Supabase Dashboard > Authentication > URL Configuration
2. Agrega tu URL de Vercel/Netlify a "Site URL"

---

## 8. Comandos Útiles

```powershell
# Ver estado de Git
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Subir a GitHub
git push

# Crear nueva rama
git checkout -b feature/nueva-funcionalidad

# Ver ramas
git branch

# Cambiar de rama
git checkout main

# Mergear rama
git merge feature/nueva-funcionalidad
```

---

## 9. Flujo de Trabajo Recomendado

### **Desarrollo Local**

```powershell
# 1. Hacer cambios en el código
# 2. Probar localmente
npm run dev

# 3. Agregar y commitear
git add .
git commit -m "Descripción clara del cambio"

# 4. Subir a GitHub
git push
```

### **Despliegue Automático**

Vercel y Netlify despliegan automáticamente cuando haces push a GitHub:

1. Haces `git push`
2. Vercel/Netlify detecta el cambio
3. Construye y despliega automáticamente
4. Tu app se actualiza en ~2 minutos

---

## 10. Configuración Adicional

### **Dominio Personalizado (Opcional)**

#### En Vercel:
1. Settings > Domains
2. Add Domain
3. Sigue las instrucciones para configurar DNS

#### En Netlify:
1. Domain settings > Add custom domain
2. Configura DNS según instrucciones

### **HTTPS**

Vercel y Netlify proveen HTTPS automáticamente con certificados SSL gratuitos.

---

## 11. Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] .env en .gitignore
- [ ] Variables de entorno configuradas en Vercel/Netlify
- [ ] Build exitoso
- [ ] App funciona en producción
- [ ] Edge Functions desplegadas (opcional)
- [ ] Dominio configurado (opcional)
- [ ] CORS configurado en Supabase
- [ ] Usuarios de prueba creados

---

## 📞 Soporte

Si tienes problemas:

1. **Vercel**: [vercel.com/docs](https://vercel.com/docs)
2. **Netlify**: [docs.netlify.com](https://docs.netlify.com)
3. **Supabase**: [supabase.com/docs](https://supabase.com/docs)
4. **Vite**: [vitejs.dev/guide](https://vitejs.dev/guide)

---

## 🎉 ¡Listo!

Tu aplicación ahora está:
- ✅ Versionada en GitHub
- ✅ Desplegada en la nube
- ✅ Accesible desde cualquier lugar
- ✅ Con despliegue automático

**URL de tu app**: `https://tu-proyecto.vercel.app`

---

_Última actualización: 11 de Febrero, 2026_
