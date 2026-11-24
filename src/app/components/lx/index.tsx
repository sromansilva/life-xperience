import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { P, g, SHADOW } from "../../theme";
import { OrionFigure } from "../../art/characters";
import { getLevelInfo } from "../../lib/progress";
import { STARS } from "../../data/fx";
import type { GenCase } from "../../types";

interface InputFieldProps { label:string; type?:string; value:string; onChange:React.ChangeEventHandler<HTMLInputElement>; placeholder?:string; error?:string; hint?:string; right?:React.ReactNode; onKeyDown?:React.KeyboardEventHandler<HTMLInputElement> }
interface PrimaryBtnProps { children:React.ReactNode; onClick?:React.MouseEventHandler<HTMLButtonElement>; full?:boolean; variant?:string; disabled?:boolean; size?:string }

export const card = { background: P.s1, borderColor: P.border } as const;

export function LXLogo({ size=32 }:{ size?:number }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="LifeXperience" role="img">
      <span className="font-black leading-none" aria-hidden="true" style={{ fontSize:size*.95, letterSpacing:"-3px", background:`linear-gradient(135deg,${P.v4},${P.v2} 55%,${P.c3})`, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>LX</span>
      <span className="font-black tracking-wide uppercase" aria-hidden="true" style={{ fontSize:size*.36, color:P.text }}>Life<span style={{ color:P.v4 }}>xperience</span></span>
    </div>
  );
}

export function XPBar({ xp, size="sm" }:{ xp:number; size?:"sm"|"lg" }) {
  const li = getLevelInfo(xp);
  return (
    <div>
      <div className={`flex justify-between mb-1.5 ${size==="lg"?"text-sm":"text-xs"}`}><span className="font-semibold" style={{ color:P.text }}>Nivel {li.level}</span><span style={{ color:P.a4 }}>{li.xpInLevel}/{li.xpForLevel} XP</span></div>
      <div role="progressbar" aria-label={`Progreso hacia el nivel ${li.level+1}`} aria-valuemin={0} aria-valuemax={li.xpForLevel} aria-valuenow={li.xpInLevel} aria-valuetext={`Nivel ${li.level}: ${li.xpInLevel} de ${li.xpForLevel} XP. Faltan ${li.xpToNext} XP para el nivel ${li.level+1}.`}
        className={`w-full ${size==="lg"?"h-3":"h-2"} rounded-full overflow-hidden`} style={{ background:"rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ width:`${li.pct}%`, background:g(P.a2,P.a4,"90deg"), transition:"width 1s ease" }}/>
      </div>
      {size==="lg"&&<p className="text-xs mt-1.5" style={{ color:P.muted }}>Te faltan {li.xpToNext} XP para el nivel {li.level+1}</p>}
    </div>
  );
}

export function DemoChip({ label="Datos demo" }:{ label?:string }) {
  return <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border align-middle" style={{ color:"#FCD34D", borderColor:"rgba(252,211,77,.45)", background:"rgba(252,211,77,.08)" }}>{label}</span>;
}

export function Toggle({ checked, onChange, label, desc, icon }:{ checked:boolean; onChange:(v:boolean)=>void; label:string; desc?:string; icon?:React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={()=>onChange(!checked)}
      className="w-full min-h-11 flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-colors"
      style={{ background:checked?"rgba(139,92,246,.14)":P.s2, borderColor:checked?P.v3:P.border }}>
      {icon&&<span aria-hidden="true" style={{ color:checked?P.v4:P.muted }}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color:P.text }}>{label}</span>
        {desc&&<span className="block text-xs mt-0.5" style={{ color:P.muted }}>{desc}</span>}
      </span>
      <span className="text-xs font-bold w-20 text-right" style={{ color:checked?P.v4:P.muted }}>{checked?"Activado":"Desactivado"}</span>
      <span aria-hidden="true" className="relative w-10 h-6 rounded-full flex-shrink-0" style={{ background:checked?P.v3:"rgba(255,255,255,.18)" }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left:checked?"20px":"4px" }}/>
      </span>
    </button>
  );
}

export function Skill({ label, value, gain, color=P.v3 }:{ label:string; value:number; gain?:number; color?:string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color:"rgba(240,246,255,.75)" }}>{label}</span>
        <div className="flex gap-2">{gain!==undefined&&<span className="font-black" style={{ color:P.g3 }}>+{gain}</span>}<span className="font-bold" style={{ color }}>{value}%</span></div>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${value}%`, background:`linear-gradient(90deg,${color}99,${color})`, boxShadow:`0 0 5px ${color}55` }}/>
      </div>
    </div>
  );
}

export function StatPill({ icon, val, label, color }:{ icon:React.ReactNode; val:string; label:string; color:string }) {
  return (
    <div className="rounded-2xl p-4 text-center border" style={card}>
      <div className="mb-1 flex justify-center" style={{ color }}>{icon}</div>
      <div className="font-black text-lg" style={{ color }}>{val}</div>
      <div className="text-xs mt-0.5" style={{ color:P.muted }}>{label}</div>
    </div>
  );
}

export function DiffBadge({ level }:{ level:"Básico"|"Intermedio"|"Avanzado" }) {
  const m = { Básico:[P.g3,"rgba(16,185,129,.18)"], Intermedio:[P.a3,"rgba(245,158,11,.18)"], Avanzado:[P.r3,"rgba(239,68,68,.18)"] };
  const [c, bg] = m[level];
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color:c, background:bg, borderColor:`${c}44` }}>{level}</span>;
}

export function BackArrow({ onClick, label="Volver" }:{ onClick:()=>void; label?:string }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border hover:bg-white/5 transition-colors" style={{ background:P.s2, borderColor:P.border, color:P.text }}><ArrowLeft size={18}/></button>;
}

export function InputField({ label, type="text", value, onChange, placeholder, error, hint, right, onKeyDown }:InputFieldProps) {
  return (
    <div className="mb-4">
      {label&&<label className="block text-xs font-bold mb-1.5" style={{ color:P.muted }}>{label}</label>}
      <div className="relative">
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} aria-label={label} aria-invalid={!!error}
          className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none transition-all"
          style={{ background:P.s2, borderColor:error?"#EF4444":P.border, color:P.text }}
          onFocus={e=>{(e.target as HTMLElement).style.borderColor=P.v3}}
          onBlur={e=>{(e.target as HTMLElement).style.borderColor=error?"#EF4444":P.border}}
        />
        {right&&<div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error&&<p className="text-xs mt-1" style={{ color:P.r3 }}>{error}</p>}
      {hint&&!error&&<p className="text-xs mt-1" style={{ color:P.muted }}>{hint}</p>}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, full=false, variant="violet", disabled=false, size="md" }:PrimaryBtnProps) {
  const bgs:Record<string,string> = { violet:g(P.v2,P.v1), cyan:g(P.v2,P.v1), green:g(P.g2,P.g1), ghost:"rgba(255,255,255,0.06)" };
  const shads:Record<string,string> = { violet:SHADOW.action, cyan:SHADOW.action, green:"0 6px 16px rgba(5,150,105,.3)", ghost:"none" };
  const pad = size==="lg"?"py-4 px-8 text-base font-black":size==="sm"?"py-1.5 px-4 text-xs font-bold":"py-3 px-6 text-sm font-bold";
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${full?"w-full":""} ${pad} ${disabled?"opacity-50 cursor-not-allowed":""} text-white`}
      style={{ background:bgs[variant], boxShadow:shads[variant], border:variant==="ghost"?`1px solid ${P.border}`:"none" }}>
      {children}
    </button>
  );
}

