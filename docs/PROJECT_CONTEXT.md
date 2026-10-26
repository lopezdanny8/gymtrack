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
- `frontend/src/lib/starter.js` sigue siendo la fuente de ejercicios reutilizables. Su ajuste por equipo devuelve IDs de los ejercicios sustituidos o eliminados y esos cambios se explican en `/gymtrack/routine`.
- La vista Web `/gymtrack/routine` está implementada y enlazada desde `/onboarding/summary`; muestra rutina, prescripción, ciclo, adaptaciones y gate/errores. La ruta está limitada a Web, no tiene tabs y solo modifica `S.week` mediante la acción explícita Aplicar Plan; generar/regenerar y aplicar requieren clicks separados.
- Aplicar Plan agrega las rutinas que faltan, reemplaza solo los días P9 seleccionados, conserva rutinas existentes y días no seleccionados, y no toca `queue`, `rotation` ni `scheduleMode`. Las colisiones se muestran y requieren confirmación; un plan `review_required` o desactualizado no se puede aplicar.
- El generador estima calentamiento, trabajo, descansos y transiciones por sesión; cuando excede los minutos P9, reduce primero series accesorias y luego ejercicios accesorios, conservando al menos tres ejercicios y explicando los cambios en `plan.duration` y la vista Web.

## Próximos pasos recomendados

1. **Completado:** `/gymtrack/routine` muestra el preview, ciclo, ajustes por equipo, gate y estado de revisión; creación/regeneración es explícita y la semana activa no se toca.
2. **Completado:** “Aplicar Plan” con confirmación de colisiones, conservación de rutinas existentes, días no seleccionados y modo de rotación; bloqueo de `review_required`.
3. **En curso:** cierre de Fase 4. La reevaluación base cada 8 semanas y el disparador temprano por dos progresiones GymTrack separadas por 14 días ya tienen aviso Web, estado auditable y confirmación explícita en `POST /api/gymtrack/reassessment`; no modifican la semana activa.
4. Evaluar MySQL cuando las entidades, relaciones y migraciones estén estabilizadas.

## Diagnóstico local actual

- El Vite de preview ya activo sirve `/gymtrack/routine` y `/manus-routes.json` con HTTP 200; el manifiesto incluye el deep link nuevo.
- El build de producción Web termina correctamente; conserva los avisos existentes sobre chunks grandes e imports dinámicos también importados estáticamente.
- Verificación de Aplicar Plan: dominio 4/4, vista GymTrackRoutine 6/6, build Web correcto y suite API completa 664/664; no se modificaron Android, iOS, Apple Watch ni Capacitor.
- Verificación de duración P9: generador 6/6, API HTTP 1/1, vista focalizada 10/10, build Web correcto y contrato OpenAPI actualizado con `duration`.
- Verificación de esta unidad: vista 6/6, rutas/CTA/manifiesto 2/2, dominio Aplicar Plan 4/4, endpoints de plan/evaluación más OpenAPI 10/10, y suite frontend completa 450/450 archivos con 5.573/5.573 tests aprobados. Se conservan avisos de React ya existentes en algunas pruebas, sin fallos.
- En la fase backend anterior, la suite completa pasó 664/664 y los tests web afectados por el ajuste de starter pasaron 48/48; esos cambios quedaron publicados antes de iniciar esta vista.
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
