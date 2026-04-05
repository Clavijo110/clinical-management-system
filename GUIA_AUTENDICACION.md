# Guía de Configuración de Roles y Autenticación

## 📋 Resumen

Este documento explica cómo configurar la gestión de roles de forma profesional y segura en el Sistema de Gestión Clínica usando Supabase, incluyendo:

- Tabla de roles (`user_roles`)
- Autenticación centralizada con `AuthContext`
- Rutas protegidas basadas en roles
- Auditoría de acciones
- Row Level Security (RLS)

---

## 🔧 Configuración Inicial en Supabase

### Paso 1: Ejecutar el Script SQL Profesional

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre **SQL Editor** (menú izquierdo > SQL)
3. Copia el contenido de `setup_roles_profesional.sql` desde el proyecto
4. Pégalo en el editor SQL y haz clic en **Run**

Este script crea automáticamente:
- ✅ Tabla `user_roles` para gestionar roles
- ✅ Tabla `audit_log` para trazabilidad
- ✅ Funciones SQL para verificar permisos
- ✅ Políticas RLS (Row Level Security) en todas las tablas
- ✅ Índices para optimizar consultas
- ✅ Triggers para auditoría automática

---

## 👥 Crear Usuarios con Roles

### Opción A: En Supabase Dashboard (Manual)

1. Ve a **Authentication > Users**
2. Haz clic en **Add user**
3. Rellena:
   - **Email**: `director@uv.clinica`
   - **Password**: Una contraseña segura (ej: `Clinica2026!`)
   - Haz clic en **Create user**

4. Une vez creado, necesitas agregar el rol a la tabla `user_roles` usando SQL:

```sql
-- Obtener el UUID del usuario recién creado
SELECT id FROM auth.users WHERE email = 'director@uv.clinica';

-- Luego inserta el rol (reemplaza UUID-AQUI con el UUID obtenido)
INSERT INTO user_roles (id, email, rol, estado) 
VALUES ('UUID-AQUI', 'director@uv.clinica', 'director', true);

-- Haz lo mismo para docentes
INSERT INTO user_roles (id, email, rol, estado) 
VALUES ('UUID-DOCENTE', 'docente@uv.clinica', 'docente', true);
```

### Opción B: Automatizado (Función en Supabase)

Puedes crear una función que asigne roles automáticamente:

```sql
CREATE OR REPLACE FUNCTION assign_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Asignar rol 'docente' por defecto a nuevos usuarios
  -- Dir Director puede cambiar manualmente a 'director'
  INSERT INTO user_roles (id, email, rol, estado)
  VALUES (NEW.id, NEW.email, 'docente', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION assign_user_role_on_signup();
```

---

## 🏗️ Estructura de la Aplicación

### AuthContext (Centralizado)

**Archivo**: `src/contexts/AuthContext.js`

```javascript
const { user, userRole, login, logout, hasRole, isDirector, isDocente } = useAuth();
```

**Funciones principales**:
- `login(email, password)`: Autentica y carga el rol
- `logout()`: Cierra sesión
- `hasRole(role)`: Verifica si tiene un rol específico
- `isDirector()`: Atajos para tipos de usuario
- `isDocente()`: Atajos para tipos de usuario

### ProtectedRoute (Protección de Rutas)

**Archivo**: `src/components/ProtectedRoute.js`

Protege rutas según:
- Autenticación (`requireAuth`)
- Rol específico (`requiredRole`)

**Ejemplo de uso en `App.js`**:

```javascript
<Route 
  path="/rubricas" 
  element={
    <ProtectedRoute requiredRole="director">
      <Rubricas />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/gestion-pacientes" 
  element={
    <ProtectedRoute requiredRole={['director', 'docente']}>
      <GestionPacientes />
    </ProtectedRoute>
  } 
/>
```

---

## 🔐 Row Level Security (RLS)

Las políticas de RLS garantizan que:

### Director (acceso total)
```sql
-- Ve TODOS los estudiantes
SELECT * FROM estudiantes; -- ✅ Sí

-- Ve TODOS los pacientes
SELECT * FROM pacientes; -- ✅ Sí
```

### Docente (acceso limitado)
```sql
-- Ve solo sus estudiantes
SELECT * FROM estudiantes 
WHERE docente_id = auth.uid(); -- ✅ Sí

-- No puede modificar rúbricas
UPDATE rubricas SET criterios = ...  -- ❌ No

-- Ve solo pacientes de sus estudiantes
SELECT * FROM pacientes 
WHERE estudiante_id IN (
  SELECT id FROM estudiantes 
  WHERE docente_id = auth.uid()
); -- ✅ Sí
```

