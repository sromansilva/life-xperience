import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;           // = auth.user.id (UUID)
  email: string;
  role: "student" | "teacher";
  name: string;
  last: string;
  grade: string;        // e.g. "3°A"
  hair_color: string;
  hair_style: string;
  skin_tone: string;
  shirt_color: string;
  pet: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  subject: string | null;   // teacher only
  group_name: string | null; // teacher only
  created_at?: string;
}

// ─── Write guard ──────────────────────────────────────────────────────────────
// While a teacher is in "Probar como estudiante", every profile write is blocked
// and logged, so the practice session can never modify a real account.
export interface WriteLogEntry { op: string; userId: string; at: number; blocked: boolean }

let writesBlocked = false;
const writeLog: WriteLogEntry[] = [];
const listeners = new Set<() => void>();

export function setWritesBlocked(blocked: boolean) { writesBlocked = blocked; }
export function areWritesBlocked() { return writesBlocked; }
export function getWriteLog(): readonly WriteLogEntry[] { return writeLog; }
export function onWrite(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

function recordWrite(op: string, userId: string): boolean {
  const entry = { op, userId, at: Date.now(), blocked: writesBlocked };
  writeLog.push(entry);
  if (typeof window !== "undefined") (window as any).__lxSupabaseWrites = writeLog;
  if (entry.blocked) console.warn(`[LX] Escritura en Supabase bloqueada (vista de práctica): ${op}`);
  listeners.forEach(l => l());
  return !entry.blocked;
}

// ─── Profile helpers ──────────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) { console.error("getProfile:", error.message); return null; }
  return data as Profile;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  if (!recordWrite("upsertProfile", profile.id)) return;
  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" });
  if (error) console.error("upsertProfile:", error.message);
}

export async function updateXP(userId: string, xp: number, coins: number, level: number) {
  if (!recordWrite("updateXP", userId)) return;
  await supabase
    .from("profiles")
    .update({ xp, coins, level })
    .eq("id", userId);
}
