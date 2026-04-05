-- ============================================
-- SCRIPT DE POBLACIÓN MASIVA DE DATOS
-- ============================================
-- IMPORTANTE: Ejecuta FIX_SCHEMA.sql antes que este script.
-- Este script crea un entorno clínico completo con múltiples docentes, residentes y pacientes.

DO $$
DECLARE
    -- IDs de Directores (Deben existir en Supabase Auth)
    id_dir_1 UUID;
    id_dir_2 UUID;
    
    -- Arrays para almacenar IDs generados
    docente_ids UUID[] := '{}';
    estudiante_ids UUID[] := '{}';
    paciente_ids UUID[] := '{}';
    
    -- Variables temporales
    temp_id UUID;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    
    -- Datos para aleatoriedad
    nombres_docentes TEXT[] := ARRAY['Dr. Roberto Gomez', 'Dra. Elena Torres', 'Dr. Miguel Angel', 'Dra. Claudia Lopez', 'Dr. Fernando Ruiz'];
    nombres_estudiantes TEXT[] := ARRAY['Est. Camilo', 'Est. Valentina', 'Est. Sebastian', 'Est. Isabella', 'Est. Mateo', 'Est. Mariana', 'Est. Nicolas', 'Est. Sofia', 'Est. Lucas', 'Est. Daniela'];
    apellidos TEXT[] := ARRAY['Perez', 'Rodriguez', 'Martinez', 'Garcia', 'Sanchez', 'Gomez', 'Lopez', 'Diaz', 'Torres', 'Ramirez'];
    diagnosticos TEXT[] := ARRAY['Apiñamiento severo', 'Clase II división 1', 'Mordida abierta anterior', 'Clase III esquelética', 'Biprotrusión dental', 'Sobremordida profunda'];
    procedimientos TEXT[] := ARRAY['Alineación y nivelación', 'Cementación de brackets', 'Cierre de espacios', 'Control de elásticos', 'Finalización y detallado'];
BEGIN
    -- 1. OBTENER DIRECTORES DESDE AUTH
    SELECT id INTO id_dir_1 FROM auth.users WHERE LOWER(email) = LOWER('director@uv.clinica');
    SELECT id INTO id_dir_2 FROM auth.users WHERE LOWER(email) = LOWER('alejandro.clavijo_a@uao.edu.co');

    -- 2. LIMPIEZA DE DATOS (Opcional, para empezar de cero)
    DELETE FROM atenciones;
    DELETE FROM pacientes;
    DELETE FROM estudiantes;
    DELETE FROM rubricas;
    DELETE FROM user_roles WHERE rol = 'docente'; -- Mantener directores

    -- 3. ASEGURAR DIRECTORES EN user_roles
    IF id_dir_1 IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado) VALUES (id_dir_1, 'director@uv.clinica', 'director', true) ON CONFLICT (id) DO UPDATE SET rol = 'director';
    END IF;
    IF id_dir_2 IS NOT NULL THEN
        INSERT INTO user_roles (id, email, rol, estado) VALUES (id_dir_2, 'alejandro.clavijo_a@uao.edu.co', 'director', true) ON CONFLICT (id) DO UPDATE SET rol = 'director';
    END IF;

    -- 4. CREAR DOCENTES DE PRUEBA (Simulados en user_roles)
    -- Nota: En un sistema real, cada docente debería tener una cuenta en auth.users. 
    -- Para estas pruebas de visualización, crearemos registros en user_roles vinculados a UUIDs generados.
    FOR i IN 1..5 LOOP
        temp_id := gen_random_uuid();
        INSERT INTO user_roles (id, email, rol, estado) 
        VALUES (temp_id, 'docente' || i || '@uv.clinica', 'docente', true);
        docente_ids := array_append(docente_ids, temp_id);
    END LOOP;

    RAISE NOTICE 'Docentes creados: %', array_length(docente_ids, 1);

    -- 5. CREAR ESTUDIANTES (2 por cada docente)
    FOR i IN 1..array_length(docente_ids, 1) LOOP
        FOR j IN 1..2 LOOP
            INSERT INTO estudiantes (nombre, docente_id, semestre_actual, estado)
            VALUES (
                nombres_estudiantes[(i+j) % 10 + 1] || ' ' || apellidos[i % 10 + 1],
                docente_ids[i],
                (i % 6) + 1,
                'activo'
            ) RETURNING id INTO temp_id;
            estudiante_ids := array_append(estudiante_ids, temp_id);
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Estudiantes creados: %', array_length(estudiante_ids, 1);

    -- 6. CREAR PACIENTES (3 por cada estudiante)
    FOR i IN 1..array_length(estudiante_ids, 1) LOOP
        FOR j IN 1..3 LOOP
            INSERT INTO pacientes (nombre, telefono, edad, diagnostico, tipo_maloclusion, quirurgico, extracciones, notas, estudiante_id, semestre, fecha_ingreso)
            VALUES (
                'Paciente ' || i || '-' || j,
                '300' || (1000000 + (i*10) + j),
                15 + (i % 30),
                diagnosticos[(i+j) % 6 + 1],
                'Clase ' || ((i % 3) + 1),
                (i % 4 = 0),
                (j % 2 = 0),
                'Notas de prueba para el paciente ' || j,
                estudiante_ids[i],
                (i % 6),
                CURRENT_DATE - (i * 5 || ' days')::interval
            ) RETURNING id INTO temp_id;
            paciente_ids := array_append(paciente_ids, temp_id);
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Pacientes creados: %', array_length(paciente_ids, 1);

    -- 7. CREAR ATENCIONES (2 por cada paciente)
    FOR i IN 1..array_length(paciente_ids, 1) LOOP
        -- Obtener el estudiante asignado a este paciente
        SELECT estudiante_id INTO temp_id FROM pacientes WHERE id = paciente_ids[i];
        
        FOR k IN 1..2 LOOP
            INSERT INTO atenciones (paciente_id, estudiante_id, fecha, diagnostico, tratamiento, observaciones, semestre, estado)
            VALUES (
                paciente_ids[i],
                temp_id,
                CURRENT_DATE - (k * 15 || ' days')::interval,
                'Seguimiento de ' || diagnosticos[i % 6 + 1],
                procedimientos[(i+k) % 5 + 1],
                'Evolución satisfactoria en la sesión ' || k,
                (i % 6),
                'completada'
            );
        END LOOP;
    END LOOP;

    -- 8. CREAR RÚBRICAS PARA LOS 6 SEMESTRES
    FOR i IN 1..6 LOOP
        INSERT INTO rubricas (semestre, criterios_minimos, calidad_esperada, observaciones)
        VALUES (
            i,
            'Requisitos del Semestre ' || i || ': Mínimo ' || (i * 2) || ' pacientes y ' || (i * 5) || ' atenciones.',
            'Calidad esperada para nivel R' || ((i+1)/2)::int || '.',
            'Evaluación estándar del programa de Ortodoncia.'
        );
    END LOOP;

    RAISE NOTICE 'POBLACIÓN MASIVA COMPLETADA EXITOSAMENTE';
END $$;
