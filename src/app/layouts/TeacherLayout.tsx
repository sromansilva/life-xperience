import { type ReactNode } from "react";
import { Outlet, NavLink } from "react-router";
import { LogOut, Play } from "lucide-react";
import { P } from "../theme";
import { LXLogo, Shell } from "../components/lx";
import { Portrait } from "../art/characters";
import { useSession } from "../providers/SessionProvider";
import { useProgress } from "../providers/ProgressProvider";
import { useOrion } from "../providers/OrionProvider";
import { useAppNavigation, teacherPaths, type TeacherTab } from "../navigation";
import { stopVoicePlayback } from "../lib/voices";
import { TeacherProvider, useTeacher, T_NAV_ITEMS } from "../pages/teacher/shared";

export interface TeacherLayoutProps {
  /**
   * Elementos hijos opcionales. Si se proveen (ej. montaje en App.tsx con ruta comodín `*`),
   * se renderizan en lugar de `<Outlet />`.
   */
  children?: ReactNode;
  /**
   * Pestaña activa opcional para cuando se controla externamente por props.
   * Si no se especifica, se deriva de `useAppNavigation().teacherTab`.
   */
  activeTab?: TeacherTab;
  /**
   * Handler opcional cuando el usuario hace clic en una pestaña del sidebar.
   */
  onTabChange?: (tab: TeacherTab) => void;
  /**
   * Handler opcional para iniciar el modo práctica de estudiante.
   * Si no se provee, ejecuta `session.startPractice()` y navega a `/app`.
   */
  onStartPractice?: () => void;
  /**
   * Handler opcional para cerrar sesión.
   * Si no se provee, detiene audios, cierra sesión en Supabase/demo y navega a `/`.
   */
  onLogout?: () => void;
}

function TeacherLayoutInner({
  children,
  activeTab,
  onTabChange,
  onStartPractice,
  onLogout,
}: TeacherLayoutProps) {
  const { teacherTab, navigate } = useAppNavigation();
  const { currentUser, startPractice: sessionStartPractice, logout: sessionLogout } = useSession();
  const { resetPractice, resetProgress } = useProgress();
  const { setOrionChat } = useOrion();
  const { totalPlans } = useTeacher();

  const u = currentUser;
  const currentTab: TeacherTab = activeTab ?? teacherTab;

  function handleStartPractice() {
    if (onStartPractice) {
      onStartPractice();
      return;
    }
    sessionStartPractice();
    resetPractice();
    setOrionChat([]);
    navigate("/app");
  }

  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    stopVoicePlayback();
    await sessionLogout();
    navigate("/", { replace: true });
    setOrionChat([]);
    resetProgress();
  }

  return (
    <Shell>
      <div className="flex h-screen" style={{ background: P.bg }}>
        {/* Sidebar */}
        <aside
          className="w-64 flex-shrink-0 flex flex-col border-r py-6 px-4"
          style={{ background: P.s1, borderColor: P.border }}
        >
          <div className="mb-8 px-2">
            <LXLogo size={32} />
          </div>
          <nav className="space-y-1 flex-1">
            {T_NAV_ITEMS.map((n) => {
              const isItemActive = currentTab === n.id;
              return (
                <NavLink
                  key={n.id}
                  to={teacherPaths[n.id]}
                  end={n.id === "dashboard"}
                  onClick={(e) => {
                    if (onTabChange) {
                      e.preventDefault();
                      onTabChange(n.id);
                    }
                  }}
                  aria-current={isItemActive ? "page" : undefined}
                  className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={({ isActive }) =>
                    isActive || isItemActive
                      ? {
                          background: "rgba(34,211,238,.14)",
                          color: "#E9FDFF",
                          boxShadow: `inset 3px 0 0 ${P.c3}`,
                        }
                      : { color: P.muted }
                  }
                >
                  <n.icon size={18} aria-hidden="true" />
                  <span className="text-sm font-semibold">{n.lbl}</span>
                  {n.id === "plans" && totalPlans > 0 && (
                    <span
                      className="ml-auto text-xs font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: P.v3, color: "#fff" }}
                    >
                      {totalPlans}
                    </span>
                  )}
                  {n.id === "ai" && (
                    <span
                      className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(14,165,233,.2)", color: P.c4 }}
                    >
                      NEW
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleStartPractice}
            className="w-full min-h-11 flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl text-sm font-bold border transition-colors hover:bg-white/5"
            style={{
              color: P.c4,
              borderColor: "rgba(56,189,248,.45)",
              background: "rgba(14,165,233,.08)",
            }}
          >
            <Play size={15} aria-hidden="true" />
            Probar como estudiante
          </button>
          <div className="border-t pt-4" style={{ borderColor: P.border }}>
            <div className="flex items-center gap-3 mb-3 px-2">
              <Portrait who="garcia" size={40} />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: P.text }}>
                  {u ? `${u.name} ${u.last}` : "Docente"}
                </p>
                <p className="text-xs truncate" style={{ color: P.muted }}>
                  {u?.subject ?? "Docente"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
              style={{ color: P.muted, borderColor: P.border }}
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </Shell>
  );
}

/**
 * Layout principal del panel docente de LifeXperience.
 * Incluye el proveedor de estado compartido TeacherProvider para preservar
 * el estado del generador de casos IA entre cambios de pestaña.
 */
export function TeacherLayout(props: TeacherLayoutProps) {
  return (
    <TeacherProvider>
      <TeacherLayoutInner {...props} />
    </TeacherProvider>
  );
}

export default TeacherLayout;
