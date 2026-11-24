import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Unit = { symbol: string; kind: "letter" | "space" };
type FingerState = 0 | 1 | 2; // straight, bent, curled
type HandPose = {
  thumb: 0 | 1 | 2 | 3; // side, bent, tucked, across palm
  fingers: [FingerState, FingerState, FingerState, FingerState];
  spread?: "narrow" | "wide";
  rotation?: number;
  movement?: "curve" | "zigzag";
};

// Distinct, stylized keyframes make each letter visibly change in this demo.
// They are not certified LSP handshapes; replace them with reviewed assets before teaching LSP.
const HAND_POSES: Record<string, HandPose> = {
  A:  { thumb:0, fingers:[2,2,2,2] },
  B:  { thumb:2, fingers:[0,0,0,0] },
  C:  { thumb:1, fingers:[1,1,1,1], spread:"wide" },
  D:  { thumb:3, fingers:[0,2,2,2] },
  E:  { thumb:2, fingers:[1,1,1,1] },
  F:  { thumb:3, fingers:[1,0,0,0] },
  G:  { thumb:0, fingers:[0,2,2,2], rotation:-35 },
  H:  { thumb:0, fingers:[0,0,2,2], rotation:-35, spread:"narrow" },
  I:  { thumb:2, fingers:[2,2,2,0] },
  J:  { thumb:2, fingers:[2,2,2,0], movement:"curve" },
  K:  { thumb:3, fingers:[0,0,2,2], spread:"wide" },
  L:  { thumb:0, fingers:[0,2,2,2] },
  LL: { thumb:0, fingers:[0,2,2,2], movement:"curve" },
  M:  { thumb:3, fingers:[2,2,2,2] },
  N:  { thumb:1, fingers:[2,2,2,2] },
  Ñ:  { thumb:1, fingers:[2,2,2,2], movement:"curve" },
  O:  { thumb:3, fingers:[1,1,1,1] },
  P:  { thumb:3, fingers:[0,0,2,2], spread:"wide", rotation:150 },
  Q:  { thumb:0, fingers:[0,2,2,2], rotation:150 },
  R:  { thumb:2, fingers:[0,0,2,2], spread:"narrow" },
  S:  { thumb:3, fingers:[2,2,2,2] },
  T:  { thumb:1, fingers:[2,2,2,2], spread:"narrow" },
  U:  { thumb:2, fingers:[0,0,2,2], spread:"narrow" },
  V:  { thumb:2, fingers:[0,0,2,2], spread:"wide" },
  W:  { thumb:2, fingers:[0,0,0,2], spread:"wide" },
  X:  { thumb:2, fingers:[1,2,2,2] },
  Y:  { thumb:0, fingers:[2,2,2,0] },
  Z:  { thumb:2, fingers:[0,2,2,2], movement:"zigzag" },
};

function spellingUnits(text: string): Unit[] {
  // Keep Ñ distinct while folding accented vowels to their manual-alphabet letters.
  const normalized = Array.from(text.toLocaleUpperCase("es-PE").replace(/Ñ/g, "\uE000").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\uE000/g, "Ñ"));
  const units: Unit[] = [];
  for (let index = 0; index < normalized.length; index++) {
    const character = normalized[index];
    if (character === "L" && normalized[index + 1] === "L") {
      units.push({ symbol:"LL", kind:"letter" });
      index++;
    } else if (/^[A-ZÑ]$/.test(character)) {
      units.push({ symbol:character, kind:"letter" });
    } else if (/\s/.test(character) && units.length && units[units.length - 1].kind !== "space") {
      units.push({ symbol:" ", kind:"space" });
    }
  }
  if (units[units.length - 1]?.kind === "space") units.pop();
  return units;
}

function fingerPath(x: number, state: FingerState, tipY: number, spread: number): string {
  if (state === 0) return `M${x} 84 C${x + spread * .25} 62 ${x + spread} ${tipY + 24} ${x + spread} ${tipY}`;
  if (state === 1) return `M${x} 84 C${x + 2} 66 ${x + spread + 4} 52 ${x + spread + 14} 53 C${x + spread + 24} 54 ${x + spread + 24} 65 ${x + spread + 15} 68`;
  return `M${x} 84 C${x + 5} 70 ${x + spread + 7} 67 ${x + spread + 16} 72 C${x + spread + 23} 77 ${x + spread + 20} 85 ${x + spread + 12} 87`;
}

function thumbPath(thumb: HandPose["thumb"]): string {
  if (thumb === 0) return "M47 103 C32 98 23 90 17 77";
  if (thumb === 1) return "M48 103 C36 95 31 84 37 75 C42 68 49 75 52 83";
  if (thumb === 2) return "M48 103 C41 93 41 84 47 77";
  return "M47 103 C59 96 70 93 82 98";
}

