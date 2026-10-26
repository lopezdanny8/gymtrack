# Reglas v1 para nivel y primera rutina semanal

**Estado: decisiones de implementación v1.** El usuario autorizó que el agente cierre los detalles no definidos por la guía y consulte fuentes externas. Estas reglas son una heurística de producto para personalizar entrenamiento; no son una evaluación clínica ni una certificación deportiva. Se implementarán primero en el servidor y se explicarán en la web.

## 1. Reglas fijadas por la guía funcional v7

- El usuario no elige su nivel. El servidor suma cuatro criterios de 0 a 2 puntos; 0–4 puntos es Intermedio y 5–8 es Avanzado.
- Los criterios son experiencia, frecuencia semanal actual, fuerza relativa en press de banca —1RM estimado respecto al peso corporal— y forma de progresar cargas.
- P7 captura meses entrenando, días actuales, serie reciente de press de banca (kg × repeticiones), progresión y objetivo. P9 es disponibilidad futura y no se reutiliza como frecuencia actual.
- Para ser elegible se requieren seis meses de entrenamiento regular y al menos dos días actuales por semana. El PAR-Q debe estar completo. Una respuesta positiva permite continuar con intensidad limitada y recomendación de consulta profesional.
- R1 prioriza coincidencia de días y nivel, y después aproxima el objetivo. P10 define cuatro semanas: Base, Progresión, Intensificación (+2,5 kg) y Descarga (−40 % de volumen). R3 permite subir 2,5–5 % solo tras llegar al tope de repeticiones durante dos sesiones seguidas con RPE ≤ 8.

## 2. Puntuación adoptada

Las alternativas ordenadas de P7 se puntúan 0, 1 y 2 de menor a mayor. Los límites mensuales se fijan sin solapamientos: de 6 a menos de 12 meses = 0; de 12 a 36 meses inclusive = 1; más de 36 meses = 2. La elegibilidad se calcula antes, con el mínimo de seis meses.

La frecuencia actual da 0 puntos con 2–3 días, 1 con 4 días y 2 con 5–7 días. El método de progresión da 0 si no registra cargas, 1 si registra sus cargas y 2 si sigue un plan con RPE.

La serie reciente usa la ecuación Epley: `1RM estimado = peso de la serie × (1 + repeticiones / 30)`. Solo se acepta una serie de 2–10 repeticiones técnicamente válidas; las ecuaciones de predicción dependen del esfuerzo y pierden precisión cuando se extrapola a más repeticiones. No se solicita un intento máximo de una repetición. [1] [2] [3]

El ratio es `1RM estimado / peso corporal en kg`. Como cortes v1 se emplean aproximaciones de los niveles novice e intermediate de estándares comunitarios indexados por sexo y peso corporal: para masculino, menos de 0,90 = 0; de 0,90 a menos de 1,20 = 1; 1,20 o más = 2. Para femenino, menos de 0,50 = 0; de 0,50 a menos de 0,75 = 1; 0,75 o más = 2. Los cortes resumen valores cercanos a las bandas novice/intermediate en pesos corporales medios de las tablas consultadas; no son umbrales clínicos ni universales. [4] [5]

Con cuatro criterios completos, se suma el total y se aplica el corte v7: hasta 4 puntos, Intermedio; desde 5, Avanzado. El servidor calcula y conserva el desglose; no acepta puntos ni nivel enviados por el navegador.

## 3. Dato de banca ausente

Si una persona cumple el gate P8 y completó los otros datos P7, pero no tiene una serie reciente válida, el servidor no inventa un puntaje ni presenta un total sobre 8. Asigna **Intermedio provisional** para que la falta de ese dato no impida ofrecer el primer plan, lo marca como provisional y explica que el nivel definitivo requiere una serie válida. El primer plan usa cargas no prescritas como máximos y progresión conservadora. Al añadir una serie válida, el servidor recalcula el nivel.

Si falta experiencia, frecuencia u opción de progresión, el nivel queda pendiente de completar P7. Esta condición no cambia el estado médico del PAR-Q ni la elegibilidad.

## 4. Catálogo y estructura inicial de rutinas

El catálogo de GymTrack será propio y usará IDs del catálogo web, equipo compatible y rutinas estructuradas del formato existente. No se inferirá objetivo o nivel por el nombre de una plantilla openGym. Para cubrir días disponibles de 2 a 6, la estructura v1 será:

- 2 días: Cuerpo completo A/B.
- 3 días: Cuerpo completo A/B/C.
- 4 días: Superior/Inferior A/B.
- 5 días: Superior A, Inferior A, Empuje, Jalón e Inferior B, con al menos 48 horas antes de repetir los grupos principales.
- 6 días: Empuje/Jalón/Piernas dos veces, con un día de descanso antes de reiniciar el ciclo.

**Ajuste por recuperación para 2–3 días:** si los días seleccionados son consecutivos y repetir cuerpo completo no deja 48 horas entre sesiones, 2 días usa Superior/Inferior A y 3 días usa Empuje/Jalón/Piernas. Si los días seleccionados dejan al menos 48 horas entre sesiones, se conserva Cuerpo completo A/B o A/B/C. En todos los casos se respetan los días concretos P9.

La rutina filtra ejercicios por el equipamiento disponible. Se elige el catálogo exacto de días y nivel y, dentro de esas opciones, el objetivo más próximo; cualquier sustitución se explica. Si una combinación no puede producir una rutina usable con el equipo indicado, no se persiste un plan incompleto: se explica la limitación y se permite corregir el equipo o la disponibilidad.