---

## 📊 Tabla `user_roles`

Estructura:
```
id              | email                   | rol      | estado
(auth.users.id) | director@uv.clinica    | director | true
                | docente1@uv.clinica    | docente  | true
                | docente2@uv.clinica    | docente  | false
```

**Campos**:
- `id`: UUID del usuario (referencia a `auth.users`)
- `email`: Email único del usuario
- `rol`: 'director' o 'docente'
- `estado`: true (activo) / false (inactivo)
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización

---

## 📝 Auditoría

La tabla `audit_log` registra **todas** las acciones:

```sql
SELECT * FROM audit_log 
WHERE user_id = 'uuid-del-docente'
ORDER BY timestamp DESC;
```

**Campos**:
- `user_id`: Quién realizó la acción
- `accion`: INSERT, UPDATE, DELETE
- `tabla_afectada`: De qué tabla
- `datos_anteriores`: Estado antes del cambio (JSON)
- `datos_nuevos`: Estado después del cambio (JSON)
- `timestamp`: Cuándo sucedió

---

## 🧪 Pruebas Locales

### 1. Crear usuarios en Supabase

```bash
# Dashboard Supabase → Authentication > Users
# Email: director@uv.clinica
# Email: docente@uv.clinica
```

### 2. Agregar roles a la tabla `user_roles`

En SQL Editor:
```sql
INSERT INTO user_roles (id, email, rol, estado) 
VALUES (
  'uuid-del-director', 
  'director@uv.clinica', 
  'director', 
  true
);
```

### 3. Inicia la app localmente

```bash
npm start
```

### 4. Prueba el login

- Email: `director@uv.clinica`
- Deberías ver el Dashboard de Director
- Acceso total a todas las funciones ✅

- Email: `docente@uv.clinica`
- Deberías ver el Dashboard de Docente
- Sin acceso a Rúbricas ❌

---

## 🚀 Despliegue en Producción

### Netlify

1. Las variables de entorno ya están en `.env`
2. Ve a **Site settings > Environment variables** en Netlify
3. Agrega (son las mismas que en `.env`):
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### Supabase en Producción

1. Los scripts SQL ejecutados siguen vigentes
2. Los usuarios pueden registrarse o ser invitados
3. Todos los datos están protegidos por RLS
4. La auditoría funciona automáticamente

---

## ⚠️ Consideraciones de Seguridad

✅ **Implementado**:
- Autenticación con Supabase Auth
- Contraseñas hasheadas automáticamente
- Row Level Security en BD
- Auditoría de cambios
- HTTPS obligatorio
- Validación en frontend y backend

⚠️ **También considerar**:
- Cambio de contraseña regularmente
- Backup de Supabase (automático en plan pago)
- Monitoreo de accesos inusuales
- Límites de rate en API (en plan pago)

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs en Supabase**: Dashboard > Logs
2. **Verificar consola del navegador**: F12 > Console
3. **Verificar permisos**: SQL > `SELECT * FROM user_roles`
4. **Verificar RLS**: SQL > `SELECT * FROM information_schema.row_security_policies`

---

## 📂 Archivos Relevantes

```
src/
├── contexts/
│   └── AuthContext.js          # Lógica centralizada de autenticación
├── components/
│   ├── Login.js                # Pantalla de login
│   ├── ProtectedRoute.js       # Protección de rutas
│   ├── DashboardDirector.js    # Panel del director
│   └── DashboardDocente.js     # Panel del docente
├── App.js                      # Rutas con protecciones
└── supabaseClient.js           # Configuración Supabase

setup_roles_profesional.sql    # Script SQL principal
```

---

## 🎯 Resumen Rápido

| Tarea | Cómo |
|-------|------|
| Crear Director | Crear usuario en Auth > Agregar a `user_roles` con rol='director' |
| Crear Docente | Crear usuario en Auth > Agregar a `user_roles` con rol='docente' |
| Ver roles | `SELECT * FROM user_roles` |
| Cambiar rol | `UPDATE user_roles SET rol='director' WHERE email='...` |
| Desactivar usuario | `UPDATE user_roles SET estado=false WHERE id='...'` |
| Ver auditoría | `SELECT * FROM audit_log WHERE user_id='...'` |
| Verificar permisos | Director: acceso total | Docente: solo sus datos |

---

**Última actualización**: Abril 2026
**Versión**: 1.0 Profesional