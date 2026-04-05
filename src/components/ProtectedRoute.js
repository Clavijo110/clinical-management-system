import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute: Componente para proteger rutas
 * @param {React.ReactNode} children - Componente a renderizar
 * @param {string | string[]} requiredRole - Rol(es) requerido(s)
 * @param {boolean} requireAuth - Si se requiere autenticación (por defecto true)
 */
const ProtectedRoute = ({ children, requiredRole = null, requireAuth = true }) => {
  const { user, userRole, loading, isAuthenticated, hasRole } = useAuth();

  // Mostrar loading mientras se carga la autenticación
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar si el usuario está autenticado si es requerido
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si tiene el rol requerido
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Acceso denegado: No tienes permisos para acceder a esta sección</h2>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;