# Configuración y Migraciones de Supabase (LifeXperience)

Este directorio contiene las definiciones de base de datos, migraciones versionadas y configuración para el CLI de Supabase.

---

## 1. Estructura del directorio

- `config.toml`: Configuración local del CLI de Supabase (`project_id = "lifexperience"`).
- `migrations/`: Scripts SQL versionados con marca de tiempo.
  - `20261123000000_profiles.sql`: Esquema de la tabla `public.profiles`, restricciones de integridad, políticas RLS por operación y triggers de creación (`handle_new_user`) y actualización (`handle_updated_at`).
- `seed.sql`: Semilla de datos para entorno local (los usuarios de prueba principales residen en el cliente).
- `functions/`: Edge Functions de Supabase.

---

## 2. Cómo aplicar las migraciones al proyecto remoto

Project Ref remoto: `loqhvgmvjytchoksliiu`

### Opción A: Mediante Supabase CLI (Recomendado)

1. Iniciar sesión en la CLI de Supabase (si aún no lo has hecho):
   ```bash
   npx supabase login
   ```
2. Vincular el repositorio local con el proyecto remoto de Supabase:
   ```bash
   npx supabase link --project-ref loqhvgmvjytchoksliiu
   ```
3. Aplicar las migraciones pendientes:
   ```bash
   npx supabase db push
   ```

### Opción B: Mediante el SQL Editor del Dashboard de Supabase

1. Abre el panel de control de Supabase:
   `https://supabase.com/dashboard/project/loqhvgmvjytchoksliiu`
2. Ve a la sección **SQL Editor** en el menú lateral izquierdo.
3. Crea una **New query**.
4. Copia el contenido completo de [20261123000000_profiles.sql](file:///C:/Users/sergi/OneDrive/Escritorio/LifeXperience/supabase/migrations/20261123000000_profiles.sql).
5. Pégalo en el editor y presiona **Run**.
6. El script es idempotente; puede ejecutarse varias veces sin generar errores de duplicación.

---

## 3. Variables de entorno necesarias en el Frontend

En la raíz del proyecto, el archivo `.env` debe incluir las siguientes variables:

```env
VITE_SUPABASE_URL=https://loqhvgmvjytchoksliiu.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_publica_aqui
```

### ⚠️ Regla crítica de seguridad sobre la `service_role`

- **La clave `service_role` (SUPABASE_SERVICE_ROLE_KEY) NUNCA debe ir en el frontend ni en ningún archivo `.env` que se empaquete para el navegador.**
- La clave `service_role` tiene privilegios de superadministrador y **ignora todas las reglas de Row Level Security (RLS)**.
- Solo debe existir en entornos de servidor seguros o Edge Functions que requieran tareas administrativas.
- En el cliente web solo se debe utilizar la clave pública anónima (`VITE_SUPABASE_ANON_KEY`).
