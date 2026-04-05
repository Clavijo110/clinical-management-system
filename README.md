# Sistema de Gestión Clínica - Posgrado Ortodoncia UV

Aplicación web profesional para la gestión clínica de residentes del Posgrado de Ortodoncia de la Universidad del Valle, con autenticación basada en roles, auditoría completa y seguridad de nivel empresarial.

## 🎯 Características Principales

### Autenticación y Seguridad
- ✅ Autenticación segura con Supabase Auth (contraseñas hasheadas)
- ✅ Gestión de roles centralizada (Director, Docente)
- ✅ Row Level Security (RLS) en base de datos
- ✅ Auditoría automática de todas las acciones
- ✅ HTTPS obligatorio en producción

### Funcionalidades
- ✅ Dashboard dinámico según rol del usuario
- ✅ Gestión de estudiantes (agregar, retirar, reasignar)
- ✅ Registro completo de pacientes con fotografías
- ✅ Historial cronológico de atenciones clínicas
- ✅ Rúbricas de evaluación configurables por semestre
- ✅ Exportación de reportes a PDF y Excel
- ✅ Diseño responsivo (móvil, tablet, desktop)

### Control de Acceso (RBAC)
| Rol | Acceso | Restricciones |
|-----|--------|---|
| **Director** | Total | Ve y gestiona todo el sistema |
| **Docente** | Parcial | Solo sus estudiantes y pacientes |
| **Estudiante** | Ninguno | Sin acceso (datos gestionados por docentes) |

## 🛠️ Stack Tecnológico

```
Frontend:    React 18 + Material-UI (TypeScript ready)
Backend:     Supabase (PostgreSQL + Auth + Storage)
Hosting:     Netlify (o similar)
Exportación: jsPDF + XLSX
CI/CD:       Netlify Continuous Deploy
```

## 📦 Instalación

### Requisitos
- Node.js 16+ 
- NPM o Yarn
- Cuenta en Supabase (gratuita en supabase.com)

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone <url-repo>
   cd clinical-management-system
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura Supabase** (CRUCIAL)
   
   a. Ve a https://supabase.com/dashboard

   b. Abre **SQL Editor** y ejecuta el contenido de `setup_roles_profesional.sql`
   
   c. Copia tu URL y clave anónima de **Settings > API**
   
   d. Actualiza `.env`:
   ```env
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=xxxxx
   ```

4. **Crea usuarios y roles**
   
   a. Ve a **Authentication > Users** en Supabase
   
   b. Haz clic en **Add user** para crear usuarios de prueba
   
   c. En **SQL Editor**, ejecuta `USUARIOS_RAPIDO.sql` para asignar roles
   
   d. Consulta **GUIA_AUTENDICACION.md** para instrucciones detalladas

5. **Ejecuta en desarrollo**
   ```bash
   npm start
   ```
   La app se abrirá en http://localhost:3000

## 🔐 Gestión de Roles

### Para Director
- Email: `director@uv.clinica`
- Acceso: Total al sistema
- Panel: Dashboard Director con KPIs globales

### Para Docente
- Email: `docente@uv.clinica`
- Acceso: Solo datos propios
- Panel: Dashboard Docente con progreso personal

### Agregar Más Usuarios
Ver `USUARIOS_RAPIDO.sql` para scripts listos para copiar-pegar.

## 📋 Documentación

| Archivo | Contenido |
|---------|----------|
| [GUIA_AUTENDICACION.md](./GUIA_AUTENDICACION.md) | Gestión profesional de roles, RLS, auditoría |
| [USUARIOS_RAPIDO.sql](./USUARIOS_RAPIDO.sql) | Scripts SQL para crear/modificar usuarios |
| [setup_roles_profesional.sql](./setup_roles_profesional.sql) | Script SQL completo (ejecutar primero) |
| [setup.sql](./setup.sql) | Script de tablas básicas (opcional) |

## 🚀 Despliegue en Producción

### Con Netlify (Recomendado)

