import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Shell } from "./components/lx";
import { P } from "./theme";
import { WORLDS, WORLD_MISSIONS } from "./data/worlds";
import { stopVoicePlayback } from "./lib/voices";
import { useSession } from "./providers/SessionProvider";
import { useProgress } from "./providers/ProgressProvider";
import { useOrion } from "./providers/OrionProvider";
import { useAppNavigation } from "./navigation";
import { TeacherLayout } from "./layouts/TeacherLayout";
import Splash from "./pages/auth/Splash";
import RoleSelect from "./pages/auth/RoleSelect";
import LoginStudent from "./pages/auth/LoginStudent";
import LoginTeacher from "./pages/auth/LoginTeacher";
import RegisterRole from "./pages/auth/RegisterRole";
import RegisterStudent from "./pages/auth/RegisterStudent";
import RegisterTeacher from "./pages/auth/RegisterTeacher";
import Dashboard from "./pages/teacher/Dashboard";
import AiCases from "./pages/teacher/AiCases";
import Plans from "./pages/teacher/Plans";
import StudentArea from "./pages/student/StudentArea";

export default function App() {
  const { authStep, appScreen, setAppScreen, teacherTab, path, worldId, missionId, isKnownRoute, isAuthRoute, navigate } = useAppNavigation();
  const { currentUser, authLoading, isPractice, profileRevision, startPractice: sessionStartPractice, logout: sessionLogout } = useSession();
  const { run, lastReward, resetPractice, resetProgress } = useProgress();
  const { setOrionChat } = useOrion();
  const selectedWorld = WORLDS.find(w => w.id === (worldId ?? (appScreen === "sim" ? run?.worldId : appScreen === "results" ? lastReward?.worldId : null))) ?? null;
  const u = currentUser!;
  useEffect(() => { document.documentElement.lang = "es"; }, []);
  useEffect(() => { if (profileRevision && currentUser) setOrionChat([]); }, [profileRevision]);
  function startPractice() { sessionStartPractice(); resetPractice(); setOrionChat([]); setAppScreen("home"); }
  async function logout() { stopVoicePlayback(); await sessionLogout(); navigate("/", { replace: true }); setOrionChat([]); resetProgress(); }

  const protectedRoute = path === "/app" || path.startsWith("/app/") || path === "/docente" || path.startsWith("/docente/");
  let redirectTo: string | null = null;
  if (!authLoading) {
    if (!currentUser && protectedRoute) redirectTo = "/ingresar";
    else if (currentUser && (isAuthRoute || path.startsWith("/ingresar/") || path.startsWith("/registro/"))) redirectTo = currentUser.role === "teacher" && !isPractice ? "/docente" : "/app";
    else if (currentUser && (path === "/docente" || path.startsWith("/docente/")) && (currentUser.role === "student" || isPractice)) redirectTo = "/app";
    else if (currentUser?.role === "teacher" && !isPractice && (path === "/app" || path.startsWith("/app/"))) redirectTo = "/docente";
    else if (!isKnownRoute) redirectTo = "/";
    else if (currentUser && appScreen === "skill" && !selectedWorld) redirectTo = "/app/mapa";
    else if (currentUser && missionId && ((appScreen === "sim" && run?.missionId !== missionId && lastReward?.missionId !== missionId) || (appScreen === "results" && lastReward?.missionId !== missionId))) {
      const fallbackWorld = Object.keys(WORLD_MISSIONS).find(id => WORLD_MISSIONS[id].some(m => m.id === missionId));
      redirectTo = fallbackWorld ? `/app/mundo/${encodeURIComponent(fallbackWorld)}` : "/app/mapa";
    }
  }
  useEffect(() => { if (redirectTo) navigate(redirectTo, { replace: true }); }, [redirectTo, navigate]);

  if (authLoading) return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center" style={{ background:P.bg }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-4xl mx-auto mb-5" style={{ background:`linear-gradient(135deg,${P.v2},${P.c2})`, boxShadow:`0 0 40px rgba(124,58,237,.5)` }}>LX</div>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color:P.v4 }}/>
          <p className="text-sm" style={{ color:P.muted }}>Cargando tu aventura…</p>
        </div>
      </div>
    </Shell>
  );

  if (redirectTo) return null;

  if (!currentUser) {
    if (authStep === "splash") return <Splash />;
    if (authStep === "role") return <RoleSelect />;
    if (authStep === "login-s") return <LoginStudent />;
    if (authStep === "login-t") return <LoginTeacher />;
    if (authStep === "reg-role") return <RegisterRole />;
    if (authStep === "reg-s") return <RegisterStudent />;
    return <RegisterTeacher />;
  }
  if (u.role === "teacher" && !isPractice) return (
    <TeacherLayout activeTab={teacherTab} onStartPractice={startPractice} onLogout={logout}>
      {teacherTab === "dashboard" && <Dashboard onStartPractice={startPractice} />}
      {teacherTab === "ai" && <AiCases />}
      {teacherTab === "plans" && <Plans />}
    </TeacherLayout>
  );

  return <StudentArea />;
}
