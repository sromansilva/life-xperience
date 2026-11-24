# LifeXperience

Plataforma educativa para practicar habilidades para la vida con simulaciones, misiones y un mentor (Orion). Está hecha con React 18, Vite 6, Tailwind CSS 4, React Router 7 y Supabase.

## Requisitos

- Node.js 22 o superior
- pnpm 10 o superior

## Inicio rápido

```bash
pnpm install
cp .env.example .env   # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
pnpm dev               # http://localhost:5173
```

Si no configuras Supabase, puedes entrar con las cuentas demo de la pantalla de acceso (contraseña `demo1234`).

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm typecheck` | Revisa los tipos con TypeScript |
| `pnpm build` | Genera la versión de producción en `dist/` |
| `pnpm preview` | Sirve `dist/` en local |

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Bienvenida |
| `/ingresar`, `/ingresar/estudiante`, `/ingresar/docente` | Acceso |
| `/registro`, `/registro/estudiante`, `/registro/docente` | Registro |
| `/app` | Inicio del estudiante |
| `/app/mapa`, `/app/mundo/:worldId` | Mapa y mundos |
| `/app/mision/:missionId`, `/app/mision/:missionId/resultados` | Simulación y resultados |
| `/app/progreso`, `/app/avatar`, `/app/orion` | Progreso, avatar y chat con Orion |
| `/docente`, `/docente/ia`, `/docente/planes` | Panel docente |

Las rutas `/app/*` y `/docente/*` piden sesión y el rol correspondiente. Las rutas se resuelven en `src/app/navigation.ts` y las redirecciones están en `src/app/App.tsx`.

## Estructura

```
src/
  main.tsx                 providers + router
  app/
    App.tsx                guards de ruta y elección de layout/página
    navigation.ts          mapa entre rutas y pantallas
    providers/             Session, Progress, Prefs y Orion (estado global)
    layouts/               StudentLayout, TeacherLayout
    pages/auth|student|teacher/
    components/lx/         componentes propios (XPBar, PrimaryBtn, AuthWrap…)
    components/ui/         componentes base (shadcn/Radix)
    data/                  mundos, misiones, casos, datos demo
    art/                   ilustraciones SVG
    lib/                   progreso, voces, pistas de Orion
  lib/supabase.ts          cliente y helpers de perfil
supabase/
  migrations/              esquema de la base (tabla profiles, RLS y triggers)
  functions/server/        función Edge
```

La configuración de Supabase está en [supabase/README.md](supabase/README.md).
