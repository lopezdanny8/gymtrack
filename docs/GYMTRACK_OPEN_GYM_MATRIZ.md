# Matriz inicial: GymTrack frente a openGym

> Documento de análisis. No representa todavía decisiones finales de implementación y no modifica la lógica de la aplicación.
>
> Fuentes revisadas: la guía funcional v7 como fuente de reglas; `GymTrack_Mockups_v7_Completo.pdf` como referencia visual, sin tomar sus datos de muestra como reglas; y la estructura actual del repositorio openGym.

## Objetivo

Determinar qué partes de GymTrack se pueden reutilizar desde openGym, cuáles requieren adaptación, cuáles son nuevas y cuáles deben quedar pendientes hasta validar las decisiones del grupo.

## Estados usados

- **Reutilizar:** existe una base funcional clara en openGym.
- **Adaptar:** existe una base, pero la regla o el flujo de GymTrack cambia el comportamiento.
- **Construir:** no se encontró una implementación equivalente completa.
- **Validar:** el documento contiene una decisión pendiente o una definición que debe confirmarse.
- **Posponer:** es útil, pero no debe bloquear el primer flujo funcional.

## Matriz funcional inicial

| Área / requisito GymTrack | Situación en openGym | Estado | Observación inicial |
|---|---|---|---|
| Frontend web responsive | React 19 + Vite + React Router | Reutilizar | Es la base directa del Preview web. |
| Aplicación Android/iOS | Integración Capacitor y configuración móvil | Posponer | Fuera del alcance actual: se conserva el código original, pero no se modificará ni validará ahora. |
| Portada pública | Existen pantallas y estructura web pública | Adaptar | Requiere identidad visual, mensaje y requisitos de GymTrack. |
| Inicio de sesión | Passkeys y contraseña opcional | Adaptar | GymTrack propone correo/contraseña y Google; no reemplazar sin decisión. |
| Google OAuth/OIDC | No confirmado como flujo existente completo | Posponer | Puede agregarse después de estabilizar la autenticación actual. |
| Creación de cuenta | Existe registro de perfiles | Adaptar | Hay que añadir consentimientos separados y el onboarding de GymTrack. |
| Consentimiento de datos de salud | No existe con el alcance formal de GymTrack | Construir | Requiere modelo, revocación, exportación, borrado y auditoría. |
| Perfil físico | Hay datos de usuario y peso/progreso | Adaptar | Falta el flujo específico de fecha de nacimiento, sexo, IMC y molestias. |
| IMC | No es el eje actual del onboarding | Construir | Debe calcularse como referencia, no como diagnóstico. |
| Molestias por zona y lado | Hay datos de entrenamiento y ejercicios, pero no el flujo GymTrack completo | Construir | Requiere zonas, lateralidad, intensidad y estado temporal. |
| PAR-Q obligatorio | Onboarding web de siete preguntas, resumen y gate P8 derivado | Adaptar | La futura generación todavía debe bloquearse mientras el PAR-Q esté incompleto. |
| PAR-Q positivo | El gate P8 permite continuar si está completo y devuelve intensidad limitada/recomendación profesional | Adaptar | El futuro generador debe aplicar la limitación al plan; no bloquear zonas por sí solo. |
| Experiencia de entrenamiento | P7 web captura meses, días entrenados actuales, serie reciente de press, método de progresión y objetivo | Adaptar | P9 `availability.daysPerWeek` es disponibilidad futura, no frecuencia actual. La regla v1 usa Epley entre 2 y 10 repeticiones; si falta serie válida, el nivel queda Intermedio provisional sin total ficticio. |
| Cálculo de nivel 0–8 | `api/gymtrack/assessment.js` calcula el nivel v1 y el resumen web muestra puntaje, criterios y métrica de banca | Adaptar | Cuatro criterios de 0–2; Epley 2–10 reps; 0–4 Intermedio / 5–8 Avanzado; serie ausente produce Intermedio provisional sin total. Integrar la reevaluación cada 8 semanas al ciclo de plan; los cortes por sexo son heurísticos y deben validarse con uso real. |
| Objetivos fuerza/hipertrofia/recomposición/rendimiento | La pantalla web P7 ya usa los cuatro objetivos v7; pueden existir borradores con valores anteriores | Adaptar | No traducir automáticamente objetivos legacy; solicitar una selección vigente cuando se vuelva a editar el paso. |
| Requisito de 6 meses y 2 días/semana | El backend ya deriva el estado y las causas a partir de meses y frecuencia actual P7 | Adaptar | La futura generación todavía debe bloquearse si no cumple y ofrecer la salida P8. PAR-Q completo también debe ser requisito para generar plan. |
| Disponibilidad semanal | Existe planificación semanal | Adaptar | Hay que validar días concretos y mínimo de 48 h por grupo muscular. |
| Horario y duración disponible | Hay duración y descanso en sesiones | Adaptar | Debe alimentar la asignación y el ajuste por tiempo. |
| Sueño | No existe con la regla GymTrack completa | Construir | Debe influir en volumen y mostrarse como explicación. |
| Equipamiento disponible | Existe filtrado de ejercicios por equipo | Adaptar | Debe incorporarse al generador de planes. |
| Asignación exacta de plantilla | Existe catálogo/rutinas | Adaptar | Combinar días y nivel primero, luego el objetivo más cercano, equipo y restricciones. |
| Plantilla más cercana | No existe como flujo explícito GymTrack | Construir | Asignar la más cercana, informar las diferencias y permitir cambiar días u objetivo; no dejar sin plan a un usuario elegible con PAR-Q completo. |
| Ciclo de cuatro semanas | Existe planificación/progresión relacionada | Adaptar | v7 define base, progresión, intensificación y descarga −40 %; la semana de descarga no sirve como base del ciclo siguiente. |
| Personalización del plan | Existe edición de rutinas | Adaptar | Hay que agregar advertencias y evitar guardar una sesión vacía. |
| Panel principal | Existe dashboard de entrenamiento | Adaptar | Añadir semáforo, nivel, racha, meta semanal y estados globales. |
| Semáforo verde/amarillo/rojo | No existe con las reglas GymTrack | Construir | Es uno de los motores de negocio principales. |
| Reducción amarilla 10–15 % | No existe como regla GymTrack confirmada | Construir | Debe calcularse en servidor. |
| Rojo por dolor | No existe con bloqueo por zona | Construir | Requiere catálogo de patrones, zonas y sustituciones. |
| Rojo por PAR-Q | No existe con intensidad limitada | Construir | No debe bloquear zonas por sí solo. |
| Sustitución segura por patrón | El catálogo de ejercicios es amplio, pero debe revisarse su metadata | Adaptar | Requiere patrón biomecánico, articulaciones y alternativas seguras. |
| Reportar molestia durante sesión | Hay registro de entrenamiento, pero no flujo GymTrack | Construir | Debe recalcular la sesión y explicar el resultado. |
| Ficha técnica de ejercicio | Existe catálogo, descripciones y medios | Reutilizar | Hay que adaptar campos y asegurar textos alternativos si falta el medio. |
| Sesión guiada | Existe | Reutilizar | Es una de las bases más valiosas de openGym. |
| Registro de series | Existe | Adaptar | GymTrack añade RPE obligatorio al final de cada ejercicio. |
| RPE 1–10 | Existe parcialmente según configuración | Adaptar | Confirmar compatibilidad con datos anteriores y retirar/ conservar RIR. |
| Doble progresión exacta | Hay progresión, pero debe compararse con la regla R3 | Adaptar | Dos sesiones al tope y RPE ≤ 8; sin RPE no sube carga. |
| Ajuste por tiempo | No existe como flujo GymTrack completo | Construir | Mantener principales, agrupar secundarios y quitar series. |
| Pausa de respiración | No identificada como módulo equivalente | Posponer | Puede agregarse como funcionalidad de sesión independiente. |
| Resumen de sesión | Existe resumen/historial | Adaptar | Añadir RPE medio, sensaciones, nota, molestia y recuperación. |
| Modo sin conexión | Existe soporte local/sincronización | Adaptar | Hay que verificar cola ordenada de series y recalculado posterior. |
| Continuar sesión después de cerrar | Existe lógica local relacionada | Adaptar | Confirmar estados pendiente/en curso/completada. |
| Reprogramación protegida | No existe con estas reglas | Construir | Máximo dos por semana y umbral de dos horas. |
| Semana reordenada | No existe como flujo GymTrack explícito | Construir | Debe respetar recuperación de 48 h. |
| Reingreso tras más de 7 días | Existe descarga/progresión relacionada | Adaptar | Confirmar descarga de 40 % y opción de omitirla. |
| Racha por sesiones cumplidas | Existe concepto de progreso/racha | Adaptar | GymTrack no la define por días consecutivos. |
| Tendencias | Existe progreso y estadísticas | Adaptar | Añadir series por grupo, peso y press de banca. |
| Récords personales | Existe | Reutilizar | Validar rangos de repeticiones y exclusión de datos incompletos. |
| Notas rápidas | Existe o tiene base de notas/historial | Adaptar | Confirmar endpoint y asociación con sesión. |
| Galería de fotos | Existe almacenamiento multimedia | Adaptar | Requiere privacidad, comparación y borrado por usuario. |
| Trainer IA explicativo | Existe módulo Coach opcional | Adaptar | Debe limitarse a explicar y no recibir datos de salud. |
| Explicabilidad de reglas | No existe con el modelo GymTrack | Construir | Cada ajuste debe poder devolver regla y motivo. |
| Notificaciones | Existe push | Adaptar | Añadir recordatorios, reprogramación e inactividad. |
| Vista tablet | Frontend responsive existente | Adaptar | Confirmar quiebres móvil/tablet/escritorio. |
| Panel de rutinas para administrador | Existe panel administrativo base | Adaptar | Añadir plantillas, objetivos, niveles y ciclos. |
| Ficha técnica administrativa | Existe catálogo | Adaptar | Añadir patrones, restricciones y sustitutos seguros. |
| Soporte | Existe base administrativa | Adaptar | El administrador debe ver cuenta, no datos de salud. |
| Auditoría de accesos a salud | No existe con el alcance indicado | Construir | Debe ser de solo lectura y registrar accesos automáticos. |
| Exportar datos | Existe exportación parcial según el repositorio | Adaptar | Debe incluir datos personales, entrenamiento y progreso. |
| Eliminar cuenta | Existe eliminación de cuenta | Adaptar | Debe cubrir también salud, fotos y datos derivados. |
| API `/api/v1` de GymTrack | openGym tiene su propio contrato bajo `/api` | Adaptar | No romper rutas existentes; evaluar una capa compatible. |
| MySQL | No está conectado | Posponer | Primero abstraer persistencia; migración gradual después del modelo inicial. |

