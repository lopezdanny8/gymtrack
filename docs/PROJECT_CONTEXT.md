# Contexto de continuidad de GymTrack

## Producto

GymTrack es una plataforma web de entrenamiento y seguimiento deportivo. El usuario puede configurar su perfil, organizar rutinas, registrar entrenamientos, medir progreso y recibir orientación gradual basada en sus datos.

## Alcance vigente

El producto que se desarrolla en este repositorio es únicamente la página web y su backend. Android, iOS, Apple Watch y Capacitor están fuera del alcance de nuevas funcionalidades. No se deben diseñar pantallas ni flujos nativos como parte de una tarea web.

## Base técnica

La aplicación parte de una base de software existente de entrenamiento. Se conserva la compatibilidad del catálogo, los formatos de datos, la sincronización y las reglas ya probadas. La marca pública, el frontend visible, la documentación de producto y las nuevas funcionalidades se trabajan bajo el nombre GymTrack.

Los avisos legales y las atribuciones requeridas se encuentran separados en `NOTICE-THIRD-PARTY.md` y en los archivos de licencia correspondientes.

## Qué está implementado para GymTrack

- Módulo de dominio `api/gymtrack/assessment.js`.
- Persistencia aislada en `api/gymtrack/store.js`.
- Endpoints autenticados `GET/PUT /api/gymtrack/assessment`.
- Validación de perfil físico, PAR-Q, experiencia, objetivo, disponibilidad, sueño y equipamiento.
- Resumen de completitud e IMC cuando hay datos suficientes.
- Pruebas unitarias y pruebas HTTP autenticadas.
- Documentación OpenAPI del módulo.
- Pantalla web `/onboarding/profile` para fecha de nacimiento, sexo, talla y peso.
- Pantalla web `/onboarding/parq` con las siete preguntas y guardado progresivo.
- Pantalla web `/onboarding/experience` para meses, frecuencia actual (P7), serie reciente de press, forma de progresar y objetivo v7.
- Pantalla web `/onboarding/availability` para días, duración, hora, sueño y equipamiento.
- Pantalla web `/onboarding/summary` para revisar y editar el borrador antes de confirmar.
- El backend conserva P7 separado de P9 y calcula el nivel v1: cuatro criterios, Epley 2–10 reps, ratio por sexo, puntaje 0–8 y estado Intermedio provisional cuando falta la serie válida.
- El resumen web muestra nivel, puntaje, criterios, 1RM estimado, ratio corporal y explicación; los criterios no se aceptan desde el cliente.
- Backend y resumen derivan el gate P8 combinado (`pending`/`blocked`/`passed`) con razones; PAR-Q positivo marca intensidad limitada y recomendación profesional. La futura rutina se guardará como borrador `review_required` hasta revisión profesional; el gate no es autorización médica ni implica rutina generada.
- `api/gymtrack/plan.js` genera en el servidor rutinas para 2–6 días desde el assessment guardado; selecciona por días, nivel y objetivo, ajusta la prescripción, filtra equipo y explica cambios.
- El catálogo admite Full Body A/B (2 días), Full Body A/B/C (3), Upper/Lower A/B (4), distribución Superior/Inferior/Empuje/Jalón/Inferior B (5) y PPL×2 (6). Si el Full Body no deja 48 h entre grupos principales, usa Superior/Inferior en 2 días o PPL en 3.
- `GET/POST /api/gymtrack/plan` es autenticado e idempotente por revisión `assessment.updatedAt`; el plan se guarda en `gymtrack-plan-{userId}.json`, privado y separado de la evaluación y del documento `openGym`. La regeneración de un plan obsoleto requiere `{"regenerate":true}`.
- Las respuestas positivas en PAR-Q generan solo un borrador `review_required` de baja intensidad, sin progresión ni intensificación y con `activationAllowed: false`.
- El plan persistido describe las cuatro fases del ciclo y la doble progresión R3; la aplicación real de cargas tras registrar sesiones todavía no existe.
- `frontend/src/lib/starter.js` sigue siendo la fuente de ejercicios reutilizables. Su ajuste por equipo ahora devuelve IDs de los ejercicios sustituidos o eliminados para poder explicarlos en la futura vista GymTrack.

## Próximos pasos recomendados

1. **En curso:** crear la vista web `/gymtrack/routine` para mostrar semana, fases, prescripción y adaptaciones; presentar errores de disponibilidad y el estado `review_required` con advertencia. Esta unidad es de lectura/vista previa: no modificar `S.week`.
2. **Siguiente unidad, pendiente:** añadir “Aplicar Plan” con confirmación de colisiones, conservando rutinas existentes, días no seleccionados y modo de rotación; bloquear aplicación de `review_required`.
3. Ajustar volumen según minutos disponibles y conectar sesión, registro RPE/doble progresión y reevaluación de nivel cada 8 semanas.
4. Evaluar MySQL cuando las entidades, relaciones y migraciones estén estabilizadas.

## Diagnóstico local actual

- Web y backend arrancan en el sandbox con datos temporales aislados; la página y el manifiesto de rutas responden 200, `/api/health` responde 200 y `GET /api/gymtrack/assessment` devuelve 401 sin sesión (esperado).
- La consola del navegador no muestra errores al cargar la pantalla inicial.
- El build de producción web termina correctamente; emite avisos por chunks grandes e imports dinámicos que también tienen imports estáticos.
- Tras implementar generación y persistencia de rutina v1, la suite backend pasa 664/664; las pruebas web relacionadas con starter pasan 48/48, y el build de producción termina correctamente. OpenAPI y las rutas quedan sincronizadas (3/3 pruebas). La última suite web completa previa tenía 5,562/5,562 pruebas; el build aún reporta los avisos previos de chunks grandes e imports dinámicos inefectivos.
- La instalación reportó alertas de auditoría de dependencias (12 frontend y 1 high en API); no se ejecutó `npm audit fix` ni se cambiaron dependencias.

## Reglas v1 decididas y riesgos a validar

- Las reglas v1 están en `GYMTRACK_LEVEL_PLAN_PROPOSAL.md`; Intermedio provisional cubre la ausencia de serie válida sin inventar el puntaje relativo.
- Los cortes de fuerza relativa son heurísticas por sexo para la primera versión, no estándares clínicos; deben revisarse con entrenadores y datos reales.
- La pantalla de siete preguntas es una revisión inicial, no el PAR-Q+ oficial completo. El flujo oficial requiere seguimiento tras cualquier respuesta positiva y la colaboración PAR-Q+ restringe su incorporación electrónica sin permiso escrito; verificar derechos o sustituir la pantalla antes del lanzamiento público.
- El catálogo GymTrack será propio; no asignar nivel/objetivo a plantillas openGym por el nombre del split.
- Alcance de Coach IA y datos que puede utilizar.
- Momento y estrategia de migración desde JSON a MySQL.

## Cómo continuar en una sesión nueva

Leer en este orden:

1. `README.md`
2. `docs/PRODUCT_VISION.md`
3. `docs/PROJECT_CONTEXT.md`
4. `plan.md`
5. `TODO.md`
6. `docs/GYMTRACK_OPEN_GYM_MATRIZ.md`
7. `api/openapi.yaml`

Después revisar el código relacionado con el objetivo antes de modificarlo. Toda decisión que cambie el producto debe quedar registrada en `plan.md`, `TODO.md` o un documento de decisiones.
