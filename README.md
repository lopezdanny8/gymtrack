# GymTrack Web

GymTrack es una plataforma web para planificar entrenamientos, registrar sesiones, seguir el progreso y construir recomendaciones personalizadas de entrenamiento.

Este repositorio contiene el producto web: una interfaz React/Vite y un backend Node.js que se comunican mediante una misma aplicación. El alcance actual está limitado a navegador y servidor web. Las aplicaciones nativas para Android, iOS y Apple Watch no forman parte del trabajo actual.

## Estado actual

La aplicación web existente ya incluye planificación de rutinas, registro de series, peso corporal, progreso, sincronización de perfiles, autenticación, catálogo de ejercicios y funciones de Coach. El primer módulo propio de GymTrack añadido sobre esa base es el onboarding de evaluación inicial:

- `GET /api/gymtrack/assessment`
- `PUT /api/gymtrack/assessment`
- Validación de perfil físico, PAR-Q, experiencia, objetivo, disponibilidad, sueño y equipamiento.
- Borrador aislado por usuario y resumen de completitud.

La asignación definitiva de nivel y las reglas completas del plan inicial todavía están en definición.

## Estructura

```text
frontend/   Aplicación React 19 + Vite para navegador
api/        Backend Node.js HTTP y contrato OpenAPI
catalogue/  Catálogo de ejercicios y datos asociados
docs/       Contexto, arquitectura, decisiones y documentación técnica
scripts/    Herramientas de build y generación de documentación
plan.md     Plan vigente del primer alcance funcional
TODO.md     Trabajo pendiente y criterios de aceptación
```

## Desarrollo local

Requisitos: Node.js 20 o superior y npm.

```bash
cp .env.example .env
npm ci --prefix frontend
npm ci --prefix api --omit=optional

# Terminal 1: API
cd api
PORT=3001 DATA_DIR=../data node server.js

# Terminal 2: frontend
cd frontend
API_TARGET=http://127.0.0.1:3001 npm run dev -- --host 0.0.0.0 --port 3000
```

Abre `http://localhost:3000`.

Para ejecutar las pruebas:

```bash
cd frontend && npm test
cd ../api && npm test
```

## Arquitectura

El frontend es una SPA React/Vite. Las reglas de dominio se mantienen en funciones JavaScript independientes, con pruebas junto a cada módulo. El backend usa `node:http`, sesiones autenticadas y persistencia por archivos JSON durante esta fase. El contrato HTTP está documentado en [`api/openapi.yaml`](api/openapi.yaml).

La migración a MySQL queda prevista para una fase posterior, cuando el modelo de datos y las reglas de negocio estén estabilizados.

## Principios del proyecto

- La identidad visible del producto es GymTrack.
- El alcance de desarrollo actual es exclusivamente web.
- Las decisiones funcionales importantes se documentan en el repositorio.
- No se cambian formatos de datos existentes sin una migración explícita.
- Se conservan las licencias y avisos exigidos por el código reutilizado.

Consulta [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) si retomas el proyecto desde una sesión nueva.
