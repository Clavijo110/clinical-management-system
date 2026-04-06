-- ============================================================
-- Asignar rol director o docente (mismo correo que en Authentication)
-- Supabase → SQL Editor
-- ============================================================
--
-- ERROR 23505 duplicate key user_roles_email_key:
-- Ya existe una fila con ese correo pero con OTRO uuid (datos de prueba).
-- Ejecuta primero el BLOQUE A (limpia la fila incorrecta), luego el BLOQUE B.
--
-- ============================================================
-- BLOQUE A — Quitar fila huérfana (mismo email, id distinto al de Auth)
-- Sustituye el correo en las tres apariciones de v_correo.
-- ============================================================

DO $$
DECLARE
  v_correo text := lower(trim('docente1@uv.clinica'));
  v_auth_id uuid;
BEGIN
  SELECT u.id INTO v_auth_id
  FROM auth.users u
  WHERE lower(trim(u.email::text)) = v_correo
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario en auth.users con ese correo. Créalo en Authentication primero.';
  END IF;

  -- Estudiantes que apuntaban al uuid viejo (opcional, evita error de FK al borrar)
  UPDATE public.estudiantes e
  SET docente_id = NULL
  WHERE e.docente_id IN (
    SELECT ur.id
    FROM public.user_roles ur
    WHERE lower(trim(ur.email)) = v_correo
      AND ur.id <> v_auth_id
  );

  DELETE FROM public.user_roles ur
  WHERE lower(trim(ur.email)) = v_correo
    AND ur.id <> v_auth_id;

  RAISE NOTICE 'Filas conflictivas eliminadas. auth id correcto: %', v_auth_id;
END $$;

-- ============================================================
-- BLOQUE B — Insertar / actualizar la fila correcta
-- Mismo v_correo que arriba; elige rol 'director' o 'docente'
-- ============================================================

INSERT INTO public.user_roles (id, email, rol, estado)
SELECT u.id, u.email::text, 'docente', true
FROM auth.users u
WHERE lower(trim(u.email::text)) = lower(trim('docente1@uv.clinica'))
ON CONFLICT (id) DO UPDATE SET
  rol = EXCLUDED.rol,
  estado = true,
  email = EXCLUDED.email,
  updated_at = now();

-- Para director, cambia 'docente' por 'director' en la línea del SELECT y en EXCLUDED.rol coherente:
-- INSERT ... SELECT ..., 'director', true ... ON CONFLICT ... rol = EXCLUDED.rol

-- Comprobar:
-- SELECT ur.id, ur.email, ur.rol, ur.estado, au.email AS auth_email
-- FROM public.user_roles ur
-- JOIN auth.users au ON au.id = ur.id
-- WHERE lower(ur.email) = lower('docente1@uv.clinica');

-- ============================================================
-- Si el SELECT de auth.users no devuelve filas para ese correo,
-- el usuario no existe en Authentication → Users.
-- ============================================================
