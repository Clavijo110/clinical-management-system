-- Si solo existe la política "Directors manage all" (FOR ALL), los DOCENTES no pueden
-- leer su propia fila y la app muestra "sin rol" aunque exista en user_roles.
-- Ejecuta esto en Supabase → SQL Editor:

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Comprueba políticas actuales:
-- SELECT policyname, cmd, qual::text FROM pg_policies WHERE tablename = 'user_roles';
