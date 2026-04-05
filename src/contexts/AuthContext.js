import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('Iniciando AuthContext...');
      try {
        // Intentar obtener la sesión (más rápido que getUser en algunos casos)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user && isMounted) {
          console.log('Sesión encontrada para:', session.user.email);
          setUser(session.user);
          
          // Obtener rol
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('rol')
            .eq('id', session.user.id)
            .eq('estado', true)
            .single();

          if (roleError) {
            console.error('Error obteniendo rol para el usuario:', session.user.email, roleError);
          }

          if (roleData && isMounted) {
            console.log('Rol cargado exitosamente:', roleData.rol, 'para', session.user.email);
            setUserRole(roleData.rol);
          } else {
            console.warn('No se encontró rol activo para el usuario:', session.user.email);
          }
        } else {
          console.log('No se encontró sesión activa.');
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
      } finally {
        if (isMounted) {
          console.log('Carga de auth finalizada.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Suscribirse a cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        if (!session) {
          setUserRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Funciones de autenticación memorizadas
  const login = useCallback(async (email, password) => {
    try {
      console.log('AuthContext login:', email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Supabase signInWithPassword response:', { user: !!data?.user, error: signInError });
      
      if (signInError) throw signInError;
      
      // Actualizar estado local inmediatamente
      if (data?.user) {
        setUser(data.user);
      }
      
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('rol')
        .eq('id', data.user.id)
        .eq('estado', true)
        .single();
      
      console.log('Role fetch response:', { roleData, roleError });
      
      if (roleData) {
        setUserRole(roleData.rol);
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('AuthContext login catch error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  const hasRole = useCallback((requiredRole) => {
    if (!userRole) return false;
    if (typeof requiredRole === 'string') {
      return userRole === requiredRole;
    }
    return requiredRole.includes(userRole);
  }, [userRole]);

  const isDirector = useCallback(() => userRole === 'director', [userRole]);
  const isDocente = useCallback(() => userRole === 'docente', [userRole]);
  const isAuthenticated = useCallback(() => !!user, [user]);

  const value = useMemo(() => ({
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
  }), [user, userRole, loading, error, login, logout, hasRole, isDirector, isDocente, isAuthenticated]);

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