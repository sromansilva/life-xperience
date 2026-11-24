import { Award,Coins,FlaskConical,Trophy,Zap } from "lucide-react";
import { Medal } from "../../art/illustrations";
import { OrionFace,XPBar } from "../../components/lx";
import { WORLDS } from "../../data/worlds";
import { getLevelInfo } from "../../lib/progress";
import { P } from "../../theme";
import { btnGhost,btnPrimary,ghostStyle,primaryStyle } from "./shared";
import type { MissionState } from "./useMission";

export default function Results({ state }: { state: MissionState }) {
  const { resultsHeadingRef, lastReward, setAppScreen } = state;
    const r = lastReward;
    if (!r) return (
      <div className="text-center py-16">
        <h1 ref={resultsHeadingRef} tabIndex={-1} className="text-xl font-bold mb-4" style={{ color:P.text }}>No hay resultados recientes</h1>
        <button type="button" onClick={()=>setAppScreen("map")} className={btnPrimary} style={primaryStyle}>Ir al mapa</button>
      </div>
    );
    const li = getLevelInfo(r.newXP);
    const world = WORLDS.find(w=>w.id===r.worldId);
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="relative inline-flex items-center justify-center mb-4 lx-celebrate" aria-hidden="true">
          <span className="absolute rounded-full" style={{ width:170, height:170, background:"radial-gradient(circle,rgba(245,197,66,.45),transparent 65%)" }}/>
          <span className="relative" style={{ filter:"drop-shadow(0 0 24px rgba(245,197,66,.55))" }}><Medal icon={r.leveledUp?"trophy":"star"} size={104}/></span>
        </div>
        <h1 ref={resultsHeadingRef} tabIndex={-1} className="text-3xl font-black mb-1" style={{ color:P.text }}>¡Misión completada!</h1>
        <p className="mb-4" style={{ color:P.muted }}>{r.missionTitle} · Puntuación {r.score}/100</p>
        {r.practice && <p className="inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 mb-5 border" style={{ color:P.c4, borderColor:"rgba(56,189,248,.45)", background:"rgba(14,165,233,.08)" }}><FlaskConical size={13} aria-hidden="true"/>Vista de práctica: esta recompensa solo existe en la sesión de práctica</p>}
        <p role="status" className="sr-only">Ganaste {r.xp} XP y {r.coins} monedas. {r.leveledUp?`Subiste al nivel ${r.newLevel}.`:`Sigues en el nivel ${r.newLevel}; faltan ${li.xpToNext} XP para el siguiente.`}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5" data-testid="results-reward">
          {[{ icon:<Zap size={26} aria-hidden="true"/>, val:`+${r.xp}`, lbl:"XP ganados", sub:`${r.baseXP} de la misión${r.bonusXP?` + ${r.bonusXP} de bonus`:""}`, color:P.a4, bg:"rgba(245,197,66,.10)", border:"rgba(245,197,66,.45)" },
            { icon:<Coins size={26} aria-hidden="true"/>, val:`+${r.coins}`, lbl:"Monedas", sub:`Total: ${r.coinsTotal}`, color:"#FDE68A", bg:"rgba(245,158,11,.12)", border:"rgba(252,211,77,.35)" },
            { icon:r.leveledUp?<Trophy size={26} aria-hidden="true"/>:<Award size={26} aria-hidden="true"/>, val:`Nivel ${r.newLevel}`, lbl:r.leveledUp?"¡Subiste de nivel!":"Nivel actual", sub:r.leveledUp?`Antes: nivel ${r.prevLevel}`:`Faltan ${li.xpToNext} XP para el nivel ${li.level+1}`, color:P.v4, bg:"rgba(139,114,255,.12)", border:"rgba(187,170,255,.4)" }].map(t=>(
            <div key={t.lbl} className="rounded-2xl p-5 border" style={{ background:t.bg, borderColor:t.border }}>
              <div className="mb-2 flex justify-center" style={{ color:t.color }}>{t.icon}</div>
              <div className="font-black text-2xl" style={{ color:t.color }}>{t.val}</div>
              <div className="text-sm mt-1 font-semibold" style={{ color:P.text }}>{t.lbl}</div>
              <div className="text-xs mt-0.5" style={{ color:P.muted }}>{t.sub}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border mb-5 text-left" style={{ background:P.s1, borderColor:P.border }}><XPBar xp={r.newXP} size="lg"/></div>
        <div className="rounded-2xl p-5 mb-5 text-left border" style={{ background:"linear-gradient(135deg,#151C52,#111C42)", borderColor:"rgba(187,170,255,.35)" }}>
          <div className="flex gap-3 items-start mb-3">
            <OrionFace size={52}/>
            <p className="text-sm leading-relaxed flex-1" style={{ color:"rgba(240,246,255,.92)" }}>
              <strong>{r.outcome.head}.</strong> {r.negatives>0?`Reconsideraste ${r.negatives} ${r.negatives===1?"decisión":"decisiones"} y seguiste adelante: volver a intentarlo también es aprender.`:"Tomaste buenas decisiones en cada etapa."} {r.hintsUsed>0?`Usaste ${r.hintsUsed} ${r.hintsUsed===1?"pista":"pistas"}.`:""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border" style={{ background:"rgba(16,185,129,.08)",borderColor:"rgba(52,211,153,.3)" }}>
              <p className="text-xs font-bold mb-1" style={{ color:P.g4 }}>Fortaleza</p>
              <p className="text-xs" style={{ color:"rgba(240,246,255,.85)" }}>{r.outcome.strength}</p>
            </div>
            <div className="rounded-xl p-3 border" style={{ background:"rgba(245,158,11,.08)",borderColor:"rgba(252,211,77,.3)" }}>
              <p className="text-xs font-bold mb-1" style={{ color:"#FDE68A" }}>A mejorar</p>
              <p className="text-xs" style={{ color:"rgba(240,246,255,.85)" }}>{r.outcome.improve}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button type="button" onClick={()=>setAppScreen("map")} className={btnGhost} style={ghostStyle}>Ver mapa</button>
          <button type="button" onClick={()=>setAppScreen("skill", world?.id)} className={btnPrimary} style={primaryStyle}>Otra misión de {world?.name ?? "este mundo"}</button>
        </div>
      </div>
    );
  }

