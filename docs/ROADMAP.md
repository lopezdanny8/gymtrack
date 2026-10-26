# Roadmap central de GymTrack Web

## Objetivo

Construir una plataforma web de entrenamiento que convierta los datos del usuario en un perfil, un nivel explicable, un plan inicial y sesiones registrables. Se reutiliza la base técnica existente, pero toda la experiencia visible y la documentación del producto se mantienen bajo la identidad GymTrack.

## Alcance actual

El trabajo nuevo se limita a la página web responsive y a su backend Node.js. Android, iOS, Apple Watch y Capacitor se conservan únicamente por compatibilidad y no reciben nuevas funcionalidades en esta etapa.

## Fases

### Fase 0 — Base y decisiones

Estado: completada.

- Repositorio personal de GymTrack Web.
- Frontend React/Vite y backend Node.js funcionando.
- Identidad visible GymTrack.
- Plan, arquitectura, contrato OpenAPI y aviso de terceros documentados.
- Persistencia aislada de evaluación por usuario.

### Fase 1 — Onboarding web

Estado: en curso.

Orden aprobado:

1. Perfil físico: fecha de nacimiento, sexo masculino/femenino, talla en cm y peso en kg.
2. PAR-Q: siete preguntas, guardado progresivo y resumen de seguridad.
3. Experiencia y objetivo: meses entrenando, forma actual de progresar y objetivo principal.
4. Disponibilidad, sueño y equipamiento: días, duración, hora, descanso y recursos.
5. Resumen editable antes de continuar.

Cada pantalla debe poder cargar el borrador, validar sus propios campos y guardar sin borrar las secciones anteriores.

### Fase 2 — Evaluación y nivel

Estado: pendiente.

- Puntuar experiencia, frecuencia, fuerza relativa y forma de progresión.
- Mantener el nivel como decisión del servidor, no del usuario.
- Mostrar desglose y explicación.
- Confirmar antes el criterio de seis meses y dos días semanales.

### Fase 3 — Asignación del plan

Estado: pendiente.

- Buscar coincidencia por días, objetivo y nivel.
- Elegir la plantilla más cercana si no existe una coincidencia exacta.
- Explicar cualquier diferencia.
- Preparar la estructura del ciclo de cuatro semanas.

### Fase 4 — Primera sesión y progresión

Estado: pendiente.

- Abrir la sesión preparada usando el flujo web existente.
- Registrar series y RPE.
- Implementar la primera versión verificable de doble progresión.

### Fase 5 — Extensiones posteriores

Estado: fuera de la primera entrega.

Semáforo completo, sustituciones seguras, reprogramación, Coach IA, administración avanzada, autenticación adicional y migración gradual a MySQL.

## Decisiones confirmadas

- Altura visible como **Talla** y unidad **cm**; contrato interno `heightCm`.
- Peso en kilogramos; contrato interno `weightKg`.
- Sexo con exactamente dos opciones: `male` y `female`.
- PAR-Q separado del documento de entrenamientos existente.
- El backend conserva la autoridad para validar, puntuar y asignar.
- No se migra a MySQL hasta estabilizar entidades y relaciones.

## Punto actual

Las pantallas `/onboarding/profile`, `/onboarding/parq`, `/onboarding/experience`, `/onboarding/availability` y `/onboarding/summary` están implementadas y conectadas a `GET/PUT /api/gymtrack/assessment`. El onboarding base está completo; el siguiente paso es la fase de evaluación y nivel.

## Fuente de verdad para continuar

Leer `README.md`, este archivo, `docs/PROJECT_CONTEXT.md`, `plan.md`, `TODO.md` y `api/openapi.yaml`. Después revisar el código de la fase correspondiente antes de modificarlo.
