import { useState, useEffect } from "react";
import { Coins, Flame, Target, Clock, Trophy, MessageCircle } from "lucide-react";
import { P, g, SHADOW } from "../../theme";
import { Medal } from "../../art/illustrations";
import { XPBar, DemoChip, StatPill, RadarSVG, OrionFace } from "../../components/lx";
import { BADGES, RADAR_DATA } from "../../data/demo";
import { getLevelInfo } from "../../lib/progress";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useSession } from "../../providers/SessionProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";

export interface ProgressProps {
  /** Valor animado de XP (procedente de animXP en App.tsx). Si no se pasa, se anima internamente. */
  animXP?: number;
}

export default function Progress({ animXP: propAnimXP }: ProgressProps = {}) {
  const { su } = useSession();
  const { doneMap } = useProgress();
  const { setAppScreen } = useAppNavigation();
  const reducedMotion = useReducedMotion();

  const [localAnimXP, setLocalAnimXP] = useState(su?.xp ?? 0);

  useEffect(() => {
    if (propAnimXP !== undefined) return;
    const target = su?.xp ?? 0;
    if (reducedMotion) {
      setLocalAnimXP(target);
      return;
    }
    const t = setInterval(() => {
      setLocalAnimXP((p) => {
        if (p === target) {
          clearInterval(t);
          return p;
        }
        const step = Math.max(1, Math.ceil(Math.abs(target - p) / 40));
        return target > p ? Math.min(p + step, target) : Math.max(p - step, target);
      });
    }, 35);
    return () => clearInterval(t);
  }, [su?.xp, reducedMotion, propAnimXP]);

  if (!su) return null;

  const me = su;
  const meLevel = getLevelInfo(me.xp);
  const displayedXP = propAnimXP !== undefined ? propAnimXP : localAnimXP;
  const sessionDone = Object.keys(doneMap).length;

  return (
    <div>
      <h1 className="text-2xl font-black mb-0.5" style={{ color: P.text }}>Mi progreso</h1>
      <p className="mb-6" style={{ color: P.muted }}>Tu nivel, tus recompensas y tus insignias</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="sm:col-span-2 rounded-2xl p-5 border flex items-center gap-5" style={{ background: P.s1, borderColor: "rgba(245,197,66,.35)" }}>
          <Medal icon="trophy" size={64} />
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-bold" style={{ color: P.text }}>Nivel {meLevel.level}</h2>
              <span className="text-sm" style={{ color: P.muted }}>{displayedXP.toLocaleString()} XP en total</span>
            </div>
            <XPBar xp={me.xp} size="lg" />
          </div>
        </div>
        <div className="rounded-2xl p-5 border space-y-2.5" style={{ background: P.s1, borderColor: P.border }}>
          <p className="text-sm flex items-center gap-2" style={{ color: P.text }}><Coins size={16} style={{ color: P.a3 }} aria-hidden="true" /><strong>{me.coins}</strong> monedas</p>
          <p className="text-sm flex items-center gap-2" style={{ color: P.text }}><Flame size={16} style={{ color: "#FDBA74" }} aria-hidden="true" /><strong>{me.streak}</strong> días de racha</p>
          <p className="text-sm flex items-center gap-2" style={{ color: P.text }}><Target size={16} style={{ color: P.c4 }} aria-hidden="true" /><strong>{sessionDone}</strong> {sessionDone === 1 ? "misión completada" : "misiones completadas"} hoy</p>
        </div>
      </div>
      <div className="rounded-2xl p-5 border mb-6" style={{ background: P.s1, borderColor: P.border }}>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: P.text }}>Insignias <DemoChip /></h2>
        <ul className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {BADGES.map((b) => (
            <li key={b.name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border" style={{ background: P.s2, borderColor: P.border }}>
              <Medal icon={b.icon} size={44} />
              <span className="text-xs text-center leading-tight" style={{ color: P.muted }}>{b.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2 mb-3"><h2 className="font-bold text-sm" style={{ color: P.text }}>Estadísticas de la semana</h2><DemoChip /></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatPill icon={<Target size={22} aria-hidden="true" />} val="14" label="Misiones totales" color={P.v4} />
        <StatPill icon={<Clock size={22} aria-hidden="true" />} val="3.2h" label="Práctica" color={P.c4} />
        <StatPill icon={<Trophy size={22} aria-hidden="true" />} val="#8" label="Ranking" color={P.a3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: P.text }}>Radar de habilidades <DemoChip /></h3>
          <RadarSVG data={RADAR_DATA} color={P.v3} size={250} />
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: P.text }}>Actividad semanal <DemoChip /></h3>
          <div className="flex items-end gap-2 h-44">
            {[3, 5, 2, 7, 4, 6, 1].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg" style={{ height: `${(v / 7) * 140}px`, background: i === 5 ? g(P.v2, P.v3, "180deg") : "rgba(255,255,255,0.12)" }} title={`${v} misiones`} />
                <span className="text-xs" style={{ color: P.muted }}>{"LMXJVSD"[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-5 border flex flex-wrap items-center gap-4" style={{ background: "linear-gradient(135deg,#0A1220,#101E3A)", borderColor: "rgba(109,40,217,.25)" }}>
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <OrionFace size={40} />
          <div><h2 className="font-bold text-sm" style={{ color: P.text }}>¿Quieres conversar con Orion?</h2><p className="text-xs" style={{ color: P.muted }}>Habla o escribe sobre habilidades para la vida. No necesitas estar en una misión.</p></div>
        </div>
        <button type="button" onClick={() => setAppScreen("orion")} className="min-h-11 px-4 rounded-xl font-bold text-sm text-white inline-flex items-center gap-2" style={{ background: g(P.v2, P.v1), boxShadow: SHADOW.action }}>
          <MessageCircle size={16} aria-hidden="true" />Conversar con Orion
        </button>
      </div>
    </div>
  );
}
