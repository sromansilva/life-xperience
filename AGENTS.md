# LifeXperience

Aplicacion educativa con React, Vite y Tailwind CSS.

## Desarrollo

- Instala dependencias con `pnpm install`.
- Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`, usando `.env.example`. Sin ellas esta disponible el modo demo.
- Inicia con `pnpm dev`; verifica con `pnpm typecheck` y `pnpm build`.
- El codigo esta en `src/app`, los estilos en `src/styles` y el cliente de Supabase en `src/lib/supabase.ts`.
- Sigue `guidelines/Guidelines.md` y consulta `docs/PLAN-MIGRACION.md`. No incluyas `.env` en el control de versiones.
