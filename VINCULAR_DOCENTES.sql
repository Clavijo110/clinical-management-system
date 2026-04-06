-- Ejecutar en Supabase → SQL Editor (una vez).
-- Permite que un director vincule cuentas ya creadas en Authentication con rol docente en user_roles.

CREATE OR REPLACE FUNCTION public.vincular_docente_por_email(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE id = auth.uid() AND rol = 'director' AND estado = true
  ) THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Solo un director activo puede vincular docentes.'
    );
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RETURN json_build_object('ok', false, 'error', 'Correo inválido.');
  END IF;

  SELECT u.id INTO v_uid
  FROM auth.users u
  WHERE lower(trim(u.email::text)) = v_email
  LIMIT 1;

  IF v_uid IS NULL THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'No hay cuenta en Authentication con ese correo. Crea el usuario en Supabase → Authentication → Users.'
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_roles WHERE id = v_uid AND rol = 'director' AND estado = true
  ) THEN
    RETURN json_build_object(
      'ok', false,
      'error', 'Este usuario ya es director; no se cambia el rol desde aquí.'
    );
  END IF;

  INSERT INTO user_roles (id, email, rol, estado, updated_at)
  VALUES (v_uid, v_email, 'docente', true, now())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    rol = 'docente',
    estado = true,
    updated_at = now();

  RETURN json_build_object('ok', true, 'message', 'Docente vinculado correctamente.');
END;
$$;

REVOKE ALL ON FUNCTION public.vincular_docente_por_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vincular_docente_por_email(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Opcional (arreglo masivo, revisar antes de ejecutar):
-- Asigna rol docente a todo usuario de Auth que aún no tenga fila en user_roles.
-- Puede incluir cuentas que no sean docentes; filtra por dominio si aplica.
--
-- INSERT INTO public.user_roles (id, email, rol, estado)
-- SELECT u.id, u.email::text, 'docente', true
-- FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.id = u.id)
--   AND u.email IS NOT NULL
--   AND u.email::text ILIKE '%@uao.edu.co';
-- ---------------------------------------------------------------------------
