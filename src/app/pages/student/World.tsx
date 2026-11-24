import { Play, CheckCircle, Clock, Hand, RotateCcw } from "lucide-react";
import { P, SHADOW } from "../../theme";
import { BackArrow, DiffBadge } from "../../components/lx";
import { WorldEmblem, MissionArt } from "../../art/illustrations";
import { WORLDS, WORLD_MISSIONS, getScript, findMission } from "../../data/worlds";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";
import { btnPrimary, btnGhost, primaryStyle, ghostStyle, stageOf } from "./shared";
import type { MissionItem } from "../../types";

export interface WorldProps {
  /** ID del mundo a mostrar. Si no se pasa, se lee de useAppNavigation() */
  worldId?: string;
  /** Función startMission de App.tsx para inicializar la simulación y navegar */
  onStartMission: (world: typeof WORLDS[0], mission: MissionItem) => void;
  /** Función continueMission de App.tsx para retomar la misión en curso */
  onContinueMission?: () => void;
}

export default function World({ worldId, onStartMission, onContinueMission }: WorldProps) {
  const { run, doneMap } = useProgress();
  const { worldId: navWorldId, setAppScreen } = useAppNavigation();

  const effectiveId = worldId ?? navWorldId;
  const w = (effectiveId ? WORLDS.find((item) => item.id === effectiveId) : null) ?? (run ? WORLDS.find((item) => item.id === run.worldId) : null) ?? WORLDS[0];

  const runMission = run ? findMission(run.worldId, run.missionId) : null;
  const rs = stageOf(run);

  if (!w) {
    return (
      <div className="text-center py-20">
        <p style={{ color: P.text }}>Mundo no encontrado</p>
        <button type="button" onClick={() => setAppScreen("map")} className={btnPrimary} style={primaryStyle}>Volver al mapa</button>
      </div>
    );
  }

  const worldMs = WORLD_MISSIONS[w.id] ?? WORLD_MISSIONS.com;
  const doneCount = worldMs.filter((m) => doneMap[m.id]).length;

  function handleContinueMission() {
    if (onContinueMission) {
      onContinueMission();
    } else if (run) {
      setAppScreen("sim", run.missionId);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <BackArrow onClick={() => setAppScreen("map")} label="Volver al mapa" />
        <WorldEmblem worldId={w.id} from={w.from} to={w.to} size={44} />
        <div>
          <h1 className="text-2xl font-black" style={{ color: P.text }}>{w.name}</h1>
          <p className="text-sm" style={{ color: P.muted }}>{doneCount} de {worldMs.length} misiones completadas en esta sesión</p>
        </div>
      </div>
      <p className="text-sm mb-6 sm:ml-[112px]" style={{ color: P.g4 }}>
        {doneCount > 0 ? `+${worldMs.filter((m) => doneMap[m.id]).reduce((s, m) => s + (doneMap[m.id]?.xp ?? 0), 0)} XP ganados en este mundo` : "Completa misiones para ganar XP"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {worldMs.map((m, mi) => {
          const done = doneMap[m.id];
          const active = run?.missionId === m.id;
          const missionScript = getScript(m.id);
          const stages = missionScript.stages.length;
          const decisionCount = Object.values(missionScript.scenes).reduce((total, item) => total + item.choices.length, 0);
          return (
            <article key={m.id} className="rounded-2xl overflow-hidden border transition-all flex flex-col" style={{ background: P.s1, borderColor: active ? P.c3 : done ? P.g3 : P.border, boxShadow: active ? `0 0 0 2px ${P.c3}` : SHADOW.card }}>
              <div className="relative">
                <MissionArt worldId={w.id} from={w.from} index={mi} height={150} />
                {active && rs ? (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold" style={{ background: P.c3, color: "#05202A" }}><Play size={12} aria-hidden="true" /> En curso · Etapa {rs.n} de {rs.total}</div>
                ) : done ? (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: "rgba(4,120,87,.95)" }}><CheckCircle size={12} aria-hidden="true" /> Completada · {done.score}/100</div>
                ) : null}
                <div className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "rgba(10,18,48,.88)", color: P.a4 }}>+{m.xp} XP</div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-bold mb-1" style={{ color: P.text }}>{m.title}</h2>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: P.muted }}>{m.desc}</p>
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs" style={{ color: P.muted }}>
                  <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />{m.dur}</span><DiffBadge level={m.diff} /><span>{stages} etapas</span>
                  <span>{decisionCount} decisiones</span>
                </div>
                <p className="inline-flex items-center gap-1.5 mb-3 text-xs font-semibold" style={{ color: "#FDE58A" }}>
                  <Hand size={13} aria-hidden="true" />LSP visible · video pendiente
                </p>
                <div className="mt-auto space-y-2">
                  {active ? (
                    <>
                      <button type="button" onClick={handleContinueMission} className={`${btnPrimary} w-full`} style={primaryStyle}>Continuar misión</button>
                      <button type="button" onClick={() => onStartMission(w, m)} className={`${btnGhost} w-full`} style={ghostStyle}><RotateCcw size={14} aria-hidden="true" />Empezar de nuevo</button>
                    </>
                  ) : done ? (
                    <button type="button" onClick={() => onStartMission(w, m)} className={`${btnGhost} w-full`} style={ghostStyle}><RotateCcw size={14} aria-hidden="true" />Repetir misión</button>
                  ) : (
                    <button type="button" onClick={() => onStartMission(w, m)} className={`${btnPrimary} w-full`} style={primaryStyle}><Play size={14} aria-hidden="true" />Iniciar misión</button>
                  )}
                  {run && !active && <p className="text-xs" style={{ color: P.muted }}>Iniciarla reemplaza tu misión en curso ({runMission?.title}).</p>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
