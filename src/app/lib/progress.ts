// Single source of truth for XP → level → progress bar.
// XP is authoritative; the level is always derived from it, never stored on its own.

export const XP_PER_LEVEL = 500;

export interface LevelInfo {
  level: number;
  xpInLevel: number;   // XP earned inside the current level
  xpForLevel: number;  // XP needed to complete the current level
  xpToNext: number;    // XP still missing for the next level
  pct: number;         // 0–100, for the progress bar
}

export function levelFromXP(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function minXPForLevel(level: number): number {
  return (Math.max(1, Math.floor(level)) - 1) * XP_PER_LEVEL;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safe = Math.max(0, xp);
  const level = levelFromXP(safe);
  const xpInLevel = safe - minXPForLevel(level);
  return {
    level,
    xpInLevel,
    xpForLevel: XP_PER_LEVEL,
    xpToNext: XP_PER_LEVEL - xpInLevel,
    pct: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
  };
}

/**
 * Reconciles a stored profile whose `level` disagrees with its `xp`.
 * - Stored level higher than the XP explains → XP is raised to that level's minimum,
 *   so nobody sees their level drop.
 * - Stored level lower than the XP explains → the level is recomputed upwards.
 * In both cases the resulting level is derived from the resulting XP, so the visible
 * level and the progress bar always come from the same number.
 */
export function reconcileProgress(xp: number, storedLevel: number) {
  const safeXP = Math.max(Math.max(0, xp || 0), minXPForLevel(storedLevel || 1));
  const level = levelFromXP(safeXP);
  return { xp: safeXP, level, changed: safeXP !== xp || level !== storedLevel };
}

export interface Reward {
  baseXP: number;
  bonusXP: number;
  xp: number;        // total XP earned in this mission
  coins: number;     // coins earned in this mission
  prevXP: number;
  newXP: number;
  prevLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

export function coinsForXP(xp: number): number {
  return Math.floor(xp / 3);
}

export function computeReward(prevXP: number, baseXP: number, bonusXP: number): Reward {
  const xp = Math.max(0, baseXP) + Math.max(0, bonusXP);
  const newXP = prevXP + xp;
  const prevLevel = levelFromXP(prevXP);
  const newLevel = levelFromXP(newXP);
  return { baseXP, bonusXP, xp, coins: coinsForXP(xp), prevXP, newXP, prevLevel, newLevel, leveledUp: newLevel > prevLevel };
}

/** Grade the final decision of each scene; retries are reflected separately in the feedback. */
export function computeScore(outcomeScore: number, decisions: { sceneId: string; quality: string }[]): number {
  const finalChoices = new Map(decisions.map(decision => [decision.sceneId, decision.quality]));
  const partial = [...finalChoices.values()].filter(quality => quality === "ok").length;
  return Math.max(60, Math.min(100, outcomeScore - partial * 3));
}
