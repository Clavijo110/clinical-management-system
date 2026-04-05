# 🚀 Guía de Despliegue en Netlify

## Requisitos
- Cuenta en [GitHub.com](https://github.com)
- Cuenta en [Netlify.com](https://netlify.com)
- Proyecto React completo y funcional

---

## ⚡ Despliegue Rápido (5 minutos)

### Paso 1: Preparar el Repositorio en GitHub

1. Abre terminal en tu proyecto
   ```bash
   cd "c:\Users\Alejandro\OneDrive\Desktop\UAO\Ingenieria Biomedica\Trabajo de Grado\clinical-management-system"
   ```

2. Inicializa Git (si no lo hizo antes)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Clinical Management System"
   ```

3. Crea un repositorio en GitHub (https://github.com/new)
   - Nombre: `clinical-management-system`
   - Privado (recomendado)
   - NO inicializar con README

4. Conecta y sube a GitHub
   ```bash
   git remote add origin https://github.com/TU_USUARIO/clinical-management-system.git
   git branch -M main
   git push -u origin main
   ```

---

### Paso 2: Conectar a Netlify

1. **Abre https://netlify.com** y crea una cuenta (o inicia sesión)

2. **Haz clic en "Add new site"** → **Import an existing project**

3. **Conecta GitHub**
   - Haz clic en "GitHub"
   - Autoriza Netlify para acceder a tu cuenta
   - Selecciona el repositorio `clinical-management-system`

4. **Configura el Sitio**
   - **Build command**: `npm run build` (automático)
   - **Publish directory**: `build` (automático)
   - Haz clic en **Deploy**

---

### Paso 3: Configurar Variables de Entorno

1. Ve a **Netlify** → Tu sitio → **Site settings**

2. Busca **Environment variables** (o **Build & Deploy > Environment**)

3. Agrega:
   ```
   Key: REACT_APP_SUPABASE_URL
   Value: https://shhwkarwdfsdfdmvhazt.supabase.co
   ```

4. Agrega:
   ```
   Key: REACT_APP_SUPABASE_ANON_KEY
   Value: fugTeJOJTHDHmAqR
   ```

5. Haz clic en **Save**

6. **Redeploy** el sitio (vuelve a desplegar para que use las nuevas variables)

---

### Paso 4: ¡Listo!

Tu sitio estará disponible en una URL como:
```
https://nombre-del-sitio.netlify.app
```

El despliegue es automático: cada vez que hagas `git push` a `main`, Netlify se redepliegue automáticamente.

---

## 🔧 Despliegue Manual (Sin GitHub)

Si prefieres no usar GitHub:

1. Construir localmente:
   ```bash
   npm run build
   ```

2. Instalar Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Hacer deploy:
   ```bash
   netlify deploy --prod --dir=build
   ```

4. Sigue las instrucciones en la terminal

---

## 🔐 Variables de Entorno en Producción

**MUY IMPORTANTE**: Nunca expongas credenciales en `.env` si usas GitHub publico.

### Opción A: Usando Netlify (Recomendado)
- Las variables están cifradas en los servidores de Netlify
- No se ven en GitHub
- Se usa en build y runtime

### Opción B: Usando GitHub Secrets (Más avanzado)
```yaml
# .github/workflows/netlify.yml
env:
  REACT_APP_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## ✅ Checklist Antes de Producción

- [ ] Proyecto funciona localmente (`npm start`)
- [ ] Build funciona (`npm run build`)
- [ ] `.env` está en `.gitignore`
- [ ] Variables de entorno configuradas en Netlify
- [ ] Usuarios y roles creados en Supabase
- [ ] SQL ejecutado (`setup_roles_profesional.sql`)
- [ ] Dominio personalizado configurado (opcional)

---

## 🆘 Troubleshooting

### El sitio muestra 404
- Verifica que `netlify.toml` existe
- Ve a **Build settings** → verifica que el comando es `npm run build`
- Verifica que **Publish directory** es `build`

### Error: "REACT_APP_SUPABASE_URL is undefined"
- Verifica las variables en **Environment variables**
- Haz **Trigger deploy** nuevamente
- Espera a que recompile

### Build falla con error de módulo
- Verifica `npm install` en local
- Verifica que `package-lock.json` está en Git
- Prueba `npm audit fix`

### Sitio carga pero no funciona
- Abre DevTools (F12) → Console
- Busca errores de CORS o autenticación
- Verifica Supabase URL es correcta

---

## 📊 Monitoreo

Una vez desplegado:

1. **Netlify Analytics**
   - Site settings → Analytics
   - Ver estadísticas en tiempo real

2. **Supabase Logs**
   - Dashboard → Logs
   - Ver errores de BD

3. **GitHub Actions** (opcional)
   - Agregar workflows para tests automáticos

---

## 🎯 Siguientes Pasos

1. **Dominio Personalizado** (opcional)
   - `clinica.uv.edu.co`
   - Domain management → Custom domain

2. **SSL/HTTPS** (automático)
   - Netlify proporciona certificado gratuito

3. **CDN**
   - Netlify usa CDN global automáticamente

4. **Backups**
   - Supabase: Settings → Backups
   - Configurar retención

---

## 📞 Soporte

- **Netlify Help**: https://docs.netlify.com
- **Supabase Help**: https://supabase.com/docs
- **React Help**: https://react.dev

---

**¡Felicidades! Tu sistema está en producción! 🎉**