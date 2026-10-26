# Plan inicial de GymTrack Web

## Alcance aprobado

Construir progresivamente el flujo central de GymTrack sobre el código existente de openGym, sin reescribir la aplicación ni romper las funciones actuales:

1. onboarding y evaluación inicial;
2. cálculo explicado del nivel;
3. asignación de un plan exacto o de la plantilla más cercana;
4. preparación de la primera sesión;
5. registro de series y RPE;
6. primera versión verificable de la doble progresión.

El alcance es exclusivamente la página web responsive. Android, iOS, Capacitor, notificaciones nativas y cualquier flujo específico de aplicaciones móviles quedan fuera de esta fase; el código móvil existente se conserva sin modificaciones.

El semáforo completo, sustituciones seguras, reprogramación, IA refinada, administración avanzada y MySQL quedan fuera de la primera entrega, aunque se diseñarán puntos de extensión para ellos.

## Principios de implementación

- Mantener `frontend/` como React/Vite y `api/` como backend Node.js existente.
- No eliminar ni reemplazar las rutas actuales de openGym.
- Encapsular las nuevas reglas en módulos puros y testeables antes de conectarlas a HTTP o React.
- Persistir inicialmente mediante una capa de repositorios compatible con el almacenamiento actual; no hacer todavía una migración masiva a MySQL.
- Guardar explicaciones y versiones de las reglas para que el nivel y el plan sean auditables.
- Tratar PAR-Q, molestias, sueño y datos físicos como información sensible desde el diseño, aunque la auditoría avanzada se implemente después.
- Mantener separada la lógica de dominio de los componentes visuales web, aunque la primera entrega solo se consuma desde el frontend web.

## Flujo funcional de la primera entrega

```text
Cuenta existente o nueva
  -> Perfil físico
  -> PAR-Q
  -> Experiencia, frecuencia, fuerza relativa y progresión
  -> Objetivo
  -> Disponibilidad, sueño y equipamiento
  -> Nivel calculado con explicación
  -> Plan exacto o plantilla más cercana
  -> Sesión preparada
  -> Series + RPE
```

## Diseño técnico

### Frontend

Se añadirán pantallas o vistas de onboarding reutilizando el sistema visual, navegación, traducciones y estado existentes. El frontend validará entradas para dar respuesta inmediata, pero el servidor será la autoridad para calcular nivel y asignar plan.

### Backend

Se crearán módulos de dominio separados de `server.js`, inicialmente en una estructura compatible con el repositorio actual:

```text
api/
├── gymtrack/
│   ├── assessment.js       Perfil, experiencia y nivel
│   ├── assessment.test.js
│   ├── plan-assignment.js  Coincidencia exacta y plantilla cercana
│   ├── plan-assignment.test.js
│   ├── progression.js      Regla inicial de doble progresión
│   └── progression.test.js
└── server.js               Integración de rutas sin romper las actuales
```

Los nombres y ubicación pueden ajustarse después de inspeccionar los módulos existentes. La regla de dominio no debe leer directamente desde React.

### Persistencia

Primera etapa: extender el documento/estado existente o un repositorio de transición, con versionado y migración tolerante para perfiles que todavía no tienen evaluación GymTrack.

Etapa posterior: implementar `MysqlRepository` detrás de la misma interfaz cuando el modelo esté validado. No se añadirá una dependencia MySQL ni un esquema definitivo durante esta primera entrega.

## Reglas iniciales a implementar

