-- ============================================
-- SCRIPT: ASIGNAR ROLES DE DIRECTOR
-- ============================================
-- Copia y pega este script completo en el SQL Editor de Supabase
-- Este script buscará automáticamente los IDs de usuario por su email

DO $$
DECLARE
    id_director_uv UUID;
    id_alejandro UUID;
BEGIN
    -- 1. Buscar el UUID para director@uv.clinica
    SELECT id INTO id_director_uv FROM auth.users WHERE email = 'director@uv.clinica';
    
    -- 2. Buscar el UUID para alejandro.clavijo_a@uao.edu.co
    SELECT id INTO id_alejandro FROM auth.users WHERE email = 'alejandro.clavijo_a@uao.edu.co';

    -- 3. Asignar rol a director@uv.clinica (si el usuario existe)
    IF id_director_uv IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado)
        VALUES (id_director_uv, 'director@uv.clinica', 'director', true)
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol de director asignado exitosamente a director@uv.clinica';
    ELSE
        RAISE NOTICE 'ADVERTENCIA: No se encontró el usuario director@uv.clinica en Auth. Asegúrate de crearlo primero.';
    END IF;

    -- 4. Asignar rol a alejandro.clavijo_a@uao.edu.co (si el usuario existe)
    IF id_alejandro IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado)
        VALUES (id_alejandro, 'alejandro.clavijo_a@uao.edu.co', 'director', true)
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol de director asignado exitosamente a alejandro.clavijo_a@uao.edu.co';
    ELSE
        RAISE NOTICE 'ADVERTENCIA: No se encontró el usuario alejandro.clavijo_a@uao.edu.co en Auth. Asegúrate de crearlo primero.';
    END IF;
END $$;

-- Verificar resultados finales
SELECT * FROM user_roles WHERE email IN ('director@uv.clinica', 'alejandro.clavijo_a@uao.edu.co');
