# Arquitectura web de GymTrack

## Vista general

```text
Navegador
   |
   | HTTP same-origin
   v
Frontend React/Vite  --->  Backend Node.js HTTP  --->  data/*.json
        |                         |
        |                         +--> autenticación y sesiones
        +--> reglas de entrenamiento y UI
```

## Frontend

`frontend/` contiene una SPA React 19 compilada con Vite. Las vistas y componentes viven en `frontend/src/`; las reglas de dominio reutilizables viven en `frontend/src/lib/`; las traducciones están en `frontend/src/locales/`.

La aplicación se sirve con una misma origin que la API en producción. El proxy `/api` evita problemas de cookies y de autenticación. El manifiesto de rutas web está en `frontend/public/manus-routes.json`.

## Backend

`api/server.js` implementa el servidor HTTP, autenticación, sesiones, sincronización y despacho de endpoints. Los módulos específicos de GymTrack se mantienen aislados en `api/gymtrack/` para que puedan evolucionar sin mezclar reglas de onboarding con el núcleo de sincronización existente.

`api/openapi.yaml` es el contrato de referencia para las rutas públicas del backend.

## Persistencia actual

Durante la fase de definición funcional, la aplicación usa archivos JSON bajo `DATA_DIR`. Esto facilita el desarrollo y mantiene el comportamiento existente. El almacenamiento de evaluación GymTrack se separa por usuario y no modifica directamente el documento general de entrenamiento.

## MySQL

MySQL es una opción adecuada para la fase de producción multiusuario, pero la migración debe esperar hasta estabilizar:

- entidades y relaciones;
- propiedad de datos por usuario;
- historial de cambios y sincronización;
- reglas de eliminación y exportación;
- migraciones y recuperación;
- consultas requeridas por progreso y Coach.

La migración deberá implementarse con un adaptador de persistencia, migraciones versionadas, pruebas de equivalencia y un plan de respaldo. No se debe conectar una base de datos solamente para reemplazar archivos sin cerrar primero el modelo de datos.

## Contratos y pruebas

Las reglas de dominio deben poder probarse sin React ni HTTP. Las rutas HTTP deben tener pruebas autenticadas. Antes de integrar un cambio en la interfaz se ejecutan las pruebas del módulo afectado y el build del frontend.
