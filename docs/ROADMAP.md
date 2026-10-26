# Roadmap central de GymTrack Web

## Objetivo

Construir una plataforma web de entrenamiento que convierta los datos del usuario en un perfil, un nivel explicable, un plan inicial y sesiones registrables. Se reutiliza la base técnica existente, pero toda la experiencia visible y la documentación del producto se mantienen bajo la identidad GymTrack.

La visión completa, incluyendo la rutina semanal, el historial de progreso y el Coach IA contextual, está descrita en `docs/PRODUCT_VISION.md`.

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

Estado: completada para los campos del onboarding actualmente implementados.

Orden aprobado:

1. Perfil físico: fecha de nacimiento, sexo masculino/femenino, talla en cm y peso en kg.
2. PAR-Q: siete preguntas, guardado progresivo y resumen de seguridad.
3. Experiencia y objetivo: meses entrenando, forma actual de progresar y objetivo principal.
4. Disponibilidad, sueño y equipamiento: días, duración, hora, descanso y recursos.
5. Resumen editable antes de continuar.

Cada pantalla debe poder cargar el borrador, validar sus propios campos y guardar sin borrar las secciones anteriores.

P7 de la guía funcional pide meses entrenando, días que la persona entrena actualmente, mejor serie reciente de press de banca (kg × repeticiones), forma de progresar y objetivo. El paso web captura estos insumos, P9 conserva por separado los días disponibles, el backend deriva elegibilidad y calcula el nivel v1, y el resumen muestra su desglose. La generación de rutina sigue pendiente.

### Fase 2 — Evaluación y nivel

Estado: completada. Captura P7, elegibilidad, gate P8 y cálculo/visualización de nivel v1 están implementados; el endpoint de planes valida el gate server-side.

- [x] Capturar meses, frecuencia actual de entrenamiento, serie reciente de press (kg × repeticiones, si se dispone), forma de progresar y objetivo en el paso P7; mantener distinta la disponibilidad P9.
- [x] Alinear las opciones de P7 a sin registro / registra cargas / plan con RPE y fuerza / hipertrofia / recomposición / rendimiento.
- [x] Derivar en backend si la persona cumple el gate de 6 meses y 2 días de entrenamiento actual por semana, incluyendo causas de no elegibilidad.
- [x] Derivar el estado P8 combinado de elegibilidad + PAR-Q (`pending`/`blocked`/`passed`), incluidas causas de bloqueo y la recomendación de intensidad limitada ante respuestas positivas.
- [x] `POST /api/gymtrack/plan` impide generar si P8 está pendiente/bloqueado y exige PAR-Q completo; la vista web aún debe presentar los motivos y cómo corregirlos.
- [x] Implementar en servidor las reglas v1 de [GYMTRACK_LEVEL_PLAN_PROPOSAL.md](GYMTRACK_LEVEL_PLAN_PROPOSAL.md): bandas experiencia/frecuencia/progresión, Epley para 2–10 reps y cortes de fuerza relativa por sexo.
- [x] Con cuatro criterios completos, clasificar 0–4 como Intermedio y 5–8 como Avanzado; mostrar puntos, desglose y explicación.
- [ ] Reevaluar el nivel cada 8 semanas desde el inicio del plan o antes si el progreso lo justifica.
- [x] Si falta una serie válida, devolver Intermedio provisional sin puntaje total; al añadir una serie válida, recalcular en servidor.
- [x] El generador exige PAR-Q completo y, ante una respuesta positiva, guarda un borrador de baja intensidad `review_required` con `activationAllowed: false`; el gate interno no es autorización médica.

### Fase 3 — Asignación del plan

Estado: backend implementado; falta presentar el plan en `/gymtrack/routine` y agregarlo al calendario web mediante acción explícita.

