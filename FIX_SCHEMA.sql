-- ============================================
-- SCRIPT DE CORRECCIÓN DE ESQUEMA FINAL
-- ============================================
-- Este script alinea TODA la base de datos con el frontend y el sistema de roles

-- 1. ASEGURAR TABLA DE ROLES
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  rol TEXT CHECK (rol IN ('director', 'docente')) NOT NULL,
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CORREGIR TABLA 'ESTUDIANTES'
-- Eliminar restricciones antiguas si existen
ALTER TABLE estudiantes DROP CONSTRAINT IF EXISTS estudiantes_docente_id_fkey;
-- Asegurar que apunte a auth.users
ALTER TABLE estudiantes 
ADD CONSTRAINT estudiantes_docente_id_fkey 
FOREIGN KEY (docente_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. CORREGIR TABLA 'ATENCIONES' (Alineación con el frontend)
-- Añadir columnas faltantes si no existen
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='atenciones' AND column_name='diagnostico') THEN
        ALTER TABLE atenciones ADD COLUMN diagnostico TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='atenciones' AND column_name='tratamiento') THEN
        ALTER TABLE atenciones ADD COLUMN tratamiento TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='atenciones' AND column_name='estado') THEN
        ALTER TABLE atenciones ADD COLUMN estado TEXT DEFAULT 'completada';
    END IF;
END $$;

-- 5. CORREGIR TABLA 'RUBRICAS' (Alineación con el frontend)
DROP TABLE IF EXISTS rubricas CASCADE;
CREATE TABLE rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semestre INTEGER NOT NULL,
  criterios_minimos TEXT NOT NULL,
  calidad_esperada TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;

-- 7. FUNCIONES DE AYUDA (Para evitar recursión en RLS)
CREATE OR REPLACE FUNCTION public.check_is_director()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE id = auth.uid() AND rol = 'director'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. POLÍTICAS DE SEGURIDAD (Limpiar y recrear)
-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Allow authenticated read" ON user_roles;
DROP POLICY IF EXISTS "Directors manage all" ON user_roles;

-- Políticas para user_roles
CREATE POLICY "Allow authenticated read" ON user_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Directors manage all" ON user_roles FOR ALL USING (public.check_is_director());

-- Políticas para rubricas
DROP POLICY IF EXISTS "Anyone can view rubricas" ON rubricas;
DROP POLICY IF EXISTS "Directors can manage rubricas" ON rubricas;
CREATE POLICY "Anyone can view rubricas" ON rubricas FOR SELECT USING (true);
CREATE POLICY "Directors can manage rubricas" ON rubricas FOR ALL USING (public.check_is_director());

-- Políticas para estudiantes
DROP POLICY IF EXISTS "Director access all estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "Docente access own estudiantes" ON estudiantes;
CREATE POLICY "Director access all estudiantes" ON estudiantes FOR ALL USING (public.check_is_director());
CREATE POLICY "Docente access own estudiantes" ON estudiantes FOR ALL USING (docente_id = auth.uid());

-- Políticas para pacientes
DROP POLICY IF EXISTS "Director access all pacientes" ON pacientes;
DROP POLICY IF EXISTS "Docente access own pacientes" ON pacientes;
CREATE POLICY "Director access all pacientes" ON pacientes FOR ALL USING (public.check_is_director());
CREATE POLICY "Docente access own pacientes" ON pacientes FOR ALL USING (
    estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid())
);

-- Políticas para atenciones
DROP POLICY IF EXISTS "Director access all atenciones" ON atenciones;
DROP POLICY IF EXISTS "Docente access own atenciones" ON atenciones;
CREATE POLICY "Director access all atenciones" ON atenciones FOR ALL USING (public.check_is_director());
CREATE POLICY "Docente access own atenciones" ON atenciones FOR ALL USING (
    estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid())
);

DO $$ 
BEGIN 
    RAISE NOTICE 'Esquema, funciones y políticas corregidas exitosamente.';
END $$;