function HandShape({ symbol, active }: { symbol: string; active: boolean }) {
  const pose = HAND_POSES[symbol] ?? HAND_POSES.A;
  const xs = [48, 63, 78, 93];
  const tips = [29, 16, 21, 34];
  const spread = pose.spread === "wide" ? 8 : pose.spread === "narrow" ? -3 : 1;
  const skin = "#FFD0B6";
  const outline = "#A85C55";

  return (
    <svg viewBox="0 0 140 160" role="img" aria-label={`Simulación gráfica de la letra ${symbol}`} className="w-full h-full">
      <g transform={`rotate(${pose.rotation ?? 0} 70 90)`}>
        {pose.fingers.map((state, index) => {
          const path = fingerPath(xs[index], state, tips[index], spread * ((index - 1.5) / 2));
          return <g key={index} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={path} stroke={outline} strokeWidth="18"/>
            <path d={path} stroke={skin} strokeWidth="13"/>
          </g>;
        })}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={thumbPath(pose.thumb)} stroke={outline} strokeWidth="19"/>
          <path d={thumbPath(pose.thumb)} stroke={skin} strokeWidth="14"/>
        </g>
        <path d="M45 76 C39 75 36 80 36 89 L35 117 C35 132 48 141 64 143 L88 141 C101 139 105 131 104 118 L102 84 C101 76 95 75 92 81 L88 103 C83 95 76 95 71 102 C66 94 59 94 54 101 C49 96 44 101 43 108 Z"
          fill={skin} stroke={outline} strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="M54 122 Q69 129 88 123" fill="none" stroke="#E8A48F" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
        <path d="M53 154 L51 137 M83 154 L82 137" stroke={outline} strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M54 154 L53 137 M82 154 L81 137" stroke={skin} strokeWidth="14" strokeLinecap="round"/>
        {pose.movement === "curve" && <g fill="none" stroke="#FDE58A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M110 58 C126 47 125 28 112 21"/><path d="M111 18 L111 27 L120 24"/>
        </g>}
        {pose.movement === "zigzag" && <g fill="none" stroke="#FDE58A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M43 19 H88 L50 40 H95"/><path d="M91 34 L98 40 L90 45"/>
        </g>}
      </g>
      {active && <circle cx="118" cy="130" r="7" fill="#67E8F9" opacity=".95"/>}
    </svg>
  );
}

