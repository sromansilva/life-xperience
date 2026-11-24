import { useLocation, useNavigate } from "react-router";
import type { AppScreen, AuthStep } from "./types";

export type TeacherTab = "dashboard" | "ai" | "plans";

export const authPaths: Record<AuthStep, string> = {
  splash: "/", role: "/ingresar", "login-s": "/ingresar/estudiante", "login-t": "/ingresar/docente",
  "reg-role": "/registro", "reg-s": "/registro/estudiante", "reg-t": "/registro/docente",
};
export const teacherPaths: Record<TeacherTab, string> = {
  dashboard: "/docente", ai: "/docente/ia", plans: "/docente/planes",
};

function decodeId(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const authEntry = (Object.entries(authPaths) as [AuthStep, string][]).find(([, value]) => value === path);
  const teacherEntry = (Object.entries(teacherPaths) as [TeacherTab, string][]).find(([, value]) => value === path);
  const worldMatch = /^\/app\/mundo\/([^/]+)$/.exec(path);
  const missionMatch = /^\/app\/mision\/([^/]+)(\/resultados)?$/.exec(path);
  const worldId = worldMatch ? decodeId(worldMatch[1]) : null;
  const missionId = missionMatch ? decodeId(missionMatch[1]) : null;
  const simpleScreens: Record<string, AppScreen> = {
    "/app": "home", "/app/mapa": "map", "/app/progreso": "dash", "/app/avatar": "avatar", "/app/orion": "orion",
  };
  const appScreen: AppScreen = teacherEntry ? "teacher" : worldMatch ? "skill" : missionMatch ? (missionMatch[2] ? "results" : "sim") : simpleScreens[path] ?? "home";
  const authStep = authEntry?.[0] ?? "splash";
  const teacherTab = teacherEntry?.[0] ?? "dashboard";
  const isKnownRoute = Boolean(authEntry || teacherEntry || worldMatch || missionMatch || simpleScreens[path]);
  function setAuthStep(step: AuthStep) { navigate(authPaths[step]); }
  function setTeacherTab(tab: TeacherTab) { navigate(teacherPaths[tab]); }
  function setAppScreen(screen: AppScreen, id?: string) {
    const paths: Record<AppScreen, string> = {
      home: "/app", map: "/app/mapa", skill: id ? `/app/mundo/${encodeURIComponent(id)}` : "/app/mapa",
      sim: id ? `/app/mision/${encodeURIComponent(id)}` : "/app/mapa",
      results: id ? `/app/mision/${encodeURIComponent(id)}/resultados` : "/app/mapa",
      dash: "/app/progreso", avatar: "/app/avatar", orion: "/app/orion", teacher: "/docente",
    };
    navigate(paths[screen]);
  }
  return { path, authStep, appScreen, teacherTab, worldId, missionId, isKnownRoute,
    isAuthRoute: Boolean(authEntry), setAuthStep, setAppScreen, setTeacherTab, navigate };
}
