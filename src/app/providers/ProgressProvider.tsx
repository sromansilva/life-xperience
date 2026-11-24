import { createContext, useContext, useState, type ReactNode } from "react";
import { computeReward, computeScore } from "../lib/progress";
import { getScript, findMission, WORLDS } from "../data/worlds";
import type { DoneMap, GenCase, MissionItem, MissionResult, MissionRun } from "../types";
import { useSession } from "./SessionProvider";

function useProgressState() {
  const { isPractice, su, updateActiveProfile, persistXP } = useSession();
  const [studentRun, setStudentRun] = useState<MissionRun | null>(null);
  const [practiceRun, setPracticeRun] = useState<MissionRun | null>(null);
  const [doneMissions, setDoneMissions] = useState<DoneMap>({});
  const [practiceDone, setPracticeDone] = useState<DoneMap>({});
  const [lastReward, setLastReward] = useState<MissionResult | null>(null);
  const [studentPlans, setStudentPlans] = useState<Record<string, GenCase[]>>({});
  const run = isPractice ? practiceRun : studentRun;
  const setRun = isPractice ? setPracticeRun : setStudentRun;
  const doneMap = isPractice ? practiceDone : doneMissions;
  const setDone = isPractice ? setPracticeDone : setDoneMissions;
  function patchRun(patch: Partial<MissionRun> | ((r: MissionRun) => Partial<MissionRun>)) {
    setRun(r => r ? { ...r, ...(typeof patch === "function" ? patch(r) : patch) } : r);
  }
  function beginMission(world: typeof WORLDS[0], mission: MissionItem) {
    const sc = getScript(mission.id);
    setRun({ worldId: world.id, missionId: mission.id, sceneId: sc.start, phase: "intro", path: null, decisions: [], hints: [],
      lastChoice: null, bonusXP: 0, lastBonus: 0, orionOpen: false, reread: false, supportRequested: false });
  }
  function completeMission() {
    const script = run ? getScript(run.missionId) : null;
    const mission = run ? findMission(run.worldId, run.missionId) : null;
    const outcome = script && run?.path ? script.outcomes?.[run.path] ?? null : null;
    if (!run || !run.path || !su || !mission || !outcome) return null;
    const reward = computeReward(su.xp, mission.xp, run.bonusXP);
    const coinsTotal = su.coins + reward.coins;
    const score = computeScore(outcome.score, run.decisions);
    updateActiveProfile({ xp: reward.newXP, coins: coinsTotal, level: reward.newLevel });
    persistXP(su.id, reward.newXP, coinsTotal, reward.newLevel);
    setDone(prev => ({ ...prev, [mission.id]: { score, xp: reward.xp, path: run.path ?? "" } }));
    setLastReward({ ...reward, missionId: mission.id, missionTitle: mission.title, missionEmoji: mission.emoji,
      worldId: run.worldId, outcome, score, negatives: run.decisions.filter(d => d.quality === "negative").length,
      hintsUsed: run.hints.length, coinsTotal, practice: isPractice });
    setRun(null);
    return reward;
  }
  function resetPractice() { setPracticeRun(null); setPracticeDone({}); setLastReward(null); }
  function resetProgress() { setStudentRun(null); setDoneMissions({}); resetPractice(); }
  return { studentRun, practiceRun, doneMissions, practiceDone, run, setRun, doneMap, setDone,
    lastReward, setLastReward, studentPlans, setStudentPlans, patchRun, beginMission, completeMission, resetPractice, resetProgress };
}
const ProgressContext = createContext<ReturnType<typeof useProgressState> | null>(null);
export function ProgressProvider({ children }: { children: ReactNode }) { const value = useProgressState(); return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>; }
export function useProgress() { const value = useContext(ProgressContext); if (!value) throw new Error("useProgress debe usarse dentro de ProgressProvider"); return value; }
