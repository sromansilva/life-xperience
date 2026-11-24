import { useId } from "react";
import { shade } from "../theme";

// Illustrated characters with soft volume (gradients + light/shadow) and clear expressions.
// All characters share one construction so avatars, classmates and the teacher feel coherent.

export type Mood = "happy" | "nervous" | "confident" | "worried" | "surprised" | "bored" | "laugh" | "frown" | "thinking";
export type Pose = "stand" | "hand" | "phone" | "arms" | "point" | "clap";
export type Look = "front" | "left" | "right" | "down" | "up";

export interface CharProps {
  hair?: string; hairStyle?: string; skin?: string; shirt?: string;
  mood?: Mood | string; size?: number;
  pose?: Pose; look?: Look; glasses?: boolean;
  /** Bust crops to head and shoulders (portraits, avatars in lists). */
  variant?: "full" | "bust";
  pants?: string;
  title?: string;
}

const LOOK: Record<Look, [number, number]> = { front: [0, 0], left: [-1.4, 0.2], right: [1.4, 0.2], down: [0, 1.6], up: [0.6, -1.5] };

function Eyes({ mood, look }: { mood: string; look: Look }) {
  const [dx, dy] = LOOK[look] ?? LOOK.front;
  if (mood === "laugh") return (
    <g stroke="#1B1530" strokeWidth="2.2" fill="none" strokeLinecap="round">
      <path d="M46 43 Q51 38 56 43" /><path d="M64 43 Q69 38 74 43" />
    </g>
  );
  const lid = mood === "bored" ? 2.6 : mood === "confident" ? 1.1 : 0;
  return (
    <g>
      {[51, 69].map(cx => (
        <g key={cx}>
          <ellipse cx={cx} cy={42} rx={4.4} ry={mood === "surprised" ? 5.6 : 5} fill="#fff" />
          <circle cx={cx + dx} cy={42.4 + dy} r={2.8} fill="#2A1E48" />
          <circle cx={cx + dx + 0.9} cy={41.2 + dy} r={0.95} fill="#fff" />
          {lid > 0 && <rect x={cx - 5} y={36.4} width={10} height={lid + 2.4} fill="currentColor" />}
        </g>
      ))}
    </g>
  );
}

function Brows({ mood, color }: { mood: string; color: string }) {
  const d: Record<string, [string, string]> = {
    nervous:  ["M45 33 Q50 30 56 33.5", "M64 33.5 Q70 30 75 33"],
    worried:  ["M45 32 Q50 33 56 31", "M64 31 Q70 33 75 32"],
    frown:    ["M45 31 Q51 33 56 35", "M64 35 Q69 33 75 31"],
    surprised:["M45 30 Q50 26.5 56 30", "M64 30 Q70 26.5 75 30"],
    thinking: ["M45 32 Q50 30 56 32", "M64 30 Q70 28 75 31"],
  };
  const [a, b] = d[mood] ?? ["M45 32.5 Q50 29.5 56 32", "M64 32 Q70 29.5 75 32.5"];
  return <g stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none"><path d={a} /><path d={b} /></g>;
}

function Mouth({ mood }: { mood: string }) {
  const s = { stroke: "#8A3B46", strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const };
  switch (mood) {
    case "laugh":     return <path d="M52 52 Q60 62 68 52 Z" fill="#7A2B3A" stroke="#7A2B3A" strokeWidth="1.5" strokeLinejoin="round" />;
    case "happy":     return <path d="M52 53 Q60 59 68 53" {...s} />;
    case "confident": return <path d="M53 53 Q61 58 68 52" {...s} />;
    case "nervous":   return <path d="M52 55 Q56 53 60 55 T68 55" {...s} />;
    case "worried":   return <path d="M53 57 Q60 52 67 57" {...s} />;
    case "frown":     return <path d="M53 57.5 Q60 53 67 57.5" {...s} />;
    case "surprised": return <ellipse cx="60" cy="55.5" rx="3.6" ry="4.4" fill="#7A2B3A" />;
    case "bored":     return <path d="M54 55.5 L66 55.5" {...s} />;
    case "thinking":  return <path d="M56 55 Q61 56.5 66 54" {...s} />;
    default:          return <path d="M53 54 Q60 57 67 54" {...s} />;
  }
}

