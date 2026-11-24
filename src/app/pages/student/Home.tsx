import { Flame, Play, Sparkles, Clock, ChevronRight, Check, BarChart3 } from "lucide-react";
import { P, SHADOW } from "../../theme";
import { CharSVG, OrionFigure } from "../../art/characters";
import { MissionArt } from "../../art/illustrations";
import { getLevelInfo } from "../../lib/progress";
import { WORLDS, WORLD_MISSIONS, getScript, findMission } from "../../data/worlds";
import { PHASE_LABEL } from "../../data/sim";
import { DemoChip, DiffBadge, StageSteps } from "../../components/lx";
import { useSession } from "../../providers/SessionProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";
import { btnPrimary, btnGhost, primaryStyle, ghostStyle, stageOf } from "./shared";
import type { MissionItem } from "../../types";

export interface HomeProps {
  /** Función startMission de App.tsx para inicializar la simulación y navegar */
  onStartMission: (world: typeof WORLDS[0], mission: MissionItem) => void;
  /** Función continueMission de App.tsx para retomar la misión en curso */
  onContinueMission?: () => void;
}

export default function Home({ onStartMission, onContinueMission }: HomeProps) {
  const { su } = useSession();
  const { run, doneMap } = useProgress();
  const { setAppScreen } = useAppNavigation();

  if (!su) return null;

  const me = su;
  const meLevel = getLevelInfo(me.xp);
  const avatar = { hair: me.hairColor, hairStyle: me.hairStyle, skin: me.skinTone, shirt: me.shirtColor };

  const runMission = run ? findMission(run.worldId, run.missionId) : null;
  const runWorld = run ? (WORLDS.find((w) => w.id === run.worldId) ?? null) : null;

  const recWorld = WORLDS[0];
  const recMission = WORLD_MISSIONS.com.find((m) => !doneMap[m.id]) ?? WORLD_MISSIONS.com[0];
  const recIndex = WORLD_MISSIONS.com.indexOf(recMission);
  const recStages = getScript(recMission.id).stages.length;
  const rs = stageOf(run);
  const hero =
    run && runMission && runWorld && rs
      ? { world: runWorld, mission: runMission, index: (WORLD_MISSIONS[runWorld.id] ?? []).indexOf(runMission), continuing: true }
      : { world: recWorld, mission: recMission, index: recIndex, continuing: false };

  function handleContinueMission() {
    if (onContinueMission) {
      onContinueMission();
    } else if (run) {
      setAppScreen("sim", run.missionId);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black" style={{ color: P.text }}>Hola, {me.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: P.muted }}>Listo para vivir una nueva experiencia · {me.grade}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-2 border" style={{ background: "rgba(245,197,66,.08)", borderColor: "rgba(245,197,66,.35)" }}>
            <Flame size={16} style={{ color: "#FDBA74" }} aria-hidden="true" /><span className="font-bold text-sm" style={{ color: "#FDE58A" }}>{me.streak} días de racha</span>
          </div>
          <button type="button" onClick={() => setAppScreen("avatar")} aria-label={`Ver mi perfil · nivel ${meLevel.level}`} className="relative rounded-full overflow-hidden flex items-end justify-center" style={{ width: 52, height: 52, background: P.s3, boxShadow: `inset 0 0 0 2px ${P.v3}` }}>
            <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" variant="bust" size={52} />
            <span className="absolute -bottom-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[11px] font-black" style={{ background: P.a3, color: "#3A2600" }} aria-hidden="true">{meLevel.level}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Primary action: continue or choose a mission */}
          <section aria-labelledby="home-mission-title" className="rounded-3xl overflow-hidden border grid sm:grid-cols-5" style={{ background: P.s1, borderColor: hero.continuing ? P.c3 : P.border, boxShadow: SHADOW.card }}>
            <div className="sm:col-span-2 relative min-h-[200px]">
              <div className="absolute inset-0"><MissionArt worldId={hero.world.id} from={hero.world.from} index={hero.index} height={260} /></div>
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black" style={{ background: "rgba(10,18,48,.88)", color: hero.continuing ? P.c4 : P.v4, border: `1px solid ${hero.continuing ? P.c3 : P.v3}` }}>
                {hero.continuing ? <><Play size={12} aria-hidden="true" />Misión en curso</> : <><Sparkles size={12} aria-hidden="true" />Recomendada por Orion</>}
              </span>
            </div>
            <div className="sm:col-span-3 p-6 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: P.c4 }}>{hero.continuing ? "Continuar misión" : "Elegir misión"} · {hero.world.name}</p>
              <h2 id="home-mission-title" className="text-2xl font-black mt-1" style={{ color: P.text }}>{hero.continuing ? `Continuar misión: ${hero.mission.title}` : hero.mission.title}</h2>
              {hero.continuing && run && rs ? (<>
                <StageSteps n={rs.n} total={rs.total} label={rs.label} />
                <p className="text-sm mt-3" style={{ color: P.muted }}>
                  {run.decisions.length} {run.decisions.length === 1 ? "decisión tomada" : "decisiones tomadas"} · {run.hints.length} {run.hints.length === 1 ? "pista de Orion usada" : "pistas de Orion usadas"} · Retomas en: {PHASE_LABEL[run.phase].toLowerCase()}
                </p>
              </>) : (<>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#D3DBF5" }}>{hero.mission.desc}</p>
                <div className="flex items-center gap-3 mt-3 text-xs flex-wrap" style={{ color: P.muted }}>
                  <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" />{hero.mission.dur}</span><DiffBadge level={hero.mission.diff} /><span>{recStages} etapas</span><span className="font-bold" style={{ color: P.a4 }}>+{hero.mission.xp} XP</span>
                </div>
              </>)}
              <div className="flex flex-wrap gap-3 mt-auto pt-5">
                {hero.continuing
                  ? <button type="button" onClick={handleContinueMission} className={`${btnPrimary} text-base px-6 py-3`} style={primaryStyle}>Continuar misión <ChevronRight size={18} aria-hidden="true" /></button>
                  : <button type="button" onClick={() => onStartMission(recWorld, recMission)} className={`${btnPrimary} text-base px-6 py-3`} style={primaryStyle}>Empezar misión <ChevronRight size={18} aria-hidden="true" /></button>}
                <button type="button" onClick={() => setAppScreen("map")} className={btnGhost} style={ghostStyle}>{hero.continuing ? "Elegir otra misión" : "Ver todas en el mapa"}</button>
              </div>
            </div>
          </section>

          <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm" style={{ color: P.text }}>Metas del día</h3>
              <span className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: P.a4 }}>2 de 3</span><DemoChip /></span>
            </div>
            {[{ done: true, text: "Completa una misión de Comunicación", xp: 50 },
              { done: true, text: "Mantén tu racha diaria activa", xp: 30 },
              { done: false, text: "Explora un mundo nuevo en el mapa", xp: 75 }].map((m, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: P.border }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={m.done ? { background: P.g2 } : { border: `2px solid ${P.muted}` }} aria-hidden="true">
                  {m.done && <Check size={14} className="text-white" />}
                </div>
                <span className="text-sm flex-1" style={{ color: m.done ? P.muted : P.text }}>{m.text}<span className="sr-only">{m.done ? " (hecha)" : " (pendiente)"}</span></span>
                <span className="text-xs font-bold" style={{ color: m.done ? P.g4 : P.a4 }}>{m.done ? "Hecha" : `+${m.xp} XP`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mentor panel */}
        <aside aria-labelledby="home-mentor" className="rounded-3xl border p-5 flex flex-col" style={{ background: "linear-gradient(180deg,#1A1F5A,#111C42)", borderColor: "rgba(187,170,255,.35)" }}>
          <h2 id="home-mentor" className="text-sm font-black uppercase tracking-wider" style={{ color: P.v4 }}>Orion · Mentor</h2>
          <div className="flex justify-center my-3"><OrionFigure size={150} /></div>
          <div className="rounded-2xl p-4 text-sm leading-relaxed" style={{ background: "rgba(255,255,255,.06)", color: "#E3E8FA" }}>
            {run ? <>Retoma tu misión donde la dejaste. Estás en la etapa <strong style={{ color: P.c4 }}>{rs?.label?.toLowerCase()}</strong>.</>
              : <>Podemos empezar practicando cómo comunicar tus ideas. Te recomiendo <strong style={{ color: P.c4 }}>{recMission.title}</strong>.</>}
            <span className="block mt-2">Te faltan <strong style={{ color: P.a4 }}>{meLevel.xpToNext} XP</strong> para el nivel {meLevel.level + 1}.</span>
          </div>
          <button type="button" onClick={() => setAppScreen("dash")} className={`${btnGhost} w-full mt-4`} style={ghostStyle}><BarChart3 size={15} aria-hidden="true" />Ver mi progreso</button>
        </aside>
      </div>
    </div>
  );
}
