# Visión de producto de GymTrack Web

## Objetivo

GymTrack Web será un sistema personalizado de entrenamiento que recopila el contexto del usuario, propone una rutina semanal, acompaña cada sesión, registra resultados y adapta progresivamente el plan. La diferenciación principal será un Coach IA contextual capaz de entender el estado real del usuario y proponer ajustes controlados.

## Flujo completo esperado

```text
Crear cuenta o iniciar sesión
  -> Completar perfil, PAR-Q, objetivo, disponibilidad y equipamiento
  -> Calcular nivel y explicar el resultado
  -> Proponer rutina semanal personalizada
  -> Realizar la sesión del día
  -> Ver ejercicios, series, repeticiones, descansos y medios disponibles
  -> Registrar cargas, repeticiones y RPE
  -> Consultar historial y progreso
  -> Actualizar datos, horarios y equipamiento cuando sea necesario
  -> Adaptar sesiones y semanas futuras según el contexto actualizado
  -> Consultar al Coach IA con información autorizada del usuario
```

## Rutina semanal

La propuesta debe considerar objetivo, nivel, días y horarios disponibles, duración de sesión, equipamiento, historial, cargas, repeticiones, RPE y recuperación. El motor busca primero la coincidencia de días y nivel, y después el objetivo más cercano; si no existe una combinación exacta, informa qué cambia y permite ajustar días u objetivo. El usuario no recibe un plan si todavía no cumple el requisito de ingreso de al menos seis meses entrenando con regularidad y dos días por semana, o si no completó el PAR-Q. Una respuesta positiva del PAR-Q permite continuar con intensidad limitada y una recomendación de consultar a un profesional.

La primera asignación prepara cuatro semanas: base, progresión, intensificación y descarga. La semana de descarga reduce el volumen en 40 % y no se usa como base de progresión del ciclo siguiente. La plantilla debe respetar la disponibilidad, el equipamiento y un mínimo de 48 horas antes de repetir el mismo grupo muscular. El usuario podrá revisar y editar su disponibilidad y equipamiento después del onboarding.

## Ajuste contextual de sesión

Un caso clave es adaptar una sesión cuando cambian las condiciones. Por ejemplo, si una sesión estaba planificada de 7:00 a 8:00, pero el usuario llega a las 7:20, el Coach puede proponer una versión de 40 minutos. Debe priorizar ejercicios importantes, reducir accesorios o volumen cuando corresponda, mantener el estímulo principal, respetar límites de seguridad y explicar cada cambio.

La IA no debe escribir directamente en la persistencia ni inventar ejercicios. Debe solicitar acciones mediante herramientas controladas por el backend; el servidor valida que los ejercicios, cargas, tiempos y cambios sean compatibles con el plan y el catálogo.

## Datos que el Coach IA podrá consultar

Cuando el usuario lo autorice y la política de privacidad lo permita, el Coach podrá recibir un contexto limitado y estructurado con perfil, objetivo, disponibilidad, equipamiento, rutina actual, historial, cargas, repeticiones, RPE, peso corporal, progreso y estado de la sesión del día. No se entregará acceso indiscriminado a archivos o a la base de datos.

## Acciones posibles del Coach

- Explicar una rutina o una progresión.
- Ajustar la sesión actual al tiempo disponible.
- Reordenar o reducir ejercicios dentro de límites definidos.
- Proponer cambios para la semana siguiente.
- Sugerir sustituciones disponibles cuando exista una regla segura.
- Actualizar preferencias de horarios o equipamiento mediante confirmación del usuario.

Las acciones que cambien datos o plan deberán tener una propuesta visible, una explicación y una validación del backend. Los cambios sensibles o irreversibles requerirán confirmación explícita.

## Fases de implementación

1. Onboarding web y persistencia del contexto.
2. Evaluación explicable del nivel.
3. Plantillas y primera rutina semanal personalizada.
4. Sesión diaria con catálogo, series, repeticiones, descansos y medios.
5. Registro de resultados, RPE, historial y progreso.
6. Progresión controlada y adaptación de semanas futuras.
7. Coach IA contextual con herramientas seguras y permisos claros.

## Fuera del alcance actual

El desarrollo nuevo se limita a web y backend web. Android, iOS, Apple Watch y Capacitor quedan fuera. MySQL, Google OAuth, Coach IA avanzado y semáforos avanzados se implementarán solo después de estabilizar el flujo base.