export function useTypewriter(text: string, speed = 18, instant = false) {
  const [chars, setChars]   = useState("");
  const [done,  setDone]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const skip = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); setChars(text); setDone(true); }, [text]);

  useEffect(() => {
    if (instant) { setChars(text); setDone(true); return; }
    setChars(""); setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    timerRef.current = setInterval(() => {
      i++; setChars(text.slice(0, i));
      if (i >= text.length) { if(timerRef.current) clearInterval(timerRef.current); setDone(true); }
    }, speed);
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [text, speed, instant]);

  return { chars, done, skip };
}

export function hideBrokenImage(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.visibility = "hidden"; }

export function avatarSelectedBadge(selected: boolean) {
  if (!selected) return null;
  return <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:"#fff" }} aria-hidden="true"><Check size={12} style={{ color:"#4C1D95" }}/></span>;
}

export function StageSteps({ n, total, label }:{ n:number; total:number; label:string }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold" style={{ color:P.text }}>Etapa {n} de {total} · {label}</p>
      <div className="flex gap-1.5 mt-2" aria-hidden="true">
        {Array.from({ length: total }).map((_,i)=>(
          <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i<n-1 ? P.g3 : i===n-1 ? P.v3 : "rgba(255,255,255,.14)" }}/>
        ))}
      </div>
    </div>
  );
}

