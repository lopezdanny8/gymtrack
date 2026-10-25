# Plan inicial de GymTrack sobre openGym

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

- El nivel no lo elige el usuario.
- El nivel suma hasta 8 puntos con cuatro criterios de 0 a 2 puntos: experiencia, frecuencia, fuerza relativa y forma de progresión.
- De 0 a 4 puntos: Intermedio; de 5 a 8: Avanzado.
- El resultado debe incluir desglose y explicación.
- El requisito de ingreso de 6 meses y 2 días por semana debe poder representarse, pero se confirmará antes de bloquear usuarios.
- La asignación busca coincidencia por días, nivel y objetivo; si no existe, devuelve la plantilla más cercana y explica la diferencia.
- La primera versión de progresión solo aumenta carga cuando se alcanza el tope de repeticiones durante dos sesiones seguidas con RPE menor o igual a 8; sin RPE no aumenta.

## Decisiones diferidas

- Passkeys frente a Google OAuth y alcance del modo invitado.
- Forma definitiva de consentimientos y auditoría de datos de salud.
- Semáforo completo y sustitución segura.
- Regla definitiva de sueño frente a la reducción del semáforo.
- Modelo relacional y migración a MySQL.
- Diseño visual final de GymTrack frente al estilo actual de openGym.

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
