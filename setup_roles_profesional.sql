-- ============================================
-- TABLA DE ROLES Y PERMISOS (PROFESIONAL)
-- ============================================

-- Tabla de roles de usuarios
CREATE TABLE user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  rol TEXT CHECK (rol IN ('director', 'docente')) NOT NULL,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas frecuentes
CREATE INDEX idx_user_roles_rol ON user_roles(rol);
CREATE INDEX idx_user_roles_estado ON user_roles(estado);
CREATE INDEX idx_user_roles_email ON user_roles(email);

-- RLS: Cada usuario puede ver su propio rol
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users cannot modify roles (only admin)" ON user_roles
  FOR ALL USING (false);

-- ============================================
-- TABLA AUDITORIA (PARA TRACKING)
-- ============================================
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  tabla_afectada TEXT NOT NULL,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- ============================================
-- FUNCIÓN PARA OBTENER ROL DEL USUARIO
-- ============================================
CREATE OR REPLACE FUNCTION get_user_rol(user_id UUID)
RETURNS TEXT AS $$
  SELECT rol FROM user_roles WHERE id = user_id AND estado = true;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA VERIFICAR PERMISO
-- ============================================
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, required_rol TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE id = user_id 
    AND rol = required_rol 
    AND estado = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA AUDITORÍA
-- ============================================
CREATE OR REPLACE FUNCTION audit_estudiantes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
  VALUES (
    auth.uid(),
    TG_OP,
    'estudiantes',
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_estudiantes
AFTER INSERT OR UPDATE OR DELETE ON estudiantes
FOR EACH ROW EXECUTE FUNCTION audit_estudiantes();

-- ============================================
-- ACTUALIZAR RLS DE TABLAS EXISTENTES
-- ============================================

-- ESTUDIANTES: Director ve todos, Docente solo los suyos
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director access all estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "Docente access own estudiantes" ON estudiantes;

CREATE POLICY "Director access all estudiantes" ON estudiantes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'director' AND estado = true)
  );

CREATE POLICY "Docente access own estudiantes" ON estudiantes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'docente' AND estado = true)
    AND docente_id = auth.uid()
  );

-- PACIENTES: Director ve todos, Docente solo los suyos
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director access all pacientes" ON pacientes;
DROP POLICY IF EXISTS "Docente access own pacientes" ON pacientes;

CREATE POLICY "Director access all pacientes" ON pacientes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'director' AND estado = true)
  );

CREATE POLICY "Docente access own pacientes" ON pacientes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'docente' AND estado = true)
    AND estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid())
  );

-- ATENCIONES
ALTER TABLE atenciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director access all atenciones" ON atenciones;
DROP POLICY IF EXISTS "Docente access own atenciones" ON atenciones;

CREATE POLICY "Director access all atenciones" ON atenciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'director' AND estado = true)
  );

CREATE POLICY "Docente access own atenciones" ON atenciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'docente' AND estado = true)
    AND estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid())
  );

-- RUBRICAS: Director todas, Docente ve pero no modifica
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director access all rubricas" ON rubricas;
DROP POLICY IF EXISTS "Docente access rubricas" ON rubricas;

CREATE POLICY "Director manage rubricas" ON rubricas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'director' AND estado = true)
  );

CREATE POLICY "Docente view rubricas" ON rubricas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE id = auth.uid() AND rol = 'docente' AND estado = true)
  );