/** Interactive letter-by-letter visual mock; hand poses are illustrative, not validated LSP. */
export function LspSpellingPreview({ text, compact = false, autoPlay = false }: { text: string; compact?: boolean; autoPlay?: boolean }) {
  const units = useMemo(() => spellingUnits(text), [text]);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const letterIndexes = useMemo(() => units.flatMap((unit, index) => unit.kind === "letter" ? [index] : []), [units]);
  const firstLetterIndex = letterIndexes[0] ?? -1;
  const lastLetterIndex = letterIndexes[letterIndexes.length - 1] ?? -1;
  const displayIndex = activeIndex >= 0 ? activeIndex : firstLetterIndex;
  const activeSymbol = displayIndex >= 0 ? units[displayIndex]?.symbol ?? "A" : "A";
  const currentPosition = Math.max(0, letterIndexes.indexOf(displayIndex));
  const finished = activeIndex >= 0 && activeIndex === lastLetterIndex;

  useEffect(() => {
    setActiveIndex(-1);
    setPlaying(autoPlay && !reducedMotion && letterIndexes.length > 0);
  }, [text, autoPlay, reducedMotion, letterIndexes.length]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const nextIndex = letterIndexes.find(index => index > activeIndex);
    if (nextIndex === undefined) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setActiveIndex(nextIndex), autoPlay ? 320 : 720);
    return () => clearTimeout(timer);
  }, [activeIndex, letterIndexes, playing, reducedMotion, autoPlay]);

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ block:"nearest", inline:"nearest", behavior:reducedMotion || playing ? "auto" : "smooth" });
  }, [displayIndex, reducedMotion, playing]);

  function stepNext() {
    const nextIndex = letterIndexes.find(index => index > (activeIndex >= 0 ? activeIndex : -1));
    setPlaying(false);
    setActiveIndex(nextIndex ?? firstLetterIndex);
  }

  function stepPrevious() {
    const previousIndex = [...letterIndexes].reverse().find(index => index < displayIndex);
    setPlaying(false);
    setActiveIndex(previousIndex ?? lastLetterIndex);
  }

  function togglePlayback() {
    if (reducedMotion) {
      stepNext();
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    setActiveIndex(-1);
    setPlaying(true);
  }

  const buttonStyle = { background:"rgba(34,211,238,.14)", borderColor:"rgba(103,232,249,.55)", color:"#E9FDFF" };
  const iconButton = "w-9 h-9 rounded-lg border inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

  return (
    <div className={`absolute inset-0 grid ${compact ? "grid-rows-[minmax(0,1fr)_auto_auto_auto] gap-1 p-1.5" : "grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-2 p-2.5 sm:p-3"} overflow-hidden`} data-testid="lsp-spelling-preview"
      style={{ background:"radial-gradient(circle at 50% 36%,#263778 0%,#111B42 58%,#09132F 100%)" }}>
      {!compact && <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider" style={{ color:"#A5F3FC" }}>Deletreo visual</p>
          <p className="text-[10px] truncate" style={{ color:"#CDD8F5" }}>Simulación por letra · no es traducción LSP</p>
        </div>
        <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background:"rgba(255,255,255,.08)", color:"#E3E8FA" }}>{letterIndexes.length} letras</span>
      </div>}

      <div className="min-h-0 flex items-center justify-center gap-3">
        {displayIndex >= 0 ? (
          <>
            <div className={`${compact ? "w-[58px] h-[70px]" : "w-[76px] h-[92px] sm:w-[88px] sm:h-[104px]"} shrink-0 rounded-xl border p-1 motion-safe:transition-transform`}
              style={{ background:"rgba(34,211,238,.09)", borderColor:"rgba(103,232,249,.3)", transform:playing && !reducedMotion ? `rotate(${currentPosition % 2 ? 2 : -2}deg)` : undefined }}>
              <HandShape symbol={activeSymbol} active={playing}/>
            </div>
            <div className="min-w-[72px] text-center">
              <span className={`block ${compact ? "text-3xl" : "text-4xl sm:text-5xl"} font-black leading-none`} style={{ color:"#fff" }} aria-hidden="true">{activeSymbol}</span>
              <span className={`block ${compact ? "text-[9px]" : "text-[10px]"} mt-1 font-semibold`} style={{ color:"#CDD8F5" }}>{currentPosition + 1} de {letterIndexes.length}</span>
              <span className="sr-only" aria-live="polite">Letra {activeSymbol}, {currentPosition + 1} de {letterIndexes.length}</span>
            </div>
          </>
        ) : <p className="text-xs text-center" style={{ color:"#CDD8F5" }}>Este texto no contiene letras para deletrear.</p>}
      </div>

      <div role="group" className={`min-w-0 overflow-x-auto rounded-lg border ${compact ? "px-1 py-0.5" : "px-1.5 py-1"}`} aria-label="Secuencia de letras; selecciona una para mostrarla"
        style={{ background:"rgba(5,9,28,.5)", borderColor:"rgba(255,255,255,.15)" }}>
        <div className="flex w-max min-w-full items-center justify-center gap-1">
          {units.map((unit, index) => unit.kind === "space"
            ? <span key={`space-${index}`} className="w-2 shrink-0" aria-hidden="true"/>
            : <button key={`${unit.symbol}-${index}`} type="button" onClick={() => { setPlaying(false); setActiveIndex(index); }}
                ref={index === displayIndex ? activeButtonRef : undefined}
                aria-label={`Mostrar posición ilustrativa de ${unit.symbol}`} aria-pressed={index === displayIndex}
                className={`${compact ? "min-w-5 h-6 text-[10px]" : "min-w-6 h-7 text-xs"} px-1 shrink-0 rounded-md flex items-center justify-center font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200`}
                style={index === displayIndex ? { background:"#67E8F9", color:"#07132F", boxShadow:"0 0 12px rgba(103,232,249,.4)" } : { background:"rgba(255,255,255,.09)", color:"#E3E8FA" }}>
                {unit.symbol}
              </button>)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1">
        <button type="button" onClick={stepPrevious} disabled={!letterIndexes.length} aria-label="Mostrar letra anterior" className={`${iconButton} ${compact ? "w-7 h-7" : ""}`}
          style={{ borderColor:"rgba(255,255,255,.2)", color:"#E3E8FA" }}><ChevronLeft size={15} aria-hidden="true"/></button>
        <button type="button" onClick={togglePlayback} disabled={!letterIndexes.length}
          className={`${compact ? "min-h-7 px-2 text-[10px]" : "min-h-9 px-3 text-[11px]"} rounded-full border font-black inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 motion-reduce:transition-none`}
          style={buttonStyle}>
          {reducedMotion ? <ChevronRight size={13} aria-hidden="true"/> : playing ? <Pause size={13} aria-hidden="true"/> : finished ? <RotateCcw size={13} aria-hidden="true"/> : <Play size={13} aria-hidden="true"/>}
          {reducedMotion ? "Siguiente" : playing ? "Pausar" : finished ? "Repetir" : "Reproducir"}
        </button>
        <button type="button" onClick={stepNext} disabled={!letterIndexes.length} aria-label="Mostrar letra siguiente" className={`${iconButton} ${compact ? "w-7 h-7" : ""}`}
          style={{ borderColor:"rgba(255,255,255,.2)", color:"#E3E8FA" }}><ChevronRight size={15} aria-hidden="true"/></button>
      </div>
      {compact && <p className="text-center text-[8px] leading-none truncate" style={{ color:"#CBD5F5" }}>{autoPlay ? "Acompaña la narración · simulación gráfica" : "Simulación gráfica · no es traducción LSP"}</p>}
    </div>
  );
}
