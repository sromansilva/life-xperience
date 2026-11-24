import type { ReactNode } from "react";
import { BarChart3, Coins, Flame, FlaskConical, House, LogOut, Map as MapIcon, MessageCircle, Undo2, UserRound, Zap } from "lucide-react";
import { P, g } from "../theme";
import { CharSVG } from "../art/characters";
import { Shell, LXLogo, XPBar } from "../components/lx";
import { OrionFloatingAssistant, type OrionMissionContext } from "../OrionChat";
import { getLevelInfo } from "../lib/progress";
import { CONFETTI } from "../data/fx";
import type { AppScreen } from "../types";
import { useAppNavigation } from "../navigation";
import { useSession } from "../providers/SessionProvider";
import { useProgress } from "../providers/ProgressProvider";
import { useOrion } from "../providers/OrionProvider";

interface StudentLayoutProps {
  children: ReactNode;
  confetti: boolean;
  levelUpShow: boolean;
  reducedMotion: boolean;
  particles: { id: number; emoji: string; x: number; delay: number }[];
  animXP: number;
  decisionDialogOpen: boolean;
  orionMissionContext: OrionMissionContext | null;
  exitPractice: () => void;
  logout: () => void;
}
export function StudentLayout({ children, confetti, levelUpShow, reducedMotion, particles, animXP,
  decisionDialogOpen, orionMissionContext, exitPractice, logout }: StudentLayoutProps) {
  const { appScreen, setAppScreen } = useAppNavigation();
  const { su, isPractice, practiceWrites } = useSession();
  const { lastReward } = useProgress();
  const { orionChat, setOrionChat } = useOrion();
  const me = su!;
  const meLevel = getLevelInfo(me.xp);
  const mapScreens: AppScreen[] = ["skill", "sim", "results"];
  const STUDENT_NAV = [
    { id:"home" as AppScreen, icon:House, lbl:"Inicio" }, { id:"map" as AppScreen, icon:MapIcon, lbl:"Mapa" },
    { id:"orion" as AppScreen, icon:MessageCircle, lbl:"Orion" },
    { id:"dash" as AppScreen, icon:BarChart3, lbl:"Progreso" }, { id:"avatar" as AppScreen, icon:UserRound, lbl:"Avatar" },
  ];
  const activeNav = mapScreens.includes(appScreen) ? "map" : appScreen;
  const avatar = { hair: me.hairColor, hairStyle: me.hairStyle, skin: me.skinTone, shirt: me.shirtColor };
  const executedPracticeWrites = practiceWrites.filter(w => !w.blocked).length;
  const blockedPracticeWrites = practiceWrites.filter(w => w.blocked).length;
  const confettiList = CONFETTI;
  return (
    <Shell>
      {/* Short celebration (skipped with reduced motion; results are always shown as text) */}
      {confetti && !reducedMotion && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:100 }} aria-hidden="true">
          {confettiList.slice(0,30).map((p,i)=><div key={i} className="absolute rounded-sm" style={{ left:p.left,top:0,width:`${p.size}px`,height:`${p.size}px`,backgroundColor:p.color,transform:`rotate(${p.rot}deg)`,animation:`cffall 1.4s ${(i%10)*0.03}s linear forwards` }}/>)}
        </div>
      )}
      {levelUpShow && lastReward && !reducedMotion && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex:200 }} aria-hidden="true">
          <div className="text-center" style={{ animation:"lvup .45s cubic-bezier(.17,.67,.44,1.27)" }}>
            <div className="rounded-3xl px-8 py-4 border" style={{ background:"linear-gradient(135deg,#0A1220,#1a0e4e)", borderColor:"rgba(139,92,246,.5)", boxShadow:"0 0 60px rgba(139,92,246,.4)" }}>
              <p className="font-black text-3xl" style={{ color:"#C4B5FD" }}>¡Nivel {lastReward.newLevel}!</p>
              <p className="text-sm mt-1" style={{ color:"rgba(240,246,255,.85)" }}>Subiste de nivel</p>
            </div>
          </div>
        </div>
      )}
      {particles.length>0&&appScreen==="sim"&&!reducedMotion&&(
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:90 }} aria-hidden="true">
          {particles.map(p=>(
            <div key={p.id} className="absolute text-3xl" style={{ left:`${p.x}%`, bottom:"30%", animation:`particleup 1.4s ${p.delay}s ease-out forwards` }}>{p.emoji}</div>
          ))}
        </div>
      )}

      <div className="flex flex-col h-screen" style={{ background:P.bg }}>
        <a href="#lx-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg" style={{ background:P.v2, color:"#fff" }}>Saltar al contenido</a>

        {/* Teacher practice band */}
        {isPractice && (
          <div id="lx-band" role="region" aria-label="Vista de práctica docente" className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-3 border-b flex-shrink-0" style={{ background:"linear-gradient(90deg,#0B3550,#16305E)", borderColor:"rgba(56,189,248,.55)" }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(56,189,248,.2)" }}><FlaskConical size={18} style={{ color:P.c4 }} aria-hidden="true"/></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">Vista de práctica docente</p>
              <p className="text-xs leading-relaxed" style={{ color:"#D3E9F8" }}>
                Estás probando como estudiante con una cuenta de práctica. El avatar, el XP, las monedas y el progreso de esta vista no se guardan en ninguna cuenta.{" "}
                <span data-testid="practice-writes">Escrituras en Supabase durante la práctica: {executedPracticeWrites}{blockedPracticeWrites>0?` (bloqueadas: ${blockedPracticeWrites})`:""}.</span>
              </p>
            </div>
            <button type="button" onClick={exitPractice} className="min-h-11 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 flex-shrink-0" style={{ background:"#fff", color:"#0B3550" }}>
              <Undo2 size={16} aria-hidden="true"/>Volver al panel docente
            </button>
          </div>
        )}

        {/* Mobile navigation */}
        <nav id="lx-mobilenav" aria-label="Secciones" className="md:hidden flex items-center gap-1 px-3 py-2 border-b overflow-x-auto flex-shrink-0" style={{ background:P.s1, borderColor:P.border }}>
          <LXLogo size={22}/><span className="flex-1"/>
          {STUDENT_NAV.map(n=>{ const I=n.icon; return (
            <button key={n.id} type="button" onClick={()=>setAppScreen(n.id)} aria-current={activeNav===n.id?"page":undefined} className="min-w-11 min-h-11 px-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold"
              style={activeNav===n.id?{ background:"rgba(34,211,238,.14)", color:"#E9FDFF" }:{ color:P.muted }}><I size={18} aria-hidden="true"/>{n.lbl}</button>
          ); })}
          <button type="button" onClick={isPractice?exitPractice:logout} aria-label={isPractice?"Volver al panel docente":"Cerrar sesión"} className="min-w-11 min-h-11 rounded-xl flex items-center justify-center" style={{ color:P.muted }}>{isPractice?<Undo2 size={18}/>:<LogOut size={18}/>}</button>
        </nav>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside id="lx-sidebar" className="hidden md:flex w-60 flex-shrink-0 flex-col border-r py-5 px-3 overflow-y-auto" style={{ background:P.s1, borderColor:P.border }} aria-label="Barra lateral">
            <div className="px-2 mb-6"><LXLogo size={28}/></div>
            <button type="button" onClick={()=>setAppScreen("avatar")} aria-label={`Abrir mi perfil y avatar. ${me.name} ${me.last}, nivel ${meLevel.level}`} className="w-full rounded-2xl p-3 mb-5 border text-left transition-all hover:scale-[1.01]" style={{ background:P.s2, borderColor:P.border }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1 relative">
                  <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={52}/>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:g(P.v2,P.c2) }} aria-hidden="true"><span style={{ fontSize:9, color:"#fff" }}>✏️</span></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color:P.text }}>{me.name} {me.last}</p>
                  <p className="text-xs" style={{ color:P.muted }}>{me.grade}</p>
                  {me.pet&&me.pet!=="⛔"&&<p className="text-sm mt-0.5" aria-hidden="true">{me.pet}</p>}
                </div>
              </div>
              <XPBar xp={me.xp}/>
              <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor:P.border }}>
                {[{ icon:Zap,val:animXP.toLocaleString(),lbl:"XP",color:P.a4 },{ icon:Coins,val:String(me.coins),lbl:"Monedas",color:P.a3 },{ icon:Flame,val:`${me.streak}d`,lbl:"Racha",color:"#FDBA74" }].map(s=>(
                  <div key={s.lbl} className="text-center">
                    <div className="text-xs font-bold flex items-center gap-1 justify-center" style={{ color:s.color }}><s.icon size={12} aria-hidden="true"/>{s.val}</div>
                    <div className="text-[11px]" style={{ color:P.muted }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </button>
            <nav aria-label="Secciones" className="space-y-1 flex-1">
              {STUDENT_NAV.map(n=>{ const I=n.icon; const on=activeNav===n.id; return (
                <button key={n.id} type="button" onClick={()=>setAppScreen(n.id)} aria-current={on?"page":undefined} className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={on?{ background:"rgba(34,211,238,.14)", color:"#E9FDFF", boxShadow:`inset 3px 0 0 ${P.c3}` }:{ color:P.muted }}>
                  <I size={18} aria-hidden="true"/>{n.lbl}
                </button>
              ); })}
            </nav>
            <div className="border-t pt-3 mt-3" style={{ borderColor:P.border }}>
              {isPractice ? (
                <button type="button" onClick={exitPractice} className="w-full min-h-11 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5" style={{ color:P.c4, borderColor:"rgba(56,189,248,.45)" }}>
                  <Undo2 size={14} aria-hidden="true"/>Volver al panel docente
                </button>
              ) : (
                <button type="button" onClick={logout} className="w-full min-h-11 flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5" style={{ color:P.muted, borderColor:P.border }}>
                  <LogOut size={14} aria-hidden="true"/>Cerrar sesión
                </button>
              )}
            </div>
          </aside>

          {/* Main */}
          <main id="lx-main" tabIndex={-1} className="flex-1 overflow-y-auto">
            <div className={`${appScreen==="sim"?"max-w-[1400px]":"max-w-5xl"} mx-auto px-4 sm:px-8 py-6 sm:py-8`}>
              {children}
            </div>
          </main>
        </div>
      </div>
      {appScreen !== "orion" && !(appScreen === "sim" && decisionDialogOpen) && <OrionFloatingAssistant studentName={me.name} messages={orionChat} onMessagesChange={setOrionChat} missionContext={orionMissionContext}/>}
    </Shell>
  );

}
