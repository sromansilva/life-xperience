import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, getProfile, upsertProfile, updateXP, setWritesBlocked, getWriteLog, onWrite, type Profile } from "../../lib/supabase";
import { reconcileProgress } from "../lib/progress";
import { SEED_USERS, reconcileUser, makePracticeUser } from "../data/demo";
import type { User } from "../types";

export function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos";
  if (msg.includes("Email not confirmed")) return "Debes confirmar tu correo antes de ingresar";
  if (msg.includes("Too many requests")) return "Demasiados intentos. Espera un momento";
  if (msg.includes("User not found")) return "No existe una cuenta con ese correo";
  return msg;
}

// La sesión demo vive en memoria; se guarda el id en sessionStorage para sobrevivir recargas.
const DEMO_SESSION_KEY = "lx-demo-user";
function readDemoSession(): string | null { try { return sessionStorage.getItem(DEMO_SESSION_KEY); } catch { return null; } }
function writeDemoSession(id: string | null) { try { id ? sessionStorage.setItem(DEMO_SESSION_KEY, id) : sessionStorage.removeItem(DEMO_SESSION_KEY); } catch { /* sin storage */ } }

function useSessionState() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionSource, setSessionSource] = useState<"supabase" | "demo">("demo");
  const [demoProfiles, setDemoProfiles] = useState<Record<string, User>>(() => Object.fromEntries(SEED_USERS.map(user => [user.id, reconcileUser(user)])));
  const [practiceUser, setPracticeUser] = useState<User | null>(null);
  const [practiceStartedAt, setPracticeStartedAt] = useState(0);
  const [, setWriteTick] = useState(0);
  const [profileRevision, setProfileRevision] = useState(0);
  const [signedOutRevision, setSignedOutRevision] = useState(0);
  const isPractice = currentUser?.role === "teacher" && practiceUser !== null;
  const su = isPractice ? practiceUser : currentUser;
  const practiceWrites = isPractice ? getWriteLog().filter(w => w.at >= practiceStartedAt) : [];

  useEffect(() => onWrite(() => setWriteTick(t => t + 1)), []);

  function applyProfile(profile: Profile) {
    const user: User = {
      id: profile.id, name: profile.name, last: profile.last, email: profile.email, grade: profile.grade,
      hairColor: profile.hair_color, hairStyle: profile.hair_style, skinTone: profile.skin_tone,
      shirtColor: profile.shirt_color, pet: profile.pet, level: profile.level, xp: profile.xp,
      coins: profile.coins, streak: profile.streak, role: profile.role,
      subject: profile.subject ?? undefined, group: profile.group_name ?? undefined,
    };
    setCurrentUser(user); setSessionSource("supabase"); setProfileRevision(n => n + 1);
  }

  async function resolveProfile(userId: string, email: string, meta: Record<string, any>) {
    let profile = await getProfile(userId);
    if (!profile) {
      profile = { id: userId, email, role: (meta?.role ?? "student") as "student" | "teacher",
        name: meta?.name ?? email.split("@")[0], last: meta?.last ?? "", grade: meta?.grade ?? "3°A",
        hair_color: "#2C1810", hair_style: "A", skin_tone: "#FDBCB4", shirt_color: "#6D28D9", pet: "🐶",
        level: 1, xp: 0, coins: 50, streak: 0, subject: null, group_name: null };
      await upsertProfile(profile);
    } else if (profile.role === "student") {
      const rec = reconcileProgress(profile.xp ?? 0, profile.level ?? 1);
      if (rec.changed) { profile = { ...profile, xp: rec.xp, level: rec.level }; await updateXP(profile.id, rec.xp, profile.coins ?? 0, rec.level); }
    }
    applyProfile(profile);
  }

  function restoreDemoSession() {
    const id = readDemoSession();
    const user = id ? demoProfiles[id] : undefined;
    if (user) { setCurrentUser({ ...user }); setSessionSource("demo"); setProfileRevision(n => n + 1); }
    else if (id) writeDemoSession(null);
  }

  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) await resolveProfile(session.user.id, session.user.email ?? "", session.user.user_metadata ?? {});
      else restoreDemoSession();
      setAuthLoading(false);
    }).catch(() => { clearTimeout(timeout); restoreDemoSession(); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await resolveProfile(session.user.id, session.user.email ?? "", session.user.user_metadata ?? {});
        setAuthLoading(false);
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null); setSignedOutRevision(n => n + 1); setAuthLoading(false);
      }
    });
    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  async function login(emailInput: string, pw: string, role: "student" | "teacher"): Promise<string | null> {
    const email = emailInput.trim();
    const demoHint = role === "student" ? "alejandro@demo.com" : "docente@demo.com";
    if (!email.includes("@")) return "Ingresa un correo válido";
    if (pw.length < 6) return "Mínimo 6 caracteres en la contraseña";
    const found = Object.values(demoProfiles).find(d => d.email.toLowerCase() === email.toLowerCase() && d.role === role);
    if (found) {
      if (pw !== "demo1234") return "Contraseña incorrecta para la cuenta demo. Usa demo1234";
      setCurrentUser({ ...found }); setSessionSource("demo"); writeDemoSession(found.id); setProfileRevision(n => n + 1); return null;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        const offline = error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed");
        return offline ? `Sin conexión con el servidor. Usa la cuenta demo ${demoHint} (contraseña demo1234).` : translateAuthError(error.message);
      }
      return null;
    } catch { return `Sin conexión con el servidor. Usa la cuenta demo ${demoHint} (contraseña demo1234).`; }
  }

  async function register(profile: Omit<Profile, "id">, password: string): Promise<string | null> {
    const email = profile.email.trim();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role: profile.role, name: profile.name, last: profile.last } } });
    if (error) return translateAuthError(error.message);
    if (data.user) {
      const saved = { ...profile, id: data.user.id, email };
      await upsertProfile(saved);
      if (data.session) applyProfile(saved);
      else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return "✅ Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.";
      }
    }
    return null;
  }

  function updateActiveProfile(patch: Partial<User>) {
    if (isPractice) { setPracticeUser(p => p ? { ...p, ...patch } : p); return; }
    setCurrentUser(p => p ? { ...p, ...patch } : p);
    const id = currentUser?.id;
    if (sessionSource === "demo" && id && demoProfiles[id]) setDemoProfiles(m => ({ ...m, [id]: { ...m[id], ...patch } }));
  }
  function persistXP(id: string, xp: number, coins: number, level: number) {
    if (!isPractice && sessionSource === "supabase") return updateXP(id, xp, coins, level);
  }
  function startPractice() { setWritesBlocked(true); setPracticeStartedAt(Date.now()); const user = makePracticeUser(); setPracticeUser(user); return user; }
  function exitPractice() { setPracticeUser(null); setWritesBlocked(false); }
  async function logout() {
    setWritesBlocked(false);
    if (sessionSource === "supabase") { try { await supabase.auth.signOut(); } catch { /* offline */ } }
    writeDemoSession(null);
    setCurrentUser(null); setPracticeUser(null);
  }
  return { currentUser, authLoading, sessionSource, demoProfiles, practiceUser, practiceStartedAt, isPractice, su, practiceWrites,
    profileRevision, signedOutRevision, login, register, logout, updateActiveProfile, persistXP, startPractice, exitPractice };
}
const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) { const value = useSessionState(); return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>; }
export function useSession() { const value = useContext(SessionContext); if (!value) throw new Error("useSession debe usarse dentro de SessionProvider"); return value; }
