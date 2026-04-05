-- ============================================
-- SOLUCIÓN COMPLETA: CREACIÓN DE TABLAS Y ASIGNACIÓN DE ROLES
-- ============================================
-- Copia y pega este script completo en el SQL Editor de Supabase

-- 1. CREAR TABLA DE ROLES (si no existe)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  rol TEXT CHECK (rol IN ('director', 'docente')) NOT NULL,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_roles_rol ON user_roles(rol);
CREATE INDEX IF NOT EXISTS idx_user_roles_estado ON user_roles(estado);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas (usar DO para evitar errores si ya existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own role') THEN
        CREATE POLICY "Users can view their own role" ON user_roles FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- 2. ASIGNAR ROLES DE DIRECTOR
DO $$
DECLARE
    id_director_uv UUID;
    id_alejandro UUID;
BEGIN
    -- Buscar el UUID para director@uv.clinica
    SELECT id INTO id_director_uv FROM auth.users WHERE email = 'director@uv.clinica';
    
    -- Buscar el UUID para alejandro.clavijo_a@uao.edu.co
    SELECT id INTO id_alejandro FROM auth.users WHERE email = 'alejandro.clavijo_a@uao.edu.co';

    -- Asignar rol a director@uv.clinica
    IF id_director_uv IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado)
        VALUES (id_director_uv, 'director@uv.clinica', 'director', true)
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol de director asignado exitosamente a director@uv.clinica';
    ELSE
        RAISE NOTICE 'ADVERTENCIA: No se encontró el usuario director@uv.clinica en Auth.';
    END IF;

    -- Asignar rol a alejandro.clavijo_a@uao.edu.co
    IF id_alejandro IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado)
        VALUES (id_alejandro, 'alejandro.clavijo_a@uao.edu.co', 'director', true)
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol de director asignado exitosamente a alejandro.clavijo_a@uao.edu.co';
    ELSE
        RAISE NOTICE 'ADVERTENCIA: No se encontró el usuario alejandro.clavijo_a@uao.edu.co en Auth.';
    END IF;
END $$;

-- 3. VERIFICAR RESULTADOS
SELECT * FROM user_roles WHERE email IN ('director@uv.clinica', 'alejandro.clavijo_a@uao.edu.co');
