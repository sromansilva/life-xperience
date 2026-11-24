import { P } from "../../theme";
import { getScript } from "../../data/worlds";
import type { MissionRun } from "../../types";

export const btnPrimary =
  "min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 inline-flex items-center justify-center gap-2";

export const btnGhost =
  "min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/5 inline-flex items-center justify-center gap-2";

export const primaryStyle = {
  background: "linear-gradient(110deg,#5832D5,#7939DD 68%,#9D36BF)",
  boxShadow: "0 5px 18px rgba(124,58,237,.34)",
};

export const ghostStyle = {
  color: P.text,
  borderColor: P.border,
  background: "rgba(255,255,255,.03)",
};

export function stageOf(r: MissionRun | null) {
  if (!r) return null;
  const sc = getScript(r.missionId);
  const scn = sc.scenes[r.sceneId];
  return scn ? { n: scn.stage, total: sc.stages.length, label: sc.stages[scn.stage - 1] } : null;
}
