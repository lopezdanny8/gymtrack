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
- Pantalla web `/onboarding/experience` para meses de experiencia, forma actual de progresar y objetivo.
- Pantalla web `/onboarding/availability` para días, duración, hora, sueño y equipamiento.

## Próximos pasos recomendados

1. Crear el resumen editable de la evaluación.
2. Confirmar las reglas de elegibilidad y asignación de nivel.
3. Definir el modelo de plan inicial antes de implementar generación automática.
4. Añadir persistencia de objetivos y plan cuando el flujo esté probado en web.
5. Evaluar MySQL cuando las entidades, relaciones y migraciones estén estabilizadas.

## Decisiones que todavía requieren confirmación

- Fórmula exacta para nivel inicial.
- Reglas de seis meses de experiencia y frecuencia mínima.
- Interpretación final de respuestas PAR-Q y mensajes de seguridad.
- Sistema de progresión, doble progresión y RPE.
- Alcance de Coach IA y datos que puede utilizar.
- Momento y estrategia de migración desde JSON a MySQL.

## Cómo continuar en una sesión nueva

Leer en este orden:

1. `README.md`
2. `docs/PROJECT_CONTEXT.md`
3. `plan.md`
4. `TODO.md`
5. `docs/GYMTRACK_OPEN_GYM_MATRIZ.md`
6. `api/openapi.yaml`

Después revisar el código relacionado con el objetivo antes de modificarlo. Toda decisión que cambie el producto debe quedar registrada en `plan.md`, `TODO.md` o un documento de decisiones.