1. Sube el repo a GitHub
2. Ve a netlify.com y conecta tu repo
3. Configura build:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`

4. Agrega variables de entorno en **Site settings > Environment variables**:
   ```
   REACT_APP_SUPABASE_URL = ...
   REACT_APP_SUPABASE_ANON_KEY = ...
   ```

5. Deploy automático en cada push a main

### Otras Plataformas
- **Vercel**: Soporte nativo para React
- **AWS Amplify**: Con autenticación integrada
- **Heroku**: Requiere node.js buildpack

## 🧪 Pruebas

### Localmente
```bash
npm start
```

### Producción
```bash
npm run build
npm install -g serve
serve -s build
```

## 📊 Base de Datos

### Tablas Principales
- `auth.users` - Usuarios de Supabase Auth
- `user_roles` - Asignación de roles (único)
- `usuarios` - Docentes del sistema
- `estudiantes` - Residentes de ortodoncia
- `pacientes` - Registros de pacientes
- `atenciones` - Sesiones clínicas
- `rubricas` - Criterios de evaluación
- `audit_log` - Trazabilidad de cambios

### Políticas RLS

Automaticamente aplicadas al ejecutar `setup_roles_profesional.sql`:

```sql
-- Director: acceso total a todo
SELECT * FROM estudiantes; -- ✅

-- Docente: solo sus datos
SELECT * FROM estudiantes WHERE docente_id = auth.uid(); -- ✅
SELECT * FROM estudiantes WHERE docente_id != auth.uid(); -- ❌ Denegado

-- Tabla de roles: lectura propia
SELECT * FROM user_roles WHERE id = auth.uid(); -- ✅
UPDATE user_roles SET rol='director'; -- ❌ Denegado (solo admin)
```

## ⚠️ Seguridad

- ✅ Autenticación con Supabase Auth (OAuth2, JWT)
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Row Level Security en PostgreSQL
- ✅ HTTPS en producción
- ✅ Auditoría automática
- ✅ Validación de inputs frontend + backend
- ✅ No expone secrets en cliente

### Checklist Antes de Producción
- [ ] Cambiar credenciales por defecto
- [ ] Habilitar 2FA en cuentas de administrador
- [ ] Configurar respaldos en Supabase
- [ ] Revisar políticas RLS
- [ ] Monitorear logs en Supabase
- [ ] Configurar alertas de seguridad

## 🛠️ Desarrollo

### Estructura de Carpetas
```
src/
├── components/           # Componentes React
│   ├── Login.js
│   ├── DashboardDirector.js
│   ├── DashboardDocente.js
│   ├── ProtectedRoute.js
│   └── ...
├── contexts/            # Estado global
│   └── AuthContext.js    # Autenticación centralizada
├── App.js              # Rutas principales
├── supabaseClient.js    # Config Supabase
└── index.js
```

### Hook Personalizado

```javascript
// En cualquier componente:
const { user, userRole, logout, isDirector, isDocente } = useAuth();

// Componentes protegidos:
<ProtectedRoute requiredRole="director">
  <MiComponente />
</ProtectedRoute>
```

### Agregar Nueva Ruta Protegida

```javascript
// En App.js
<Route 
  path="/nueva-funcion" 
  element={
    <ProtectedRoute requiredRole={['director', 'docente']}>
      <NuevaFuncion />
    </ProtectedRoute>
  } 
/>
```

## 📈 Escalabilidad

El sistema está diseñado para crecer:
- RLS automáticamente escala con más usuarios
- Índices en tablas frecuentes
- Funciones SQL optimizadas
- Auditoría performante

Para aumentar: considera plan Supabase pago + líquido de Netlify.

## 🐛 Troubleshooting

### Error: "CORS error"
- Verifica REACT_APP_SUPABASE_URL en .env
- Revisa URL en Supabase Settings > API

### Error: "Acceso denegado"
- Verifica tabla `user_roles`
- Revisa políticas RLS en Supabase SQL
- Confirma `estado = true`

### Error: "Usuario no encontrado"
- Revisa Authentication > Users
- Ejecuta INSERT en `user_roles`

Consulta `GUIA_AUTENDICACION.md` para más detalles.

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Ve a GitHub Issues
2. Describe el problema con pasos reproducibles
3. Adjunta error de consola (F12 > Console)

## 📄 Licencia

Propiedad de Universidad del Valle - Posgrado Ortodoncia
Uso interno exclusivamente.

---

**Última actualización**: Abril 2026  
**Versión**: 1.0 Profesional  
**Estado**: ✅ Listo para Producción

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
