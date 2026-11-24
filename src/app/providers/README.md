# Dónde vive cada estado

| Estado o acción | Dónde vive |
| --- | --- |
| Usuario actual, carga de autenticación, origen de sesión (supabase/demo), perfiles demo | `SessionProvider` |
| Sesión de Supabase, registro, acceso, cierre y persistencia de XP | `SessionProvider` |
| Modo práctica del docente, bloqueo y registro de escrituras | `SessionProvider` |
| Id de la sesión demo (sobrevive a recargas) | `SessionProvider` → `sessionStorage["lx-demo-user"]` |
| Misiones y progreso real o de práctica, inicio y recompensa | `ProgressProvider` |
| Última recompensa y planes asignados por el docente | `ProgressProvider` |
| Preferencias de temporizador, texto instantáneo y audio | `PrefsProvider` |
| Conversación general con Orion | `OrionProvider` |
| Pantalla actual, mundo y misión seleccionados | URL, vía `navigation.ts` (`useAppNavigation`) |
| Formularios de acceso y registro | Estado local de cada página en `pages/auth/` |
| Generador de casos IA (mundo, dificultad, destinatario, caso generado) | `TeacherContext` en `pages/teacher/shared.tsx`, provisto por `TeacherLayout` |
| Simulación: reproducción, diálogos, temporizador, LSP, modo inmersivo, pistas | `pages/student/useMission.ts` |
| Celebración, partículas, XP animado y contexto de Orion para el marco | `useMission` → `StudentArea` → `StudentLayout` |
| Pestaña del avatar, panel expandido del inicio | Estado local de la página |

Los perfiles demo y los planes viven en memoria. El progreso y el perfil de práctica se reinician al entrar o salir del modo práctica, y mientras dura la práctica no se escribe nada en Supabase.
