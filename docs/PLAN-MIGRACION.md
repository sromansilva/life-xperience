# Plan de migración: LifeXperience a una app React independiente

## Punto de partida

El proyecto ya usa React 18 con Vite y Tailwind, pero se exportó de Figma Make y tiene tres problemas:

1. **Depende de Figma Make.** Los scripts usan `vite.figma.config.ts`, que carga `.figma/make/*`. `index.html` tiene marcadores `<!-- figma:* -->` y el paquete se llama `@figma/my-make-file`.
2. **Todo está en un solo archivo.** `src/app/App.tsx` tiene 3.307 líneas y 71 `useState`. La navegación no usa rutas: depende de `authStep` (7 pantallas de acceso), `appScreen` (9 pantallas) y `teacherTab` (3 pestañas). Recargar la página o usar "atrás" te devuelve al inicio.
3. **La base de datos no está versionada.** La tabla `profiles` se crea desde un endpoint `/setup` de la función Edge, que ejecuta SQL con la service_role y no pide autenticación. Las credenciales están fijas en `utils/supabase/info.tsx`.

## Objetivo final

- `npm install && npm run dev` levanta la app sin nada de Figma.
- Cada pantalla tiene su propia URL (`react-router`), y recargar o usar "atrás" funciona.
- El estado compartido (sesión, perfil, progreso, chat de Orion) vive en contextos, no en `App.tsx`.
- Supabase se configura con variables de entorno (`.env`) y el esquema queda versionado en `supabase/migrations/`.
- La app se ve y funciona igual que ahora: es una migración de estructura, no un rediseño.

**Cómo se comprueba:** `npm run typecheck` y `npm run build` sin errores, y una prueba de humo con Playwright que recorre todas las rutas (estudiante demo, docente demo, simulación completa) sin errores en consola.

## Mapa de rutas

| Hoy | Ruta |
|---|---|
| splash | `/` |
| role | `/ingresar` |
| login-s / login-t | `/ingresar/estudiante`, `/ingresar/docente` |
| reg-role / reg-s / reg-t | `/registro`, `/registro/estudiante`, `/registro/docente` |
| home, map, skill | `/app`, `/app/mapa`, `/app/mundo/:worldId` |
| sim, results | `/app/mision/:missionId`, `/app/mision/:missionId/resultados` |
| dash, avatar, orion | `/app/progreso`, `/app/avatar`, `/app/orion` |
| teacher (3 pestañas) | `/docente`, `/docente/ia`, `/docente/planes` |

Las rutas `/app/*` y `/docente/*` quedan protegidas por rol.

## Fases y reparto

| Fase | Pieza | Agente | Archivos | Depende de |
|---|---|---|---|---|
| 0 | Base independiente: quitar Figma Make, `.env`, scripts `dev/build/typecheck`, `react-router-dom` | Codex (tiene que correr la build) | `package.json`, `vite.config.ts`, `index.html`, `src/lib/supabase.ts`, `.env.example`, borrar `.figma/` y `vite.figma.config.ts` | — |
| 0 | Base de datos: migración SQL de `profiles` + RLS + trigger, quitar el endpoint `/setup` inseguro, README de Supabase | Antigravity | `supabase/**` | — (en paralelo) |
| 1 | Sacar de `App.tsx` los datos, las constantes y los componentes chicos, solo moviéndolos | Codex | `App.tsx`, `src/app/data/*`, `src/app/components/lx/*` | Fase 0 |
| 2 | Contextos (sesión/perfil, progreso, Orion), router, layouts y páginas vacías. `App.tsx` queda como `legacy/App.legacy.tsx`, solo de referencia | Codex | `src/app/providers/*`, `src/app/routes.tsx`, `src/app/layouts/*`, páginas vacías | Fase 1 |
| 3 | Llenar las páginas pasando el JSX y la lógica desde el legacy (hasta 3 agentes en paralelo, sin compartir archivos) | Antigravity | A: `pages/auth/*` · B: `pages/student/*` sin la simulación · C: `pages/student/Mission*` · D: `pages/teacher/*` | Fase 2 |
| 4 | Borrar el legacy, integrar todo y hacer la prueba de humo con Playwright | Codex + yo | — | Fase 3 |

Después de cada pieza reviso el `git diff`, corro typecheck y build, y doy el veredicto (APROBADO / RECHAZADO con correcciones). Cada pieza tiene como máximo 3 vueltas. Ningún agente hace commit.

## Estado final (2026-11-23)

Migración completada. Ahora `App.tsx` tiene 84 líneas (antes 3.307) y solo decide qué layout y qué página mostrar según la ruta.

- Fase 0 ✅ (Codex + Antigravity; la instalación y verificación las terminó el coordinador)
- Fase 1 ✅ (Codex)
- Fase 2 ✅: 2a contextos, 2b navegación por URL (Codex). El coordinador agregó que la sesión demo sobreviva a recargas.
- Fase 3 ✅: páginas de auth, docente y estudiante (3 × Antigravity en paralelo); conexión y extracción de la simulación (Codex). El coordinador corrigió la carrera que saltaba Resultados.
- Fase 4 ✅: `pnpm typecheck` y `pnpm build` pasan. Prueba manual en navegador: acceso por formulario y demo, todas las rutas, misión completa (pista, atajo de teclado, reconsiderar, resultados), panel docente (3 pestañas, caso IA, plan), modo práctica, cierre de sesión y guards. Sin errores en consola.

## Ajuste del plan (durante la ejecución)

- **Fase 2 dividida.** 2a: contextos (Session, Progress, Prefs, Orion) ✅. 2b: `App.tsx` toma la pantalla de la URL, con guards y botón atrás funcionando.
- **Se descarta "legacy + páginas vacías",** porque deja la app rota entre fases. En la fase 3, cada pantalla sale de `App.tsx` a `pages/` una por una, y la app sigue funcionando en cada paso. Al final, `App.tsx` queda como layout.
- **Reparto de la fase 3:** la simulación (`SimScreen` + resultados) la hace Codex, porque necesita pruebas. Auth, el resto de pantallas de estudiante y el panel docente los hace Antigravity, en piezas sin archivos compartidos. La extracción en `App.tsx` es secuencial.
- **Seguridad pendiente:** RPC para recompensas (xp/coins/level), decisión sobre el registro abierto de docentes y el endpoint `/seed`.

## Riesgos

- **La simulación (`SimScreen`) es la parte más acoplada** (voces, temporizador, partículas, Orion). Por eso va sola en la pieza C.
- **Todo pasa por `App.tsx`, así que las fases 1 y 2 son secuenciales.** El paralelismo real empieza en la fase 3.
- **Datos demo y modo "Probar como estudiante".** Hay que mantener el bloqueo de escritura (`setWritesBlocked`) al pasarlo a contextos.