## Primer alcance recomendado

Para la primera versión funcional de GymTrack, recomiendo incluir solamente:

1. Onboarding de cuenta, perfil físico, PAR-Q, experiencia, objetivo, disponibilidad y sueño.
2. Cálculo explicado del nivel.
3. Asignación de plan exacto o plantilla más cercana.
4. Panel con plan y sesión del día.
5. Sesión guiada con series y RPE.
6. Regla inicial de doble progresión.
7. Persistencia y pruebas del nuevo perfil y las reglas.

## Segundo alcance

Después del flujo anterior:

- Semáforo completo.
- Reporte de molestias.
- Sustitución segura.
- Ajuste por tiempo.
- Reprogramación y reordenamiento.
- Reingreso por inactividad.
- Tendencias y explicabilidad.

## Tercer alcance

Para una etapa posterior:

- Google OAuth.
- Auditoría avanzada de datos de salud.
- Trainer IA integrado con límites finales.
- Administración completa de plantillas.
- Notificaciones refinadas.
- Migración completa a MySQL.

## Decisiones que deben confirmarse antes de implementar

- Conservar passkeys, agregar Google o sustituir el acceso actual.
- Mantener o retirar el modo invitado.
- Confirmar las siete preguntas del PAR-Q.
- Confirmar si sueño y semáforo aplican la mayor reducción, no ambas sumadas.
- Confirmar descarga de reingreso del 40 %.
- Decidir si RPE reemplaza completamente a RIR.
- Definir la tabla de puntuación 0/1/2 para los cuatro criterios, incluidos los límites del ratio 1RM de press de banca / peso corporal; los datos y puntajes del mockup son ejemplos visuales, no reglas.
- Completar la cobertura del catálogo de plantillas por días, objetivo y nivel.
- Confirmar qué datos de salud puede procesar el motor y cuáles nunca salen hacia servicios externos.
- Definir la primera versión visual de GymTrack sin rediseñar toda la aplicación a la vez.