- La altura se registra únicamente en centímetros (`heightCm`).
- El peso se registra únicamente en kilogramos (`weightKg`).
- El sexo del perfil se registra con una de dos opciones: masculino (`male`) o femenino (`female`). No se ofrece una tercera opción en el onboarding web.
- El nivel no lo elige el usuario.
- P7 captura meses entrenando, días que la persona entrena actualmente, mejor serie reciente de press de banca (kg × repeticiones), forma de progresar (sin registro, registra cargas, plan con RPE) y objetivo (fuerza, hipertrofia, recomposición, rendimiento).
- `experience.trainingDaysPerWeek` representa la frecuencia actual de entrenamiento de P7. No se debe reutilizar `availability.daysPerWeek` de P9, que expresa disponibilidad futura para el plan.
- La regla de puntuación v1 está definida en `docs/GYMTRACK_LEVEL_PLAN_PROPOSAL.md`; el servidor es la autoridad y descarta cualquier puntaje/nivel enviado por el cliente.
- Experiencia: 6 a <12 meses = 0; 12–36 meses = 1; >36 meses = 2. Frecuencia actual: 2–3 días = 0; 4 = 1; 5–7 = 2. Progresión: no registra cargas = 0; registra cargas = 1; plan con RPE = 2.
- La serie reciente estima 1RM con Epley (`carga × (1 + repeticiones / 30)`), solo entre 2 y 10 repeticiones. El ratio es `1RM / profile.weightKg`: masculino <0,90 = 0, 0,90–<1,20 = 1, ≥1,20 = 2; femenino <0,50 = 0, 0,50–<0,75 = 1, ≥0,75 = 2. Son umbrales operativos v1, no médicos ni universales.
- Si no hay serie reciente válida pero los otros datos P7 están completos y la persona es elegible, se muestra **Intermedio provisional**, sin inventar puntaje total ni presentar un total sobre 8; se explica cómo completar el nivel.
- Con cuatro criterios puntuados, 0–4 es Intermedio y 5–8 Avanzado. Mostrar puntaje, desglose, métrica de 1RM/ratio y explicación; reevaluar cada 8 semanas o cuando el progreso lo justifique.
- El requisito de ingreso sí está confirmado: al menos 6 meses entrenando con regularidad y al menos 2 días de entrenamiento actual por semana. Si no se cumple, no se genera el plan; se explica qué requisito falta y se ofrecen guardar la cuenta/aviso, corregir las respuestas o ver recomendaciones para empezar.
- La disponibilidad P9 define por separado los días de plan (2–6), días concretos, duración, hora, sueño y equipo.
- El cuestionario de actividad debe estar completo. Una respuesta positiva permite generar un borrador de intensidad baja con estado `review_required`; no se activa antes de revisión profesional. El gate interno no es autorización médica.
- P8 combina los prerrequisitos en un estado derivado por el servidor (`pending`, `blocked` o `passed`), con causas legibles. Una respuesta positiva marca `requiresLimitedIntensity` y `consultationRecommended`; `passed` no significa que ya exista una rutina. El cálculo del nivel es independiente.
- Los objetivos del diseño v7 son fuerza, hipertrofia, recomposición y rendimiento. Los borradores antiguos que usen otros valores no se deben traducir automáticamente a objetivos nuevos.
- La asignación del servidor usa una plantilla exacta para cada combinación actual de días (2–6), nivel y objetivo P7. Los objetivos heredados que no ofrece P7 no se traducen automáticamente; la generación devuelve una explicación y requiere corregir el objetivo.
- La semana debe respetar los días concretos, el equipo disponible y al menos 48 h antes de repetir músculos principales. Si Full Body no deja esa recuperación, 2 días usa Superior/Inferior A y 3 días usa Empuje/Jalón/Piernas. Si una combinación sigue sin permitir una rutina utilizable, el servidor no persiste un plan incompleto; la vista web debe explicar cómo ajustar la disponibilidad.
- El catálogo v1 tiene estructuras por días: 2 Full Body A/B (o Superior/Inferior A por recuperación); 3 Full Body A/B/C (o Empuje/Jalón/Piernas); 4 Upper/Lower A/B; 5 Superior A/Inferior A/Empuje/Jalón/Inferior B; 6 Push/Pull/Legs dos veces. No inferir objetivo o nivel por el nombre de una rutina openGym.
- El plan describe doble progresión: +1 repetición dentro del rango; solo intenta +2,5 kg en intensificación si se alcanzó el tope durante dos sesiones seguidas con RPE ≤ 8; sin RPE no aumenta. La descarga reduce 40 % del volumen base. La fórmula acordada es RPE = 10 − RIR; por tanto RPE 8 equivale a RIR 2.
- La web usa `GET /api/gymtrack/plan` para recuperar el borrador guardado y `POST /api/gymtrack/plan` para generarlo desde el assessment del servidor. El POST es idempotente por `assessment.updatedAt`; un plan obsoleto requiere `{"regenerate":true}`.
- El assessment y el plan se guardan en recursos JSON privados distintos por usuario. La generación no modifica `openGym`; la vista `/gymtrack/routine` permite revisar el plan y solo una acción explícita copia rutinas/días a `S.week`.
- Al aplicar, las rutinas existentes se conservan, solo se reasignan los días seleccionados por P9 y se confirman colisiones; nunca se cambia automáticamente el modo de rotación. Un plan `review_required` no se puede aplicar.

### Unidad completada: Aplicar Plan en Web
La acción vive únicamente en `/gymtrack/routine` y no se ejecuta al consultar ni generar el preview. Antes de escribir `S.week`, la interfaz calcula las colisiones de los días P9; si existen, muestra los días afectados y exige una confirmación separada. La aplicación agrega las rutinas del plan que aún no estén en `S.routines`, reemplaza solo los días P9 seleccionados y deja intactos rutinas, días no seleccionados, `queue`, `rotation` y `scheduleMode`. Los planes `review_required` se bloquean tanto en la UI como en la función de dominio.

