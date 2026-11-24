import { P, SHADOW } from "../../theme";
import { BackArrow } from "../../components/lx";
import { WorldEmblem, MissionArt } from "../../art/illustrations";
import { WORLDS, WORLD_DESC, WORLD_MISSIONS, findMission } from "../../data/worlds";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";
import { btnPrimary, primaryStyle, stageOf } from "./shared";

export interface MapProps {
  /** Función continueMission de App.tsx para retomar la misión en curso */
  onContinueMission?: () => void;
}

export default function Map({ onContinueMission }: MapProps = {}) {
  const { run, doneMap } = useProgress();
  const { setAppScreen } = useAppNavigation();

  const runMission = run ? findMission(run.worldId, run.missionId) : null;
  const runWorld = run ? (WORLDS.find((w) => w.id === run.worldId) ?? null) : null;
  const rs = stageOf(run);

  function handleContinueMission() {
    if (onContinueMission) {
      onContinueMission();
    } else if (run) {
      setAppScreen("sim", run.missionId);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <BackArrow onClick={() => setAppScreen("home")} label="Volver al inicio" />
        <div>
          <h1 className="text-2xl font-black" style={{ color: P.text }}>Escenarios disponibles</h1>
          <p className="text-sm" style={{ color: P.muted }}>Elige un mundo para empezar la simulación</p>
        </div>
      </div>
      {run && runMission && runWorld && rs && (
        <div className="rounded-2xl p-4 mb-5 border flex flex-wrap items-center gap-4" style={{ background: "rgba(34,211,238,.08)", borderColor: P.c3 }}>
          <WorldEmblem worldId={runWorld.id} from={runWorld.from} to={runWorld.to} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: P.c4 }}>Misión activa · {runWorld.name}</p>
            <p className="text-sm font-bold" style={{ color: P.text }}>{runMission.title} — Etapa {rs.n} de {rs.total}: {rs.label}</p>
          </div>
          <button type="button" onClick={handleContinueMission} className={btnPrimary} style={primaryStyle}>Continuar misión</button>
        </div>
      )}
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {WORLDS.map((w, wi) => {
          const active = run?.worldId === w.id && !!rs;
          const missions = WORLD_MISSIONS[w.id] ?? [];
          const completed = missions.filter((mission) => doneMap[mission.id]).length;
          return (
            <li key={w.id} className="rounded-2xl overflow-hidden border flex flex-col" style={{ background: P.s1, borderColor: active ? P.c3 : P.border, boxShadow: active ? `0 0 0 2px ${P.c3}` : SHADOW.card }}>
              <div className="relative">
                <MissionArt worldId={w.id} from={w.from} index={wi} height={120} />
                <span className="absolute -bottom-5 left-4"><WorldEmblem worldId={w.id} from={w.from} to={w.to} size={44} /></span>
                {active && rs && <span className="absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: P.c3, color: "#05202A" }}>Activa · Etapa {rs.n}/{rs.total}</span>}
              </div>
              <div className="p-4 pt-7 flex flex-col flex-1">
                <h2 className="font-bold" style={{ color: P.text }}>{w.name}</h2>
                <p className="text-sm mt-1 leading-relaxed flex-1" style={{ color: P.muted }}>{WORLD_DESC[w.id]}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: P.muted }}><span>Progreso</span><span>{completed}/{missions.length} misiones</span></div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.1)" }} aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${(completed / missions.length) * 100}%`, background: P.a3 }} /></div>
                </div>
                <button type="button" onClick={() => setAppScreen("skill", w.id)}
                  aria-label={`${w.name}. Seleccionar. ${completed} de ${missions.length} misiones.${active && rs ? ` Misión activa en la etapa ${rs.n} de ${rs.total}.` : ""}`}
                  className={`${btnPrimary} w-full mt-4`} style={primaryStyle}>
                  {active ? "Ver misiones · en curso" : "Seleccionar"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
