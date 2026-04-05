-- ============================================
-- SCRIPT DE POBLACIÓN DE DATOS DE PRUEBA (FINAL)
-- ============================================
-- IMPORTANTE: Ejecuta FIX_SCHEMA.sql antes que este script.
-- Este script asume que los usuarios ya existen en Supabase Authentication.

DO $$
DECLARE
    id_director UUID;
    id_docente_1 UUID;
    id_docente_2 UUID;
    id_est_1 UUID;
    id_est_2 UUID;
    id_est_3 UUID;
    id_pac_1 UUID;
    id_pac_2 UUID;
    id_pac_3 UUID;
BEGIN
    -- 1. Obtener IDs de usuarios desde Auth (Búsqueda robusta)
    SELECT id INTO id_director FROM auth.users WHERE LOWER(email) = LOWER('director@uv.clinica');
    SELECT id INTO id_docente_1 FROM auth.users WHERE LOWER(email) = LOWER('docente@uv.clinica');
    SELECT id INTO id_docente_2 FROM auth.users WHERE LOWER(email) = LOWER('alejandro.clavijo_a@uao.edu.co');

    -- Mensajes de diagnóstico
    IF id_director IS NULL THEN RAISE WARNING 'No se encontró director@uv.clinica en Auth'; END IF;
    IF id_docente_1 IS NULL THEN RAISE WARNING 'No se encontró docente@uv.clinica en Auth'; END IF;
    IF id_docente_2 IS NULL THEN RAISE WARNING 'No se encontró alejandro.clavijo_a@uao.edu.co en Auth'; END IF;

    -- 2. Asegurar Roles en user_roles
    IF id_director IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado) 
        VALUES (id_director, 'director@uv.clinica', 'director', true) 
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol director asignado a director@uv.clinica';
    END IF;

    IF id_docente_1 IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado) 
        VALUES (id_docente_1, 'docente@uv.clinica', 'docente', true) 
        ON CONFLICT (id) DO UPDATE SET rol = 'docente', estado = true;
        RAISE NOTICE 'Rol docente asignado a docente@uv.clinica';
    END IF;

    IF id_docente_2 IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado) 
        VALUES (id_docente_2, 'alejandro.clavijo_a@uao.edu.co', 'director', true) 
        ON CONFLICT (id) DO UPDATE SET rol = 'director', estado = true;
        RAISE NOTICE 'Rol director asignado a alejandro.clavijo_a@uao.edu.co';
    END IF;

    -- 3. Limpiar datos previos para evitar duplicados en pruebas
    DELETE FROM atenciones;
    DELETE FROM pacientes;
    DELETE FROM estudiantes;
    DELETE FROM rubricas;

    -- 4. Crear Estudiantes (Residentes)
    IF id_docente_1 IS NOT NULL THEN
        INSERT INTO estudiantes (nombre, docente_id, semestre_actual, estado) 
        VALUES ('Juan Perez (Residente R1)', id_docente_1, 1, 'activo') RETURNING id INTO id_est_1;
        
        INSERT INTO estudiantes (nombre, docente_id, semestre_actual, estado) 
        VALUES ('Maria Garcia (Residente R2)', id_docente_1, 2, 'activo') RETURNING id INTO id_est_2;
    END IF;

    IF id_docente_2 IS NOT NULL THEN
        INSERT INTO estudiantes (nombre, docente_id, semestre_actual, estado) 
        VALUES ('Carlos Rodriguez (Residente R3)', id_docente_2, 3, 'activo') RETURNING id INTO id_est_3;
    END IF;

    -- 5. Crear Pacientes
    IF id_est_1 IS NOT NULL THEN
        INSERT INTO pacientes (nombre, telefono, edad, diagnostico, tipo_maloclusion, quirurgico, extracciones, notas, estudiante_id, semestre, fecha_ingreso)
        VALUES ('Ana López', '3001234567', 24, 'Apiñamiento severo superior e inferior', 'Clase I', false, true, 'Paciente colaborador.', id_est_1, 1, '2024-01-15')
        RETURNING id INTO id_pac_1;
    END IF;

    IF id_est_2 IS NOT NULL THEN
        INSERT INTO pacientes (nombre, telefono, edad, diagnostico, tipo_maloclusion, quirurgico, extracciones, notas, estudiante_id, semestre, fecha_ingreso)
        VALUES ('Pedro Marmol (Quirúrgico)', '3109876543', 19, 'Prognatismo mandibular severo', 'Clase III', true, false, 'Valoración maxilofacial.', id_est_2, 2, '2024-02-20')
        RETURNING id INTO id_pac_2;
    END IF;

    IF id_est_3 IS NOT NULL THEN
        INSERT INTO pacientes (nombre, telefono, edad, diagnostico, tipo_maloclusion, quirurgico, extracciones, notas, estudiante_id, semestre, fecha_ingreso)
        VALUES ('Lucía Fernández', '3201112233', 35, 'Mordida abierta anterior', 'Clase II', false, false, 'Uso de elásticos.', id_est_3, 3, '2024-03-10')
        RETURNING id INTO id_pac_3;
    END IF;

    -- 6. Crear Atenciones
    IF id_pac_1 IS NOT NULL AND id_est_1 IS NOT NULL THEN
        INSERT INTO atenciones (paciente_id, estudiante_id, fecha, diagnostico, tratamiento, observaciones, semestre, estado)
        VALUES (id_pac_1, id_est_1, '2024-03-01', 'Apiñamiento moderado', 'Cementación de brackets superiores', 'Inicio de tratamiento.', 1, 'completada');
    END IF;

    IF id_pac_2 IS NOT NULL AND id_est_2 IS NOT NULL THEN
        INSERT INTO atenciones (paciente_id, estudiante_id, fecha, diagnostico, tratamiento, observaciones, semestre, estado)
        VALUES (id_pac_2, id_est_2, '2024-03-05', 'Clase III esquelética', 'Control pre-quirúrgico', 'Nivelación progresando.', 2, 'completada');
    END IF;

    -- 7. Crear Rúbricas (Alineado con el nuevo esquema)
    INSERT INTO rubricas (semestre, criterios_minimos, calidad_esperada, observaciones)
    VALUES 
    (1, 'Mínimo 5 pacientes, 10 atenciones.', 'Correcta cementación.', 'Fundamentación clínica.'),
    (2, 'Mínimo 8 pacientes, 20 atenciones.', 'Manejo de arcos de acero.', 'Biomecánica básica.'),
    (3, 'Mínimo 10 pacientes, 30 atenciones.', 'Manejo de elásticos.', 'Mecánica de cierre.');

    RAISE NOTICE 'Población de datos completada exitosamente.';
END $$;