- [x] Crear el catálogo GymTrack con ejercicios reales para 2–6 días y selección server-side por días, nivel y objetivo; ajustar la prescripción por objetivo/nivel y filtrar por el equipo P9.
- [x] Usar Full Body A/B (2 días), Full Body A/B/C (3), Upper/Lower A/B (4), Superior/Inferior/Empuje/Jalón/Inferior B (5) y PPL×2 (6). Si Full Body viola las 48 h en 2–3 días, elegir Superior/Inferior A o PPL, respectivamente.
- [x] Comprobar ejercicios válidos, sustituciones explicables y recuperación de al menos 48 h entre músculos principales; no persistir un plan incompleto si el equipo o el calendario no sirven.
- [x] Implementar `GET/POST /api/gymtrack/plan` con JSON privado separado por usuario, idempotencia por `assessment.updatedAt`, regeneración explícita del plan obsoleto y sin cambios a `openGym` al generar.
- [x] Describir Base, Progresión, Intensificación condicional (+2,5 kg según doble progresión y P10) y Descarga (−40 % de volumen); la descarga no es base del siguiente ciclo.
- [ ] Crear `/gymtrack/routine` para mostrar la semana, prescripción, ciclo, sustituciones, estado `review_required` y errores que requieran corregir disponibilidad.
- [ ] Aplicar solo mediante acción explícita: conservar rutinas existentes, reprogramar únicamente los días P9 y pedir confirmación ante colisiones; no cambiar modo de rotación y bloquear planes `review_required`.
- [ ] Ajustar volumen/cantidad de ejercicios para respetar la duración de sesión P9 y ejecutar doble progresión con datos de sesiones registrados.

### Fase 4 — Primera sesión y progresión

Estado: pendiente.

- Abrir la sesión preparada usando el flujo web existente.
- Registrar series y RPE.
- Implementar la primera versión verificable de doble progresión.

### Fase 5 — Coach IA contextual y extensiones posteriores

Estado: fuera de la primera entrega.

Coach IA con contexto autorizado, ajuste de sesiones por tiempo disponible, sustituciones seguras, reprogramación, semáforo completo, administración avanzada, autenticación adicional y migración gradual a MySQL.

## Decisiones confirmadas

- Altura visible como **Talla** y unidad **cm**; contrato interno `heightCm`.
- Peso en kilogramos; contrato interno `weightKg`.
- Sexo con exactamente dos opciones: `male` y `female`.
- PAR-Q separado del documento de entrenamientos existente.
- El backend conserva la autoridad para validar, puntuar y asignar.
- La guía funcional v7 fija el flujo y los cortes globales; las decisiones v1 no detalladas allí —puntos por respuesta, Epley, bandas de ratio, serie ausente y estructura 2–6 días— están documentadas en `GYMTRACK_LEVEL_PLAN_PROPOSAL.md`. Son heurísticas de producto que deben validarse con uso real.
- El flujo PAR-Q web actual solo cubre la revisión inicial; la versión oficial requiere preguntas de seguimiento tras un “sí” y restringe el uso electrónico del formulario sin permiso escrito. Verificar licencia o reemplazar el cuestionario propio antes del lanzamiento público; el gate no debe mostrarse como autorización médica.
- No se migra a MySQL hasta estabilizar entidades y relaciones.

## Punto actual

Las pantallas `/onboarding/profile`, `/onboarding/parq`, `/onboarding/experience`, `/onboarding/availability` y `/onboarding/summary` están conectadas a `GET/PUT /api/gymtrack/assessment`. El backend devuelve elegibilidad, gate P8 y nivel v1; `GET/POST /api/gymtrack/plan` genera y persiste planes GymTrack v1 en un JSON privado separado. El siguiente trabajo es crear `/gymtrack/routine` y la acción segura de Aplicar Plan a la semana activa.

## Fuente de verdad para continuar

Leer `README.md`, este archivo, `docs/PROJECT_CONTEXT.md`, `plan.md`, `TODO.md` y `api/openapi.yaml`. Después revisar el código de la fase correspondiente antes de modificarlo.