### Unidad completada: duración de sesión P9
El generador calcula una estimación conservadora por rutina y, si supera los minutos disponibles, reduce primero series accesorias y después ejercicios accesorios, sin bajar de tres ejercicios por rutina. El plan devuelve `duration.targetMinutes`, `estimatedMinutes`, `adjusted` y el detalle auditable de cada recorte; la vista Web lo explica al usuario. La sesión preparada, RPE y doble progresión ya están conectados al flujo Web de Fase 4.

### Unidad completada: primera sesión y gate de progresión GymTrack
Aplicar un plan marca las rutinas nuevas como GymTrack sin reemplazar rutinas existentes. La vista ofrece iniciar explícitamente la primera sesión con el flujo Web normal (`startFlow`/`beginWorkout`), conservando pesaje, navegación y persistencia. Para estas rutinas, la subida de carga requiere dos sesiones consecutivas completas en el tope del rango y RPE máximo de 8; una sesión sin RPE conserva la carga y explica el bloqueo.

El Workout Web ofrece, al completar las series de una rutina GymTrack, un campo RPE único por ejercicio. Ese valor se conserva en la entrada activa, pasa al workout terminado y tiene prioridad sobre el agregado por serie al juzgar la doble progresión. El control de esfuerzo por serie existente se mantiene.

### Unidad completada: reevaluación periódica base
El plan expone una fecha de inicio (`generatedAt`) y el assessment conserva `reevaluation.lastAt`. A las ocho semanas se muestra un aviso Web; además, el historial Web puede adelantar el aviso cuando encuentra dos sesiones GymTrack con `plan.kind: "up"` separadas por al menos 14 días. `POST /api/gymtrack/reassessment` marca la reevaluación con una acción explícita y no modifica la semana activa.

Las pantallas de onboarding Web mantienen un borrador temporal por pantalla en almacenamiento local del navegador mientras se editan. Un guardado autenticado exitoso lo elimina; un fallo de red conserva los valores para que la persona pueda reintentar sin perder datos.

Las reglas generales proceden de `GymTrack—Guíacompletadefuncionalidaddelosmockups(v7).pdf`. Las decisiones que no estaban detalladas allí —puntos, fórmula, bandas y estructuras— se fijaron como reglas v1 en `docs/GYMTRACK_LEVEL_PLAN_PROPOSAL.md`; son heurísticas de producto sujetas a validación con uso real, no reglas clínicas.

## Decisiones diferidas

- Passkeys frente a Google OAuth y alcance del modo invitado.
- Forma definitiva de consentimientos y auditoría de datos de salud.
- Semáforo completo y sustitución segura.
- Regla definitiva de sueño frente a la reducción del semáforo.
- Validar con datos reales y revisión de entrenador los umbrales heurísticos v1 de fuerza relativa y la calidad de las rutinas antes de ampliar la población objetivo.
- Modelo relacional y migración a MySQL.
- Ajustes visuales posteriores del sistema GymTrack.

## Dirección visual

### Estilo elegido: continuidad funcional, claridad de gimnasio y densidad controlada

Se conservará el lenguaje visual funcional de openGym y se incorporará la jerarquía de GymTrack sin rediseñar toda la aplicación en la primera entrega.

- **Principios:** una acción principal por pantalla, información entrenable de un vistazo, estados explícitos y mensajes que expliquen el porqué.
- **Color:** el semáforo se reservará para estados de recuperación; no se usará color de salud como decoración.
- **Layout:** flujo progresivo en pasos para onboarding y vista orientada a tarea para sesión; evitar paneles recargados.
- **Interacción:** validación inmediata, guardado tolerante a desconexión y posibilidad clara de reintentar.
- **Tipografía y voz:** mantener la tipografía y componentes existentes; textos directos, explicativos y sin promesas médicas.
- **Esencia:** un instructor digital que convierte datos de entrenamiento en decisiones comprensibles.

## Estructura del proyecto relevante

- `frontend/`: aplicación React/Vite web, vistas, estado, lógica de entrenamiento y pruebas.
- `api/`: servidor HTTP Node.js, autenticación, sincronización, medios y pruebas.
- `catalogue/`: ejercicios, descripciones y medios reutilizables.
- `mcp/`: integración opcional de consulta; no forma parte de la primera entrega.
- `docs/`: documentación de arquitectura, seguridad y la matriz GymTrack/openGym.

Los directorios y configuraciones de Android/iOS forman parte del repositorio original, pero no se editarán ni validarán como parte de este alcance web.
