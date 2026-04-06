import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';

const normalizeRole = (rol) => {
  if (rol == null) return null;
  const s = String(rol).trim().toLowerCase();
  return s || null;
};

/**
 * Lee user_roles sin filtrar por estado en SQL (si estado=false, se marca inactive).
 * Así no “perdemos” la fila; los errores de RLS no se confunden con “sin rol”.
 */
async function fetchRoleForUser(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('rol, estado')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error obteniendo rol (user_roles):', error.code, error.message);
    return {
      rol: null,
      inactive: false,
      fetchError: error.message || 'No se pudo leer user_roles',
    };
  }

  if (!data) {
    return { rol: null, inactive: false, fetchError: null };
  }

  if (data.estado === false) {
    return {
      rol: null,
      inactive: true,
      fetchError: null,
    };
  }

  return {
    rol: normalizeRole(data.rol),
    inactive: false,
    fetchError: null,
  };
}

function applyRoleResult(setUserRole, setRoleInactive, setRoleLoadError, result) {
  setRoleLoadError(result.fetchError || null);
  setRoleInactive(Boolean(result.inactive));
  setUserRole(result.rol ?? null);
}

// Crear contexto
const AuthContext = createContext(null);

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleInactive, setRoleInactive] = useState(false);
  const [roleLoadError, setRoleLoadError] = useState(null);
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
          
          const result = await fetchRoleForUser(session.user.id);
          if (isMounted) {
            applyRoleResult(setUserRole, setRoleInactive, setRoleLoadError, result);
            if (result.rol) {
              console.log('Rol cargado:', result.rol, 'para', session.user.email);
            } else if (result.fetchError) {
              console.warn('Rol no leído (error):', result.fetchError);
            } else if (result.inactive) {
              console.warn('Usuario con rol desactivado (estado=false):', session.user.email);
            } else {
              console.warn('Sin fila en user_roles para:', session.user.email, session.user.id);
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
          const result = await fetchRoleForUser(session.user.id);
          if (!isMounted) return;
          applyRoleResult(setUserRole, setRoleInactive, setRoleLoadError, result);
        })();
      } else {
        setUser(null);
        setUserRole(null);
        setRoleInactive(false);
        setRoleLoadError(null);
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
      
      const result = await fetchRoleForUser(data.user.id);
      applyRoleResult(setUserRole, setRoleInactive, setRoleLoadError, result);
      console.log('Role fetch:', result);
      
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
      setRoleInactive(false);
      setRoleLoadError(null);
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
    roleInactive,
    roleLoadError,
    loading,
    error,
    login,
    logout,
    hasRole,
    isDirector,
    isDocente,
    isAuthenticated,
  }), [user, userRole, roleInactive, roleLoadError, loading, error, login, logout, hasRole, isDirector, isDocente, isAuthenticated]);

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