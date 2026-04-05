-- Usuarios (Docentes y Director)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rol TEXT CHECK (rol IN ('director', 'docente')) NOT NULL,
  password_hash TEXT NOT NULL
);

-- Estudiantes
CREATE TABLE estudiantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  docente_id UUID REFERENCES users(id),
  semestre_actual INTEGER CHECK (semestre_actual BETWEEN 1 AND 6),
  estado TEXT CHECK (estado IN ('activo', 'retirado')) DEFAULT 'activo'
);

-- Pacientes
CREATE TABLE pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  edad INTEGER,
  foto TEXT, -- URL de la imagen
  diagnostico TEXT,
  tipo_maloclusion TEXT,
  quirurgico BOOLEAN DEFAULT FALSE,
  extracciones BOOLEAN DEFAULT FALSE,
  notas TEXT,
  estudiante_id UUID REFERENCES estudiantes(id),
  semestre INTEGER CHECK (semestre BETWEEN 0 AND 5),
  fecha_ingreso DATE NOT NULL
);

-- Atenciones
CREATE TABLE atenciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id) NOT NULL,
  estudiante_id UUID REFERENCES estudiantes(id) NOT NULL,
  fecha DATE NOT NULL,
  procedimiento TEXT,
  observaciones TEXT,
  semestre INTEGER CHECK (semestre BETWEEN 0 AND 5)
);

-- Rúbricas
CREATE TABLE rubricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  semestre INTEGER CHECK (semestre BETWEEN 1 AND 6) NOT NULL,
  criterios JSONB NOT NULL -- Ej: {"cantidad_atenciones": 10, "calidad": "alta", etc.}
);

-- Políticas de RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubricas ENABLE ROW LEVEL SECURITY;

-- Políticas para Director: acceso total
CREATE POLICY "Director access all" ON users FOR ALL USING (auth.jwt() ->> 'rol' = 'director');
CREATE POLICY "Director access all estudiantes" ON estudiantes FOR ALL USING (auth.jwt() ->> 'rol' = 'director');
CREATE POLICY "Director access all pacientes" ON pacientes FOR ALL USING (auth.jwt() ->> 'rol' = 'director');
CREATE POLICY "Director access all atenciones" ON atenciones FOR ALL USING (auth.jwt() ->> 'rol' = 'director');
CREATE POLICY "Director access all rubricas" ON rubricas FOR ALL USING (auth.jwt() ->> 'rol' = 'director');

-- Políticas para Docente: solo sus estudiantes y pacientes
CREATE POLICY "Docente access own" ON users FOR SELECT USING (auth.uid() = id AND auth.jwt() ->> 'rol' = 'docente');
CREATE POLICY "Docente access own estudiantes" ON estudiantes FOR ALL USING (docente_id = auth.uid());
CREATE POLICY "Docente access own pacientes" ON pacientes FOR ALL USING (estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid()));
CREATE POLICY "Docente access own atenciones" ON atenciones FOR ALL USING (estudiante_id IN (SELECT id FROM estudiantes WHERE docente_id = auth.uid()));
CREATE POLICY "Docente access rubricas" ON rubricas FOR ALL USING (auth.jwt() ->> 'rol' = 'docente');