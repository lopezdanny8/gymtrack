# Desarrollo inicial de GymTrack Web

## Alcance y compatibilidad

- [x] Mantener la aplicación React/Vite existente en `frontend/`.
- [x] Mantener la API Node.js existente en `api/`.
- [x] Mantener el catálogo de ejercicios, medios y pruebas existentes; Android/iOS y Capacitor quedan conservados, pero fuera del alcance web.
- [x] Documentar la matriz inicial de reutilización, adaptación y desarrollo en `docs/GYMTRACK_OPEN_GYM_MATRIZ.md`.
- [x] Definir el plan técnico del primer alcance en `plan.md`.

## Onboarding y evaluación inicial

- [x] El perfil físico usa altura en centímetros, peso en kilogramos y exactamente dos opciones de sexo: masculino o femenino.
- [x] La pantalla web `/onboarding/profile` carga y guarda el perfil físico mediante `GET/PUT /api/gymtrack/assessment`.
- [x] La pantalla web `/onboarding/parq` muestra las siete preguntas y guarda respuestas parciales sin borrar el perfil.
- [x] La pantalla web `/onboarding/experience` guarda meses de experiencia, modo actual de progresión y objetivo principal.
- [x] La pantalla web `/onboarding/availability` guarda días, duración, hora, sueño y equipamiento disponible.
- [x] La pantalla web `/onboarding/summary` muestra todas las secciones y permite editarlas antes de confirmar.
- [ ] El usuario puede completar progresivamente perfil físico, PAR-Q, experiencia, objetivo, disponibilidad, sueño y equipamiento sin perder los datos escritos si falla la conexión.
- [x] El backend web dispone de `GET/PUT /api/gymtrack/assessment`, valida los campos imposibles de las secciones recibidas y conserva el borrador en un archivo aislado por usuario.
- [x] El bloque web P7 captura meses entrenando, días que la persona entrena actualmente (separados de los días disponibles de P9), serie reciente de press de banca (kg × repeticiones, si se dispone), forma de progresar (sin registro, registra cargas, plan con RPE) y objetivo v7 (fuerza, hipertrofia, recomposición o rendimiento); lo guarda en el borrador autenticado.
- [x] El backend deriva estados de elegibilidad pendiente/apto/no apto con los meses entrenando y la frecuencia real P7; nunca usa `availability.daysPerWeek` de P9 para este cálculo.
- [x] El backend combina elegibilidad y PAR-Q en el gate P8 (`pending`/`blocked`/`passed`), con causas y recomendación de intensidad limitada si hay respuesta positiva; el gate no equivale a una rutina generada (el nivel se calcula por separado).
- [x] `POST /api/gymtrack/plan` bloquea P8 cuando corresponda; `/gymtrack/routine` presenta los motivos del gate y enlaces para corregir PAR-Q o experiencia, sin permitir generar si los requisitos no pasan.
- [x] La serie de press se almacena en kg × repeticiones; si falta una serie válida con los demás datos completos y la persona es elegible, el backend muestra Intermedio provisional sin fabricar puntos, y recalcula al agregarla.
- [x] Las respuestas PAR-Q quedan separadas del documento sincronizado y el backend devuelve su resumen de completitud y estado inicial.
- [x] `POST /api/gymtrack/plan` exige PAR-Q completo; si hay una respuesta positiva crea un borrador `review_required` de baja intensidad, sin progresión y con `activationAllowed: false`. La vista muestra la advertencia profesional; Aplicar Plan aún no está implementado y deberá rechazar ese estado. El gate no es autorización médica.
- [ ] Antes de lanzamiento público, verificar permiso escrito para el cuestionario oficial PAR-Q+ o sustituir la pantalla actual por un instrumento propio revisado; el flujo actual no incluye el seguimiento oficial de páginas 2–3.

## Nivel y asignación del plan

