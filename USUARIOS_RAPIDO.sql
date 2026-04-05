-- ============================================
-- SCRIPT RÁPIDO: CREAR Y AGREGAR USUARIOS CON ROLES
-- ============================================
-- Copiar y ejecutar en Supabase SQL Editor

-- 1. BUSCAR EL UUID DE UN USUARIO YA CREADO
-- Ejecuta esto para ver tus usuarios:
SELECT id, email, created_at FROM auth.users;

-- 2. COPIAR EL UUID y reemplazarlo en los INSERT abajo

-- ============================================
-- CREAR DIRECTOR
-- ============================================
-- Primero, crea el usuario en: Authentication > Users > Add user
-- Email: director@uv.clinica
-- Password: [una contraseña fuerte]

-- Luego ejecuta esto (reemplaza UUID-DEL-DIRECTOR):
INSERT INTO user_roles (id, email, rol, estado) 
VALUES ('UUID-DEL-DIRECTOR', 'director@uv.clinica', 'director', true)
ON CONFLICT (id) DO UPDATE SET rol = 'director';

-- ============================================
-- CREAR DOCENTES
-- ============================================
-- Primero, crea cada usuario en: Authentication > Users > Add user
-- Emails: docente1@uv.clinica, docente2@uv.clinica, etc.

-- Luego ejecuta para cada docente (reemplaza UUID):
INSERT INTO user_roles (id, email, rol, estado) 
VALUES ('UUID-DEL-DOCENTE1', 'docente1@uv.clinica', 'docente', true)
ON CONFLICT (id) DO UPDATE SET rol = 'docente';

INSERT INTO user_roles (id, email, rol, estado) 
VALUES ('UUID-DEL-DOCENTE2', 'docente2@uv.clinica', 'docente', true)
ON CONFLICT (id) DO UPDATE SET rol = 'docente';

-- ============================================
-- VERIFICAR USUARIOS Y ROLES
-- ============================================
SELECT * FROM user_roles ORDER BY created_at DESC;

-- Ver detalles con timestamps
SELECT 
  ur.email,
  ur.rol,
  ur.estado,
  TO_CHAR(ur.created_at, 'YYYY-MM-DD HH:MI:SS') as "Creado",
  TO_CHAR(ur.updated_at, 'YYYY-MM-DD HH:MI:SS') as "Actualizado"
FROM user_roles ur
ORDER BY ur.created_at DESC;

-- ============================================
-- CAMBIAR ROL DE UN USUARIO
-- ============================================
-- De docente a director:
UPDATE user_roles 
SET rol = 'director' 
WHERE email = 'docente@uv.clinica';

-- ============================================
-- DESACTIVAR UN USUARIO (sin borrarlo)
-- ============================================
UPDATE user_roles 
SET estado = false 
WHERE email = 'docente@uv.clinica';

-- Reactivar:
UPDATE user_roles 
SET estado = true 
WHERE email = 'docente@uv.clinica';

-- ============================================
-- VER AUDITORÍA DE CAMBIOS
-- ============================================
-- Últimas 10 acciones del sistema:
SELECT 
  (SELECT email FROM auth.users au WHERE au.id = al.user_id) as usuario,
  al.accion,
  al.tabla_afectada,
  TO_CHAR(al.timestamp, 'YYYY-MM-DD HH:MI:SS') as fecha,
  al.datos_nuevos
FROM audit_log al
ORDER BY al.timestamp DESC
LIMIT 10;

-- ============================================
-- ESTADÍSTICAS RÁPIDAS
-- ============================================
-- Contar usuarios por rol:
SELECT rol, COUNT(*) as cantidad FROM user_roles WHERE estado = true GROUP BY rol;

-- Docentes activos:
SELECT email FROM user_roles WHERE rol = 'docente' AND estado = true;

-- ============================================
-- LIMPIAR (Solo si hay error - úsalo con cuidado)
-- ============================================
-- Borrar un usuario de roles (el usuario de auth se mantiene):
DELETE FROM user_roles WHERE email = 'usuario@uv.clinica';

-- Nota: No borres directamente de auth.users, úsalo desde Dashboard