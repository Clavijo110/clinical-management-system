import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DashboardDirector from './components/DashboardDirector';
import DashboardDocente from './components/DashboardDocente';
import GestionEstudiantes from './components/GestionEstudiantes';
import GestionPacientes from './components/GestionPacientes';
import GestionUsuarios from './components/GestionUsuarios';
import RegistroAtenciones from './components/RegistroAtenciones';
import Rubricas from './components/Rubricas';
import Reportes from './components/Reportes';
import Configuracion from './components/Configuracion';
import Analiticas from './components/Analiticas';
import ProtectedRoute from './components/ProtectedRoute';

// Tema profesional mejorado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e3a8a',
      light: '#3b82f6',
      dark: '#1e40af',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#6d28d9',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      dark: '#dc2626',
    },
    info: {
      main: '#0ea5e9',
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: '#3b82f6',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableHead-root': {
            backgroundColor: '#f8fafc',
          },
          '& .MuiTableBody-root tr:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
  },
});

const DashboardRouter = () => {
  const { loading, isDirector, isDocente, user, roleInactive, roleLoadError, logout } = useAuth();
  const navigate = useNavigate();

  const handleSalir = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isDirector()) {
    return <DashboardDirector />;
  }

  if (isDocente()) {
    return <DashboardDocente />;
  }

  if (roleLoadError) {
    return (
      <Box sx={{ p: 4, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo leer tu rol en la tabla <strong>user_roles</strong>: {roleLoadError}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Suele deberse a políticas RLS: hace falta que cada usuario autenticado pueda hacer{' '}
          <strong>SELECT</strong> de su propia fila (<code>auth.uid() = id</code>). En el repo está el script{' '}
          <strong>RLS_USER_ROLES_LEER_PROPIO.sql</strong> para crear esa política en Supabase.
        </Typography>
        <Button variant="outlined" onClick={handleSalir}>
          Cerrar sesión
        </Button>
      </Box>
    );
  }

  if (roleInactive) {
    return (
      <Box sx={{ p: 4, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Cuenta desactivada
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tu usuario existe en <strong>user_roles</strong> pero el campo <strong>estado</strong> está en false.
          Pide a un director que te reactive en gestión de docentes o actualiza el registro en Supabase.
        </Typography>
        <Button variant="outlined" onClick={handleSalir}>
          Cerrar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Usuario autenticado sin rol asignado
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Tu sesión es válida, pero no hay una fila en <strong>user_roles</strong> con el mismo{' '}
        <strong>id</strong> que tu usuario de Authentication, o el correo con el que entras no coincide con el
        que usaste al crear el registro.
      </Typography>
      <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
        <Typography variant="body2" component="span" display="block" sx={{ mb: 1 }}>
          <strong>Tu correo actual:</strong> {user?.email ?? '(no disponible)'}
        </Typography>
        <Typography variant="body2" component="span" display="block">
          En Supabase → SQL Editor ejecuta el archivo <strong>ASIGNAR_ROL_POR_EMAIL.sql</strong> del proyecto:
          sustituye <code>TU_CORREO_AQUI</code> por ese mismo correo y elige rol director o docente.
        </Typography>
      </Alert>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        También puedes comprobar en Table Editor que exista una fila en <code>user_roles</code> cuyo{' '}
        <code>id</code> sea exactamente el UUID del usuario en Authentication → Users.
      </Typography>
      <Button variant="outlined" onClick={handleSalir}>
        Cerrar sesión
      </Button>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={process.env.PUBLIC_URL || ''}>
        <AuthProvider>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas - Acceso general autenticado */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard dinámico según rol */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />

            {/* Rutas solo para Director */}
            <Route 
              path="/gestion-usuarios" 
              element={
                <ProtectedRoute requiredRole="director">
                  <GestionUsuarios />
                </ProtectedRoute>
              } 
            />

            {/* Rutas para Director y Docente */}
            <Route 
              path="/gestion-estudiantes" 
              element={
                <ProtectedRoute requiredRole={['director', 'docente']}>
                  <GestionEstudiantes />
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

            <Route 
              path="/registro-atenciones" 
              element={
                <ProtectedRoute requiredRole={['director', 'docente']}>
                  <RegistroAtenciones />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/rubricas" 
              element={
                <ProtectedRoute requiredRole="director">
                  <Rubricas />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reportes" 
              element={
                <ProtectedRoute requiredRole={['director', 'docente']}>
                  <Reportes />
                </ProtectedRoute>
              } 
            />

            <Route
              path="/analiticas"
              element={
                <ProtectedRoute requiredRole="director">
                  <Analiticas />
                </ProtectedRoute>
              }
            />
            <Route path="/analíticas" element={<Navigate to="/analiticas" replace />} />

            <Route 
              path="/configuracion" 
              element={
                <ProtectedRoute requiredRole="director">
                  <Configuracion />
                </ProtectedRoute>
              } 
            />

            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