function HairBack({ style, color }: { style: string; color: string }) {
  if (style === "B") return <path d="M33 34 Q33 14 60 13 Q87 14 87 34 L89 76 Q60 84 31 76 Z" fill={color} />;
  if (style === "E") return <circle cx="60" cy="13" r="10" fill={color} />; // bun
  if (style === "D") return <path d="M80 30 Q98 36 92 64 Q86 52 82 44 Z" fill={color} />; // ponytail
  return null;
}

function HairFront({ style, color }: { style: string; color: string }) {
  const hi = shade(color, 0.25);
  switch (style) {
    case "B": return <g><path d="M36 36 Q37 15 60 14 Q84 15 84 36 Q76 25 62 27 Q48 25 36 36 Z" fill={color} /><path d="M44 21 Q52 17 60 18" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>;
    case "C": return <g fill={color}>{[[42,24],[50,17],[60,14],[70,17],[78,24],[38,33],[82,33]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={9} />)}<circle cx="55" cy="16" r="3" fill={hi} opacity=".5" /></g>;
    case "D": return <g><path d="M36 37 Q34 14 62 13 Q86 15 84 32 Q70 22 50 30 Q42 32 36 37 Z" fill={color} /><path d="M48 20 Q58 15 68 17" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>;
    case "E": return <g><path d="M36 36 Q36 16 60 15 Q84 16 84 36 Q80 24 60 22 Q42 24 36 36 Z" fill={color} /><path d="M46 21 Q54 18 62 19" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>;
    default:  return <g><path d="M35 36 Q34 13 60 12 Q87 13 85 36 Q81 26 72 24 Q64 31 52 26 Q42 28 35 36 Z" fill={color} /><path d="M46 19 Q56 14 66 16" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" /></g>;
  }
}

function Arms({ pose, shirt, skin, shirtDark }: { pose: Pose; shirt: string; skin: string; shirtDark: string }) {
  const sleeve = (d: string, k: string) => <path key={k} d={d} stroke={shirt} strokeWidth="11" strokeLinecap="round" fill="none" />;
  const hand = (x: number, y: number, k: string) => <circle key={k} cx={x} cy={y} r={5.6} fill={skin} />;
  switch (pose) {
    case "hand":  return <g>{sleeve("M38 80 Q32 96 31 110", "l")}{hand(31, 113, "lh")}{sleeve("M82 79 Q92 62 95 42", "r")}{hand(96, 37, "rh")}</g>;
    case "point": return <g>{sleeve("M38 80 Q32 96 31 110", "l")}{hand(31, 113, "lh")}{sleeve("M82 80 Q96 82 108 76", "r")}{hand(111, 75, "rh")}</g>;
    case "phone": return (
      <g>{sleeve("M38 80 Q36 96 50 100", "l")}{sleeve("M82 80 Q84 96 70 100", "r")}
        <rect x="52" y="90" width="16" height="22" rx="3" fill="#1D2347" /><rect x="54" y="92" width="12" height="17" rx="2" fill="#7DE8F8" opacity=".9" />
        {hand(52, 102, "lh")}{hand(68, 102, "rh")}</g>);
    case "arms":  return <g><path d="M38 84 Q60 104 82 86" stroke={shirtDark} strokeWidth="12" strokeLinecap="round" fill="none" /><path d="M82 84 Q60 98 38 88" stroke={shirt} strokeWidth="11" strokeLinecap="round" fill="none" />{hand(40, 90, "lh")}{hand(80, 89, "rh")}</g>;
    case "clap":  return <g>{sleeve("M38 80 Q40 92 55 96", "l")}{sleeve("M82 80 Q80 92 65 96", "r")}{hand(57, 94, "lh")}{hand(63, 94, "rh")}</g>;
    default:      return <g>{sleeve("M38 80 Q32 96 31 110", "l")}{sleeve("M82 80 Q88 96 89 110", "r")}{hand(31, 113, "lh")}{hand(89, 113, "rh")}</g>;
  }
}

