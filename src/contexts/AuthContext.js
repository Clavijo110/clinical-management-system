import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const normalizeRole = (rol) => {
  if (rol == null) return null;
  const s = String(rol).trim().toLowerCase();
  return s || null;
};

async function fetchRoleForUser(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('rol')
    .eq('id', userId)
    .eq('estado', true)
    .maybeSingle();
  if (error) {
    console.error('Error obteniendo rol:', error);
    return undefined;
  }
  return normalizeRole(data?.rol);
}

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
          
          const role = await fetchRoleForUser(session.user.id);
          if (isMounted) {
            if (role !== undefined) {
              setUserRole(role);
              if (role) {
                console.log('Rol cargado:', role, 'para', session.user.email);
              } else {
                console.warn('No se encontró rol activo para el usuario:', session.user.email);
              }
            }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        void (async () => {
          const role = await fetchRoleForUser(session.user.id);
          if (!isMounted || role === undefined) return;
          setUserRole(role);
        })();
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
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
      
      const role = await fetchRoleForUser(data.user.id);
      if (role !== undefined) {
        setUserRole(role);
      }
      console.log('Role fetch:', { role });
      
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