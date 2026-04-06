# FICHA RESUMEN — TRABAJO DE GRADO

**Facultad de Ingeniería**  
**Programa:** Ingeniería Biomédica (ajustar si corresponde otro nombre oficial)

---

## Modalidad

**5. Monografía** ☑ (marcar según formato impreso)

---

## Título propuesto

**Sistema web de gestión clínica y académica para el seguimiento de residentes en ortodoncia: diseño e implementación de una aplicación con autenticación, roles y reportes en la nube.**

*Título alternativo más corto (si lo exige el formulario):*  
*Plataforma digital para la gestión de pacientes, atenciones y evaluación en un programa de posgrado clínico en ortodoncia.*

---

## Autores

| Nombre completo | Código | Programa | Tel. / Celular |
|-----------------|--------|----------|----------------|
| *(completar)* | *(completar)* | Ingeniería Biomédica | *(completar)* |
| *(si aplica segundo autor)* | | | |

---

## Director sugerido

*(Nombre del docente que orientará el trabajo — completar)*

---

## Área profesional del programa en la que se enmarca el proyecto

**Tecnologías de la información en salud e ingeniería clínica**, en coherencia con competencias típicas del perfil de egreso en Ingeniería Biomédica: aplicación de principios de ingeniería, sistemas y datos al entorno asistencial y formativo, con énfasis en **calidad, trazabilidad, seguridad de la información y usabilidad** para usuarios clínicos y académicos.

---

## Planteamiento del problema

*(Máximo 400 palabras — texto listo para copiar al formato PDF oficial.)*

En programas de posgrado clínico, como el de ortodoncia, conviven actividades académicas (seguimiento por semestres, asignación de docentes supervisores) y actividades asistenciales (pacientes, evolución, procedimientos y rúbricas de evaluación). Con frecuencia, la información reside en hojas de cálculo dispersas, correos o registros manuales, lo que dificulta la **consistencia de los datos**, la **auditoría** de las atenciones y la **generación oportuna de reportes** para dirección y docencia.

Esta fragmentación incrementa el riesgo de errores en la trazabilidad paciente–residente–supervisor, retrasa la visión agregada del programa (por ejemplo, atenciones por periodo o por semestre) y complica el cumplimiento de buenas prácticas de manejo de información sensible. Los directivos requieren indicadores confiables; los docentes, acceso acotado a sus estudiantes y pacientes; los estudiantes, un registro claro de su actividad clínica.

Desde la Ingeniería Biomédica es pertinente abordar el problema mediante el **diseño y la implementación de un sistema web** que centralice datos en una base gestionada en la nube, con **control de acceso por roles** (director y docente), módulos alineados a la operación real (estudiantes, pacientes, atenciones, rúbricas, reportes exportables) y una interfaz usable en contexto educativo-clínico. El trabajo se orienta a entregar un **producto funcional documentado**, evaluable en términos de arquitectura, seguridad (incluidas políticas de acceso a datos) y utilidad para la institución o unidad académica que lo adopte como piloto.

Así, el problema se formula así: **¿cómo diseñar e implementar una aplicación web segura y escalable que integre la gestión académica y clínica del posgrado, mejorando la disponibilidad de la información y la generación de reportes para la toma de decisiones?** La solución propuesta se delimita a un sistema prototipo desplegable, con autenticación, modelo de datos acorde a las entidades del dominio y validación conceptual con usuarios clave del programa.

*(Palabras aproximadas del cuerpo: ~290; ajustar si el comité pide acercarse al tope de 400 ampliando impacto institucional o metodología.)*

---

## Objetivos (planteamiento inicial)

### Objetivo general

Diseñar e implementar un **sistema web de gestión clínica y académica** para un programa de posgrado en ortodoncia, utilizando una arquitectura cliente–servidor con **React**, **Supabase** (base de datos, autenticación y políticas de seguridad a nivel de fila) y despliegue acorde a buenas prácticas, que permita a directivos y docentes administrar estudiantes, pacientes, atenciones, rúbricas y reportes de forma integrada.

### Objetivos específicos

1. **Levantar y formalizar requisitos** funcionales y no funcionales (roles, flujos de trabajo, entidades: estudiantes, pacientes, atenciones, usuarios y configuración) a partir del contexto del posgrado y de la literatura sobre sistemas de información en salud educativa.

2. **Definir el modelo de datos y la política de acceso** (tablas, relaciones, RLS y sincronización con usuarios de autenticación) garantizando que cada rol acceda solo a la información permitida.

3. **Desarrollar los módulos principales de la aplicación**: paneles por rol, gestión de estudiantes y pacientes, registro de atenciones, rúbricas (director), reportes con exportación (por ejemplo PDF/Excel), configuración institucional y vistas analíticas básicas, documentando decisiones de interfaz y arquitectura.

4. **Validar el sistema** mediante pruebas funcionales, revisión de consistencia de datos y, si es posible, **retroalimentación** con al menos un directivo o docente del programa, para identificar mejoras y límites del alcance.

---

## Nota institucional (texto de la plantilla)

*Tener en cuenta que la aprobación de la temática es una guía para formular su anteproyecto y puede ser objeto de modificaciones (título, objetivos y planteamiento del problema).*

---

## Espacio exclusivo para el Comité de Programa

*(En el PDF impreso: análisis del tema — Pertinencia, Utilidad, Creatividad — observaciones, aprobación y firma. Este documento no rellena esa sección.)*

| Criterio | SÍ | NO |
|----------|----|----|
| Pertinencia: relación con el perfil de egreso | ☐ | ☐ |
| Utilidad: beneficio institucional / comunidad / realidad | ☐ | ☐ |
| Creatividad: resultados o enfoque novedoso | ☐ | ☐ |

**Observaciones:**  
_______________________________________________________________________________

**La temática es:** ☐ Aprobada ☐ Aprobada con modificaciones ☐ Rechazada  

**Director asignado:** _______________________________________________________________________________

**Firma Director de Programa**   **Fecha:** ____________________

---

## Referencias del producto de grado (repositorio)

- **Repositorio:** `https://github.com/Clavijo110/clinical-management-system`  
- **Stack principal:** React 18, React Router, Material UI, Supabase (PostgreSQL + Auth), jsPDF / XLSX para reportes.  
- **Scripts SQL de apoyo en el repo:** `ASIGNAR_ROL_POR_EMAIL.sql`, `VINCULAR_DOCENTES.sql`, `RLS_USER_ROLES_LEER_PROPIO.sql`, entre otros.

---

*Documento generado para alinear el contenido con la estructura de “Ficha Temática / Ficha Resumen — otras modalidades (Monografía)” de la Facultad de Ingeniería. Copiar los bloques completados al PDF oficial o ajustar formato según instructivo del programa.*