/** Student / classmate / teacher figure. Keeps the original CharSVG props so every screen keeps working. */
export function CharSVG({ hair = "#2C1810", hairStyle = "A", skin = "#FDBCB4", shirt = "#6D28D9", mood = "happy", size = 100,
  pose = "stand", look = "front", glasses = false, variant = "full", pants = "#2A3358", title }: CharProps) {
  const uid = useId().replace(/:/g, "");
  const skinHi = shade(skin, 0.18), skinLo = shade(skin, -0.12);
  const shirtLo = shade(shirt, -0.28), shirtHi = shade(shirt, 0.18);
  const bust = variant === "bust";
  const vb = bust ? "18 4 84 84" : "0 0 120 170";
  const w = bust ? size : size * (120 / 170);
  const blush = ["happy", "laugh", "nervous", "confident"].includes(String(mood));
  return (
    <svg viewBox={vb} width={w} height={size} fill="none" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <radialGradient id={`sk${uid}`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor={skinHi} /><stop offset="1" stopColor={skin} /></radialGradient>
        <linearGradient id={`sh${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={shirtHi} /><stop offset="1" stopColor={shirtLo} /></linearGradient>
      </defs>
      {!bust && <ellipse cx="60" cy="164" rx="27" ry="5" fill="rgba(0,0,0,.25)" />}
      {!bust && <g>
        <rect x="45" y="110" width="13" height="50" rx="6" fill={pants} />
        <rect x="62" y="110" width="13" height="50" rx="6" fill={shade(pants, -0.15)} />
        <ellipse cx="51" cy="161" rx="10" ry="5" fill="#161B36" /><ellipse cx="69" cy="161" rx="10" ry="5" fill="#161B36" />
      </g>}
      <HairBack style={hairStyle} color={hair} />
      {/* torso */}
      <path d="M36 78 Q60 66 84 78 L88 116 Q60 124 32 116 Z" fill={`url(#sh${uid})`} />
      <path d="M52 70 L60 80 L68 70" fill={shirtHi} opacity=".55" />
      <Arms pose={pose} shirt={shirt} skin={skin} shirtDark={shirtLo} />
      {/* neck + head */}
      <rect x="53" y="58" width="14" height="16" rx="6" fill={skinLo} />
      <ellipse cx="36.5" cy="43" rx="4" ry="5.5" fill={skinLo} /><ellipse cx="83.5" cy="43" rx="4" ry="5.5" fill={skinLo} />
      <ellipse cx="60" cy="40" rx="24" ry="25.5" fill={`url(#sk${uid})`} />
      <g style={{ color: skin }}><Eyes mood={String(mood)} look={look} /></g>
      <Brows mood={String(mood)} color={shade(hair, -0.1)} />
      <path d="M59 46 Q60.5 49 62 46.5" stroke={skinLo} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {blush && <g fill="#F28B9B" opacity=".35"><ellipse cx="45" cy="51" rx="4.5" ry="2.6" /><ellipse cx="75" cy="51" rx="4.5" ry="2.6" /></g>}
      <Mouth mood={String(mood)} />
      {String(mood) === "nervous" && <path d="M83 28 Q86 33 83.5 35 Q81 33 83 28 Z" fill="#9FDCFF" opacity=".85" />}
      {glasses && <g stroke="#2A1E48" strokeWidth="1.8" fill="rgba(255,255,255,.12)"><circle cx="51" cy="42" r="6.4" /><circle cx="69" cy="42" r="6.4" /><path d="M57.4 42 L62.6 42" /></g>}
      <HairFront style={hairStyle} color={hair} />
    </svg>
  );
}

/** Prof. García — adult teacher (bun, glasses, cardigan, lanyard). */
export function TeacherFigure({ size = 200, mood = "happy", pose = "stand", look = "right", variant = "full" }: { size?: number; mood?: Mood; pose?: Pose; look?: Look; variant?: "full" | "bust" }) {
  return <CharSVG hair="#3B2418" hairStyle="E" skin="#D9A27C" shirt="#0E7490" pants="#2B2F4F" glasses mood={mood} pose={pose} look={look} size={size} variant={variant} />;
}

/** Orion — redesigned wizard mentor: warm, adult, with a starry robe and a glowing staff. */
export function OrionFigure({ size = 120, mood = "warm", variant = "full", glow = false }: { size?: number; mood?: "warm" | "alert" | "thinking"; variant?: "full" | "bust"; glow?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const bust = variant === "bust";
  const vb = bust ? "14 2 92 92" : "0 0 120 170";
  const w = bust ? size : size * (120 / 170);
  return (
    <svg viewBox={vb} width={w} height={size} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`rb${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8B72FF" /><stop offset="1" stopColor="#3A1FA8" /></linearGradient>
        <linearGradient id={`ht${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C62FF" /><stop offset="1" stopColor="#2E1890" /></linearGradient>
        <radialGradient id={`fc${uid}`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#FFE2CC" /><stop offset="1" stopColor="#EDBA97" /></radialGradient>
        <radialGradient id={`orb${uid}`}><stop offset="0" stopColor="#E9FDFF" /><stop offset=".5" stopColor="#7DE8F8" /><stop offset="1" stopColor="#22D3EE" stopOpacity="0" /></radialGradient>
      </defs>
      {!bust && <ellipse cx="60" cy="164" rx="30" ry="5" fill="rgba(0,0,0,.25)" />}
      {/* staff */}
      {!bust && <g><rect x="95" y="44" width="4.5" height="118" rx="2" fill="#8A5A2B" /><circle cx="97" cy="40" r={glow ? 13 : 10} fill={`url(#orb${uid})`} /><circle cx="97" cy="40" r="4.5" fill="#E9FDFF" /></g>}
      {/* robe */}
      {!bust && <path d="M34 76 Q60 64 86 76 L96 160 Q60 168 24 160 Z" fill={`url(#rb${uid})`} />}
      {bust && <path d="M30 80 Q60 66 90 80 L96 100 L24 100 Z" fill={`url(#rb${uid})`} />}
      <g fill="#FDE58A">{[[44,110],[70,124],[52,140],[78,96],[40,90]].map(([x,y],i)=><path key={i} d={`M${x} ${y-3} L${x+1} ${y-1} L${x+3} ${y} L${x+1} ${y+1} L${x} ${y+3} L${x-1} ${y+1} L${x-3} ${y} L${x-1} ${y-1} Z`} />)}</g>
      {!bust && <><path d="M36 82 Q26 104 34 118" stroke="#5B3FE0" strokeWidth="12" strokeLinecap="round" /><circle cx="35" cy="121" r="6" fill="#EDBA97" />
        <path d="M84 82 Q94 70 96 58" stroke="#5B3FE0" strokeWidth="12" strokeLinecap="round" /><circle cx="96" cy="56" r="6" fill="#EDBA97" /></>}
      {/* head */}
      <ellipse cx="60" cy="46" rx="20" ry="21" fill={`url(#fc${uid})`} />
      {/* beard */}
      <path d="M42 50 Q44 82 60 88 Q76 82 78 50 Q70 60 60 58 Q50 60 42 50 Z" fill="#F4F2FA" />
      <path d="M52 60 Q60 64 68 60" stroke="#D9D5EA" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* eyes & brows */}
      {mood === "thinking"
        ? <g stroke="#2A1E48" strokeWidth="2.2" strokeLinecap="round"><path d="M50 46 L55 46" /><path d="M65 46 L70 46" /></g>
        : <g><circle cx="52.5" cy="46" r="2.6" fill="#2A1E48" /><circle cx="67.5" cy="46" r="2.6" fill="#2A1E48" /><circle cx="53.3" cy="45.1" r=".8" fill="#fff" /><circle cx="68.3" cy="45.1" r=".8" fill="#fff" /></g>}
      <g stroke="#E7E3F3" strokeWidth="3" strokeLinecap="round"><path d={mood === "alert" ? "M47 38 Q52 34 57 37" : "M47 40 Q52 37 57 39.5"} /><path d={mood === "alert" ? "M63 37 Q68 34 73 38" : "M63 39.5 Q68 37 73 40"} /></g>
      <path d="M54 55 Q60 59 66 55" stroke="#9C4B55" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g fill="#F28B9B" opacity=".35"><ellipse cx="46" cy="52" rx="3.5" ry="2" /><ellipse cx="74" cy="52" rx="3.5" ry="2" /></g>
      {/* hat */}
      <path d="M30 32 Q60 24 90 32 Q60 38 30 32 Z" fill="#2E1890" />
      <path d="M38 31 Q52 -6 78 2 Q70 8 74 30 Q56 26 38 31 Z" fill={`url(#ht${uid})`} />
      <path d="M40 27 Q57 22 73 26 L74 30 Q56 26 39 31 Z" fill="#F5C542" />
      <path d="M62 10 L63.8 13.6 L67.6 14 L64.7 16.5 L65.6 20.3 L62 18.3 L58.4 20.3 L59.3 16.5 L56.4 14 L60.2 13.6 Z" fill="#FDE58A" />
    </svg>
  );
}

// ─── Cast of the pilot mission ────────────────────────────────────────────────
export type SpeakerId = "narrator" | "orion" | "garcia" | "lucas" | "daniela" | "sofia" | "student";
export const CAST: Record<"lucas" | "daniela" | "sofia" | "mateo" | "vale", { hair: string; hairStyle: string; skin: string; shirt: string }> = {
  lucas:   { hair: "#2C1810", hairStyle: "C", skin: "#AE8B6A", shirt: "#2563EB" },
  daniela: { hair: "#1A1A2E", hairStyle: "B", skin: "#D08B5B", shirt: "#DB2777" },
  sofia:   { hair: "#8B4513", hairStyle: "D", skin: "#FDBCB4", shirt: "#059669" },
  mateo:   { hair: "#3A2A1A", hairStyle: "A", skin: "#EDB98A", shirt: "#D97706" },
  vale:    { hair: "#5B3A29", hairStyle: "E", skin: "#614335", shirt: "#7C3AED" },
};

/** Round portrait used to identify who is speaking. */
export function Portrait({ who, size = 36, avatar }: { who: SpeakerId; size?: number; avatar?: { hair: string; hairStyle: string; skin: string; shirt: string } }) {
  const ring = who === "orion" ? "#8B72FF" : who === "garcia" ? "#22D3EE" : who === "narrator" ? "#A6B3DA" : "#F9A8D4";
  return (
    <span className="inline-flex items-end justify-center rounded-full overflow-hidden flex-shrink-0" aria-hidden="true"
      style={{ width: size, height: size, background: "#1F2E61", boxShadow: `inset 0 0 0 2px ${ring}` }}>
      {who === "orion" ? <OrionFigure variant="bust" size={size} />
        : who === "garcia" ? <TeacherFigure variant="bust" size={size} look="front" />
        : who === "narrator" ? <svg viewBox="0 0 24 24" width={size * .55} height={size * .55} style={{ marginBottom: size * .22 }}><path d="M4 6h16M4 12h16M4 18h10" stroke="#A6B3DA" strokeWidth="2.4" strokeLinecap="round" /></svg>
        : who === "student" && avatar ? <CharSVG {...avatar} variant="bust" size={size} />
        : <CharSVG {...(CAST[who as "lucas"] ?? CAST.lucas)} variant="bust" size={size} />}
    </span>
  );
}
