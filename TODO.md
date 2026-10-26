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
- [ ] El usuario puede completar progresivamente perfil físico, PAR-Q, experiencia, objetivo, disponibilidad, sueño y equipamiento sin perder los datos escritos si falla la conexión.
- [x] El backend web dispone de `GET/PUT /api/gymtrack/assessment`, valida los campos imposibles de las secciones recibidas y conserva el borrador en un archivo aislado por usuario.
- [ ] El sistema puede representar el requisito de seis meses de experiencia y dos días semanales, mostrando una salida clara si no se cumple; el bloqueo definitivo queda pendiente de confirmación del grupo.
- [x] Las respuestas PAR-Q quedan separadas del documento sincronizado y el backend devuelve su resumen de completitud y estado inicial.

## Nivel y asignación del plan

- [ ] El usuario no elige su nivel; el servidor calcula un puntaje de 0 a 8 con experiencia, frecuencia, fuerza relativa y forma de progresión.
- [ ] El resultado clasifica 0–4 como Intermedio y 5–8 como Avanzado, mostrando el desglose y una explicación.
- [ ] El servidor busca una plantilla por días, objetivo y nivel; cuando no existe coincidencia exacta, asigna la más cercana, informa qué cambió y nunca deja al usuario sin plan.
- [ ] La primera versión del plan conserva una estructura preparada para ciclo de cuatro semanas, con la descarga separada de la base de progresión.

## Primera sesión y progresión

- [ ] El usuario puede abrir la sesión preparada y registrar series válidas reutilizando el flujo actual de openGym.
- [ ] El RPE se registra una vez por ejercicio al finalizar sus series.
- [ ] La regla inicial de doble progresión solo aumenta la carga después de dos sesiones consecutivas en el límite superior de repeticiones con RPE ≤ 8.
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