export function OrionFace({ pulse, size=36 }:{ pulse?:number; size?:number }) {
  return (
    <span key={pulse} className={`inline-flex items-end justify-center rounded-2xl overflow-hidden flex-shrink-0 ${pulse?"orion-pop":""}`} aria-hidden="true"
      style={{ width:size, height:size, background:"linear-gradient(160deg,#2E2A7A,#17205A)", border:"1px solid rgba(187,170,255,.5)" }}>
      <OrionFigure variant="bust" size={size}/>
    </span>
  );
}

export const CSS = `
  .lx-welcome{background:radial-gradient(ellipse at 8% 82%,#32166A 0,transparent 36%),radial-gradient(ellipse at 100% 4%,#3E2096 0,transparent 36%),radial-gradient(ellipse at 75% 105%,#103D81 0,transparent 47%),#090F30}
  .lx-welcome-panel{background:linear-gradient(145deg,rgba(29,33,85,.92),rgba(12,17,50,.96));border:1px solid rgba(177,165,255,.38);box-shadow:0 18px 58px rgba(4,7,29,.62)}
  .lx-welcome-accent{color:#F28DF1;background:linear-gradient(100deg,#BBA2FF,#FA91E9);background-clip:text;-webkit-text-fill-color:transparent}
  .lx-neon-action{background:linear-gradient(100deg,#5530D1,#8732E7 60%,#AB258F);border:1px solid #D5B4FF;box-shadow:0 6px 22px rgba(157,60,248,.39),inset 0 1px 1px rgba(255,255,255,.32)}
  .lx-neon-action:hover{filter:brightness(1.12)}
  @keyframes cffall      {0%{transform:translateY(-60px) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}
  @keyframes bounce-icon {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes lvup        {0%{opacity:0;transform:scale(.5)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
  @keyframes particleup  {0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-180px) scale(0.5);opacity:0}}
  @keyframes fadeSlideIn {from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes lxStageIn   {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes lxFade      {from{opacity:0}to{opacity:1}}
  @keyframes orionPop    {0%{transform:scale(1);box-shadow:0 0 0 0 rgba(167,139,250,0)}40%{transform:scale(1.14);box-shadow:0 0 0 6px rgba(167,139,250,.35)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(167,139,250,0)}}
  .lx-stage-in{animation:lxStageIn .22s ease-out both}
  .lx-fade{animation:lxFade .18s ease-out both}
  .orion-pop{animation:orionPop .6s ease-out 1}
  @keyframes lxReact     {0%{opacity:.35;transform:translateY(6px)}100%{opacity:1;transform:none}}
  .lx-react{animation:lxReact .35s ease-out both}
  .lx-celebrate{animation:bounce-icon .7s ease-in-out 2}
  .lx-choice:hover,.lx-choice:focus-visible{border-color:rgba(167,139,250,.8)!important;background:rgba(109,40,217,.16)!important}
  :where(button,a,input,select,textarea,summary,[tabindex]):focus-visible{outline:3px solid #C4B5FD!important;outline-offset:2px!important}
  :where(h1,h2,h3)[tabindex="-1"]:focus{outline:none!important}
  button:disabled{cursor:not-allowed;opacity:.6}
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  }
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.35);border-radius:4px}
  input::placeholder,textarea::placeholder{color:rgba(147,168,198,0.85)}
  input,select,button{font-family:'Poppins',sans-serif}
  select option{background:#152035}
`;

