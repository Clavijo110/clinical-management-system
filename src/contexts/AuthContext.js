import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Crear contexto
const AuthContext = createContext(null);

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener usuario y su rol al cargar la app
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obtener usuario autenticado
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          setUser(authUser);
          
          // Obtener rol de la tabla user_roles
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('rol')
            .eq('id', authUser.id)
            .eq('estado', true)
            .single();

          if (roleError && roleError.code !== 'PGRST116') {
            console.error('Error fetching role:', roleError);
            setError('Error al obtener el rol del usuario');
          } else if (roleData) {
            setUserRole(roleData.rol);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Error al inicializar autenticación');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Recargar rol cuando hay cambio de sesión
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('rol')
            .eq('id', session.user.id)
            .eq('estado', true)
            .single();
          
          if (roleData) {
            setUserRole(roleData.rol);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Funciones de autenticación
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Obtener rol tras login exitoso
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('rol')
        .eq('id', data.user.id)
        .eq('estado', true)
        .single();
      
      if (roleData) {
        setUserRole(roleData.rol);
      }
      
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserRole(null);
      setError(null);
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Verificar permisos
  const hasRole = (requiredRole) => {
    if (typeof requiredRole === 'string') {
      return userRole === requiredRole;
    }
    return requiredRole.includes(userRole);
  };

  const isDirector = () => userRole === 'director';
  const isDocente = () => userRole === 'docente';
  const isAuthenticated = () => !!user;

  const value = {
    user,
    userRole,
    loading,
    error,
    login,
    logout,
    hasRole,
    isDirector,
    isDocente,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};