- [x] Cerrar las reglas v1 en `docs/GYMTRACK_LEVEL_PLAN_PROPOSAL.md`; son heurísticas de producto explícitas y revisables, no evaluación clínica.
- [x] Calcular server-side hasta 8 puntos: experiencia 6–<12 meses=0, 12–36=1, >36=2; frecuencia actual 2–3=0, 4=1, 5–7=2; progresión sin registro=0, registra cargas=1, plan con RPE=2.
- [x] Estimar 1RM de press con Epley solo para 2–10 repeticiones y puntuar ratio: masculino <0,90=0, 0,90–<1,20=1, ≥1,20=2; femenino <0,50=0, 0,50–<0,75=1, ≥0,75=2. Usar siempre el peso corporal en kg.
- [x] Si falta una serie válida pero los demás datos están completos y la persona es elegible, mostrar Intermedio provisional sin fabricar puntos ni total sobre 8; al agregar la serie, recalcular.
- [x] Clasificar 0–4 como Intermedio y 5–8 como Avanzado, y mostrar puntaje, desglose y explicación en el resumen web.
- [ ] Programar la reevaluación cada 8 semanas desde el inicio del plan, o antes cuando el progreso lo justifique.
- [x] El servidor selecciona la plantilla exacta por días, nivel y objetivo; si Full Body repetiría músculos antes de 48 horas, 2 días usa Superior/Inferior A y 3 días usa Empuje/Jalón/Piernas. Si equipo/calendario no permiten una rutina utilizable, no persiste una rutina incompleta y devuelve el motivo.
- [x] Construir el catálogo real para 2–6 días con IDs del catálogo de ejercicios, prescripción por objetivo/nivel y ajuste por equipo; los nombres de las rutinas base de openGym no se usan para inferir nivel u objetivo.
- [x] Implementar `GET/POST /api/gymtrack/plan`, persistencia privada `gymtrack-plan-{userId}.json`, respuesta idempotente por `assessment.updatedAt` y regeneración explícita con `regenerate: true` si cambió la evaluación.
- [x] Crear `/gymtrack/routine` solo en Web y enlazarla desde el resumen; muestra semana/split, prescripción, ciclo, adaptaciones, gates y errores de disponibilidad. Crear/regenerar exige una acción explícita; revisar la vista no modifica `S.week`.
- [x] Aplicar solo mediante acción explícita a `S.week`, reasignando únicamente días P9 y confirmando conflictos; conservar rutinas existentes y modo de rotación. Rechazar la aplicación de planes `review_required`.
- [x] El plan considera objetivo, nivel, días concretos, equipo disponible y 48 horas antes de repetir músculos principales; conserva en el plan la duración P9 de cada sesión. Ajustar el volumen para respetar esa duración queda pendiente.
- [x] El plan describe cuatro semanas: base, progresión, intensificación condicional (+2,5 kg tras dos sesiones en el tope con RPE ≤ 8) y descarga (−40 % de volumen); la descarga no se usa como base de progresión del ciclo siguiente.

## Aplicar Plan Web

- [x] Añadir acción explícita en `/gymtrack/routine`; revisar o generar el preview nunca modifica `S.week`.
- [x] Confirmar colisiones antes de reemplazar días P9; rutinas existentes y días no seleccionados permanecen intactos.
- [x] Conservar `queue`, `rotation` y `scheduleMode`; bloquear planes `review_required` y previews obsoletos.
- [x] Cubrir la lógica con pruebas puras de dominio y mantener el flujo fuera de Android, iOS, Apple Watch y Capacitor.

## Incidencia web resuelta durante la verificación

- [x] Cambiar a guion medio `–` el placeholder de hora del resumen en `frontend/src/views/GymTrackSummary.jsx:80`; pasaron la prueba específica y la suite web completa (448/448 archivos).

## Verificación de la vista de rutina

- [x] Pruebas focalizadas: vista GymTrackRoutine 6/6; ruta/CTA/manifiesto Web-only 2/2; endpoints plan/evaluación y OpenAPI 10/10; `vite build`, deep link y manifiesto HTTP correctos.
- [ ] Incidencia baseline: la última suite frontend completa registró 446/449 archivos aprobados (5.561/5.569 tests). Los 8 fallos están en `Plan.swipe.test.jsx`, `RoutineEdit.swipe.test.jsx` y `Workout.swipe.test.jsx`; los mismos tres archivos fallan al ejecutar el commit previo `342b305` en un worktree limpio, por lo que no se atribuyen a esta vista y quedan como deuda de tests existentes.

## Primera sesión y progresión

- [ ] El usuario puede abrir la sesión preparada y registrar series válidas reutilizando el flujo actual de openGym.
- [ ] El RPE se registra una vez por ejercicio al finalizar sus series.
- [ ] Ejecutar la regla inicial de doble progresión al registrar sesiones: solo aumentar la carga después de dos sesiones consecutivas en el límite superior de repeticiones con RPE ≤ 8.
- [ ] Si falta el RPE o no se alcanza el límite superior, la carga no aumenta y el sistema puede explicar el motivo.
- [x] Las reglas de dominio tienen pruebas unitarias independientes de React y los endpoints de evaluación tienen pruebas HTTP autenticadas.

## Pendiente después del primer flujo

- [ ] Semáforo completo por recuperación, dolor y PAR-Q.
- [ ] Sustitución segura por patrón biomecánico.
- [ ] Ajuste por tiempo y superseries.
- [ ] Reprogramación protegida, semana reordenada y reingreso por inactividad.
- [ ] Explicabilidad completa y límites finales del Trainer IA.
- [ ] Auditoría de datos de salud y controles administrativos.
- [ ] Google OAuth, si se confirma como necesario.
- [ ] Abstracción completa de persistencia y migración gradual a MySQL.

## Decisiones abiertas

- [ ] Confirmar passkeys, Google OAuth y modo invitado.
- [ ] Confirmar las siete preguntas PAR-Q y el criterio definitivo de entrada.
- [ ] Confirmar RPE frente a RIR y la fórmula exacta de progresión.
- [ ] Confirmar las reglas de sueño, descarga y salida del semáforo.
- [ ] Confirmar la identidad visual final de GymTrack.