Los objetivos ajustan la prescripción, no requieren inventar diferencias anatómicas: Fuerza usa cargas altas y 2–3 series de trabajo por ejercicio; Hipertrofia usa volumen semanal alto y un rango práctico de 8–12 repeticiones; Recomposición reutiliza la prescripción de hipertrofia, sin promesas de pérdida de peso ni reglas nutricionales; Rendimiento se interpreta como acondicionamiento general de fuerza/potencia, no como un plan para un deporte concreto. ACSM 2026 recomienda al menos dos sesiones semanales para fuerza, cargas de ≥80 % 1RM y 2–3 series por sesión; la revisión también vincula ≥10 series semanales por grupo muscular con mayor hipertrofia. Un metaanálisis encontró que las cargas altas maximizan la ganancia de fuerza, mientras múltiples rangos de carga pueden producir hipertrofia. [6] [7]

R3 gobierna los aumentos efectivos de carga: la intensificación de semana 3 intentará el incremento definido por P10 solo en ejercicios que hayan cumplido el criterio de dos sesiones con tope de repeticiones y RPE ≤ 8. Si no, mantiene la carga. La descarga reduce el volumen semanal objetivo en 40 % frente a la semana base, con series enteras distribuidas entre ejercicios.

## 5. Contrato técnico web v1

- `GET /api/gymtrack/plan` devuelve el plan guardado del usuario o `null` y un indicador `stale` si el assessment cambió. `POST /api/gymtrack/plan` genera desde el assessment guardado, sin aceptar nivel, puntaje, objetivo o rutina del cliente. Un POST repetido con el mismo `assessment.updatedAt` devuelve el mismo plan; reemplazar uno obsoleto requiere `{"regenerate":true}` explícito.
- Assessment y plan se guardan en archivos privados separados por usuario. La rutina conserva la semana 1 y el ciclo de cuatro semanas; el acceso no modifica el documento openGym.
- La web muestra la rutina antes de aplicarla. Solo una acción explícita la agrega a `S.week` en los días seleccionados de P9. Si alguno de esos días ya tiene una rutina asignada, la web pide confirmación; los otros días no cambian. Si hay una rotación activa, no se cambia el modo de calendario automáticamente.
- Con PAR-Q completo y sin respuestas positivas, el plan queda listo para aplicarse. Con respuesta positiva, la API puede generar una vista previa de intensidad baja con estado `review_required`; no se puede aplicar ni iniciar y no contiene intensificación hasta una revisión profesional.
- La primera semana normal usa el split y prescripción de v1. El ciclo describe Base, Progresión, Intensificación condicional R3 y Descarga −40 %. Una respuesta positiva produce solo un borrador de revisión sin semanas de intensificación.

## 6. Límites conocidos de esta decisión

Los estándares de press son datos de levantadores que registran resultados y dependen de sexo, edad, peso corporal y técnica; por eso los ratios elegidos son cortes operativos redondos para un primer lanzamiento y no comparaciones de salud. La base consultada ofrece valores por peso y edad; GymTrack v1 aplica únicamente cortes por sexo y ratio, de modo que esta regla deberá revisarse con datos reales de usuarios y comentarios de entrenador. La estimación por ecuación tampoco sustituye una medición directa; solo se usa para el punto de fuerza relativa.

El calendario de cinco días y el ajuste por objetivo deben ser cubiertos por pruebas de recuperación, equipamiento, ausencia de duplicados y volumen semanal antes de liberar planes. El cuestionario web de siete preguntas es una evaluación inicial adaptada, no el PAR-Q+ oficial completo: la versión oficial vigente pide completar sus páginas de seguimiento después de cualquier respuesta afirmativa. La colaboración oficial indica que el PAR-Q+ no debe alterarse ni incorporarse en encuestas electrónicas o materiales derivados sin permiso escrito. Antes de publicar, GymTrack debe obtener ese permiso o reemplazarlo por un cuestionario propio revisado por profesionales; el gate interno no es autorización médica. [8] [9] [10]

## Referencias

[1]: https://pubmed.ncbi.nlm.nih.gov/16937972/ "Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry"
[2]: https://paulogentil.com/pdf/The%20Accuracy%20of%20Prediction%20Equations%20for%20Estimating%201-RM%20Performance%20in%20the%20Bench%20Press%2C%20Squat%2C%20and%20Deadlift.pdf "The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift"
[3]: https://www.rbpfex.com.br/index.php/rbpfex/article/view/2945 "Comparação de equações preditivas para o teste de uma repetição máxima no exercício supino"
[4]: https://strengthlevel.com/strength-standards/bench-press/lb "Bench Press Standards"
[5]: https://exrx.net/Testing/WeightLifting/BenchStandards "Bench Press Strength Standards"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/ "Resistance training prescription for muscle function, hypertrophy, and physical performance in healthy adults: an overview of reviews"
[7]: https://bjsm.bmj.com/content/57/18/1211.short "Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis"
[8]: https://eparmedx.com/print-versions-of-par-q/ "Current official PAR-Q+ and ePARmed-X+ forms"
[9]: https://eparmedx.com/wp-content/uploads/2025/01/PARQPlus2025ImageFile.pdf "PAR-Q+ official questionnaire, 2025 version"
[10]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7059860/ "Applying the ACSM Preparticipation Screening Algorithm to NHANES"