export function Stars() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0 }}>
      {STARS.map((s,i)=><div key={i} className="absolute rounded-full bg-white animate-pulse" style={{ top:s.top,left:s.left,width:`${s.sz}px`,height:`${s.sz}px`,opacity:s.op,animationDelay:s.d,animationDuration:s.dur }}/>)}
      <div className="absolute" style={{ top:"-10%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle,rgba(109,40,217,0.09) 0%,transparent 65%)" }}/>
      <div className="absolute" style={{ bottom:"0",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 65%)" }}/>
    </div>
  );
}

export function RadarSVG({ data, color, size=240 }: { data:{skill:string;value:number}[]; color:string; size?:number }) {
  const N   = data.length;
  const CX  = size / 2;
  const CY  = size / 2 - 10;
  const R   = size * 0.33;
  const LR  = R + 28;
  const step = (2 * Math.PI) / N;

  const pt = (i:number, r:number) => {
    const a = i * step - Math.PI / 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };

  const polygon = (r:number) => data.map((_,i) => { const p=pt(i,r); return `${p.x},${p.y}`; }).join(' ');

  const dataPts = data.map((d,i)=>pt(i,(d.value/100)*R));
  const dataStr = dataPts.map(p=>`${p.x},${p.y}`).join(' ');

  const anchor = (x:number, cx:number) => x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ overflow:"visible", maxWidth:size*1.35, display:"block", margin:"0 auto" }}>
      {/* Grid rings */}
      {[20,40,60,80,100].map(lvl=>(
        <polygon key={`ring-${lvl}`} points={polygon((lvl/100)*R)}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {/* Spokes */}
      {data.map((_,i)=>{ const p=pt(i,R); return (
        <line key={`spoke-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      );})}
      {/* Data fill */}
      <polygon points={dataStr} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2}/>
      {/* Data dots */}
      {dataPts.map((p,i)=>(
        <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill={color} strokeWidth={1.5}
          stroke="rgba(0,0,0,0.3)"/>
      ))}
      {/* Labels */}
      {data.map((d,i)=>{ const p=pt(i,LR); return (
        <text key={`lbl-${i}`} x={p.x} y={p.y+3}
          textAnchor={anchor(p.x,CX)} fontSize="10.5" fill="rgba(124,143,172,0.9)"
          fontFamily="Poppins,sans-serif" fontWeight="600">
          {d.skill}
        </text>
      );})}
    </svg>
  );
}

export function CaseCard({ c, onRemove }:{ c:GenCase; onRemove:()=>void }) {
  const [exp, setExp] = useState(false);
  const world = [{ id:"com",from:"#7C3AED" },{ id:"fin",from:"#D97706" },{ id:"tea",from:"#059669" },{ id:"pen",from:"#2563EB" },{ id:"dig",from:"#0891B2" },{ id:"lid",from:"#CA8A04" },{ id:"emo",from:"#BE185D" },{ id:"cre",from:"#DB2777" },{ id:"inn",from:"#4F46E5" },{ id:"emp",from:"#16A34A" },{ id:"tie",from:"#EA580C" },{ id:"pro",from:"#9333EA" }].find(w=>w.id===c.worldId);
  const bg=world?.from??"#7C3AED";
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background:"#131D31", borderColor:"rgba(85,120,175,0.16)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl flex-shrink-0">{c.worldEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug" style={{ color:"#F0F6FF" }}>{c.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border" style={{ color:"#F0F6FF", borderColor:`${bg}66` }}>{c.worldName}</span>
              <span className="text-xs" style={{ color:c.difficulty==="Básico"?"#10B981":c.difficulty==="Intermedio"?"#F59E0B":"#EF4444" }}>{c.difficulty}</span>
              <span className="text-xs" style={{ color:"#7C8FAC" }}>⏱ {c.duration}</span>
              <span className="text-xs font-bold" style={{ color:"#A78BFA" }}>⚡ {c.xp} XP</span>
            </div>
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color:"rgba(240,246,255,.6)", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{c.objective}</p>
        <div className="flex gap-2">
          <button onClick={()=>setExp(p=>!p)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all" style={{ color:"#7C8FAC", borderColor:"rgba(85,120,175,0.16)" }}>{exp?"Ver menos ▲":"Ver completo ▼"}</button>
          <button onClick={onRemove} className="px-3 py-1.5 rounded-lg text-xs border transition-all" style={{ color:"#EF4444", borderColor:"rgba(239,68,68,.2)" }}>✕</button>
        </div>
      </div>
      {exp&&(
        <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor:"rgba(85,120,175,0.1)" }}>
          <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#38BDF8" }}>📖 Escenario</p><p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.75)" }}>{c.scenario}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"#F59E0B" }}>💬 Preguntas de reflexión</p>
            {c.questions.map((q,i)=><p key={i} className="text-xs mb-1 leading-relaxed" style={{ color:"rgba(240,246,255,.7)" }}><span className="font-black" style={{ color:"#F59E0B" }}>{i+1}. </span>{q}</p>)}
          </div>
          <div className="rounded-lg p-3 border" style={{ background:"rgba(16,185,129,.06)",borderColor:"rgba(16,185,129,.2)" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color:"#10B981" }}>✅ Evaluación</p>
            <p className="text-xs" style={{ color:"rgba(240,246,255,.7)" }}>{c.evaluation}</p>
          </div>
          {c.tips&&<div className="rounded-lg p-3 border" style={{ background:"rgba(14,165,233,.06)",borderColor:"rgba(14,165,233,.2)" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color:"#0EA5E9" }}>💡 Tips docente</p>
            <p className="text-xs" style={{ color:"rgba(240,246,255,.7)" }}>{c.tips}</p>
          </div>}
        </div>
      )}
    </div>
  );
}

export function Shell({ children }:{ children:React.ReactNode }) {
  return (
    <div className="bg-background text-foreground" style={{ fontFamily:"'Poppins',sans-serif",minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Stars/>
      <div className="relative" style={{ zIndex:1 }}>{children}</div>
    </div>
  );
}

export function AuthWrap({ title, sub, onBack, children, wide=false }:{ title:string; sub:string; onBack:()=>void; children:React.ReactNode; wide?:boolean }) {
  return (
    <div className="min-h-screen flex flex-col px-4 py-8" style={{ background:P.bg }}>
      <div className="max-w-5xl w-full mx-auto mb-8"><LXLogo size={36}/></div>
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-full ${wide?"max-w-2xl":"max-w-md"}`}>
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={onBack} aria-label="Volver" className="w-11 h-11 rounded-xl flex items-center justify-center border hover:bg-white/5 transition-colors" style={{ background:P.s1,borderColor:P.border,color:P.text }}><ArrowLeft size={18}/></button>
            <div><h1 className="text-2xl font-black" style={{ color:P.text }}>{title}</h1><p className="text-sm" style={{ color:P.muted }}>{sub}</p></div>
          </div>
          <div className="rounded-3xl p-6 sm:p-8 border" style={{ background:P.s1,borderColor:P.border,boxShadow:SHADOW.card }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
