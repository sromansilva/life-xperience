import { CharSVG, TeacherFigure, OrionFigure, CAST, type Mood, type Pose, type Look } from "./characters";

/** How the class reacts to the presenter. Driven by the scene and by each choice. */
export type Crowd = "neutral" | "attentive" | "engaged" | "distracted" | "bored" | "tense" | "doubtful" | "restless" | "applause";

export const CROWD_LABEL: Record<Crowd, string> = {
  neutral: "El público escucha en silencio.",
  attentive: "El público te mira con atención.",
  engaged: "El público participa: algunos levantan la mano.",
  distracted: "Parte del público se distrae con el celular.",
  bored: "El público pierde el interés y mira a otro lado.",
  tense: "Lucas se cruza de brazos y algunos se ríen. El ambiente se tensa.",
  doubtful: "Daniela levanta la mano con una duda; otros dudan de lo que dijiste.",
  restless: "El público mira el reloj: se acaba el tiempo.",
  applause: "El público aplaude.",
};

type Seat = { key: keyof typeof CAST; x: number; y: number; size: number; name?: string };
const BACK: Seat[] = [
  { key: "sofia", x: 585, y: 214, size: 150 },
  { key: "mateo", x: 700, y: 214, size: 150 },
  { key: "vale",  x: 815, y: 214, size: 150 },
];
const FRONT: Seat[] = [
  { key: "lucas",   x: 592, y: 288, size: 200, name: "Lucas" },
  { key: "daniela", x: 774, y: 288, size: 200, name: "Daniela" },
];

function reaction(crowd: Crowd, key: string, i: number): { mood: Mood; pose: Pose; look: Look } {
  switch (crowd) {
    case "attentive":  return { mood: "happy", pose: "stand", look: "left" };
    case "engaged":    return { mood: i % 2 ? "laugh" : "happy", pose: key === "lucas" || key === "mateo" ? "hand" : "stand", look: "left" };
    case "distracted": return key === "daniela" ? { mood: "bored", pose: "stand", look: "right" } : { mood: "bored", pose: "phone", look: "down" };
    case "bored":      return { mood: "bored", pose: "stand", look: i % 2 ? "up" : "right" };
    case "tense":      return key === "lucas" ? { mood: "frown", pose: "arms", look: "front" } : { mood: "laugh", pose: "stand", look: "left" };
    case "doubtful":   return key === "daniela" ? { mood: "thinking", pose: "hand", look: "left" } : { mood: "worried", pose: "stand", look: "left" };
    case "restless":   return { mood: "worried", pose: "stand", look: "up" };
    case "applause":   return { mood: "laugh", pose: "clap", look: "left" };
    default:           return { mood: i % 2 ? "thinking" : "happy", pose: "stand", look: "left" };
  }
}

function Desk({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={12} rx={4} fill="#B88A5A" />
      <rect x={x} y={y + 8} width={w} height={4} fill="#8F6740" />
      <rect x={x + 8} y={y + 12} width={w - 16} height={h} rx={4} fill="#9C7247" />
      <rect x={x + 8} y={y + 12} width={w - 16} height={6} fill="#7A5634" opacity=".6" />
    </g>
  );
}

function NamePlate({ x, y, text, active }: { x: number; y: number; text: string; active?: boolean }) {
  const w = text.length * 8 + 18;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={20} rx={10} fill={active ? "#22D3EE" : "rgba(10,18,48,.82)"} stroke={active ? "#E9FDFF" : "rgba(255,255,255,.35)"} />
      <text x={x} y={y + 14} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="Poppins,sans-serif" fill={active ? "#05202A" : "#F3F6FF"}>{text}</text>
    </g>
  );
}

function SpeakingMark({ x, y }: { x: number; y: number }) {
  return (
    <g className="lx-react">
      <rect x={x - 34} y={y} width={78} height={24} rx={12} fill="#22D3EE" />
      <g stroke="#05202A" strokeWidth="2.4" strokeLinecap="round"><path d={`M${x - 24} ${y + 9} v6`} /><path d={`M${x - 18} ${y + 6} v12`} /><path d={`M${x - 12} ${y + 9} v6`} /></g>
      <text x={x - 6} y={y + 16.5} textAnchor="start" fontSize="12" fontWeight="800" fontFamily="Poppins,sans-serif" fill="#05202A">Habla</text>
    </g>
  );
}

export function ClassroomScene({ mood = "nervous", board, crowd = "neutral", avatar, speaking = null, orion = "hidden", teacherMood }: {
  mood?: string;
  board?: { title: string; sub: string };
  crowd?: Crowd;
  avatar?: { hair: string; hairStyle: string; skin: string; shirt: string };
  speaking?: "garcia" | "lucas" | "daniela" | "student" | null;
  orion?: "hidden" | "present" | "alert";
  teacherMood?: Mood;
}) {
  const bTitle = board?.title ?? "Cambio Climático Global";
  const bSub = board?.sub ?? "¿Por qué nos afecta aquí?";
  const tMood: Mood = teacherMood ?? (crowd === "distracted" || crowd === "tense" || crowd === "bored" ? "worried" : crowd === "doubtful" ? "thinking" : "happy");
  return (
    <svg viewBox="0 0 960 540" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lx-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A4888" /><stop offset="1" stopColor="#2C3870" /></linearGradient>
        <linearGradient id="lx-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A3F72" /><stop offset="1" stopColor="#33295A" /></linearGradient>
        <linearGradient id="lx-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FD0F5" /><stop offset="1" stopColor="#D6EEFF" /></linearGradient>
        <radialGradient id="lx-spot" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FDE58A" stopOpacity=".35" /><stop offset="1" stopColor="#FDE58A" stopOpacity="0" /></radialGradient>
        <radialGradient id="lx-orion" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#8B72FF" stopOpacity=".55" /><stop offset="1" stopColor="#8B72FF" stopOpacity="0" /></radialGradient>
      </defs>
      {/* room */}
      <rect width="960" height="540" fill="url(#lx-wall)" />
      <rect y="330" width="960" height="54" fill="#27306A" />
      <rect y="380" width="960" height="160" fill="url(#lx-floor)" />
      {[420, 470, 520].map(y => <line key={y} x1="0" y1={y} x2="960" y2={y} stroke="rgba(255,255,255,.05)" strokeWidth="2" />)}
      {/* windows + light */}
      {[640, 790].map(x => (
        <g key={x}>
          <rect x={x} y={46} width={124} height={150} rx={8} fill="#5C6BB0" />
          <rect x={x + 8} y={54} width={108} height={134} rx={4} fill="url(#lx-sky)" />
          <path d={`M${x + 62} 54 V188 M${x + 8} 121 H${x + 116}`} stroke="#5C6BB0" strokeWidth="5" />
          <ellipse cx={x + 40} cy={90} rx={18} ry={7} fill="#fff" opacity=".85" />
          <path d={`M${x + 8} 188 L${x - 40} 380 L${x + 150} 380 L${x + 116} 188 Z`} fill="#fff" opacity=".045" />
        </g>
      ))}
      {/* clock */}
      <g>
        {crowd === "restless" && <circle cx="596" cy="96" r="30" fill="#F5C542" opacity=".35" className="lx-react" />}
        <circle cx="596" cy="96" r="20" fill="#F3F6FF" stroke="#5C6BB0" strokeWidth="4" />
        <path d="M596 96 L596 83 M596 96 L606 101" stroke="#2A1E48" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* board */}
      <rect x="196" y="56" width="372" height="196" rx="10" fill="#7A5634" />
      <rect x="206" y="66" width="352" height="176" rx="6" fill="#1F5A45" />
      <rect x="206" y="66" width="352" height="176" rx="6" fill="#fff" opacity=".04" />
      <text x="382" y="112" textAnchor="middle" fill="rgba(255,255,255,.92)" fontSize="23" fontWeight="700" fontFamily="Poppins,sans-serif">{bTitle}</text>
      <text x="382" y="140" textAnchor="middle" fill="rgba(255,255,255,.72)" fontSize="15" fontFamily="Poppins,sans-serif">{bSub}</text>
      <g stroke="rgba(255,255,255,.35)" strokeWidth="2" fill="none" strokeLinecap="round">
        <circle cx="520" cy="200" r="20" /><path d="M500 200 H540 M520 180 Q508 200 520 220 Q532 200 520 180" />
        <path d="M236 176 H360 M236 196 H330 M236 216 H350" opacity=".6" />
      </g>
      <rect x="196" y="250" width="372" height="10" rx="4" fill="#6A4A2C" />
      {/* plant */}
      <g><path d="M906 330 Q890 290 912 262 Q918 300 906 330 Z M914 330 Q932 284 950 290 Q936 312 914 330 Z" fill="#3FA36B" /><rect x="896" y="326" width="34" height="40" rx="6" fill="#B85C38" /></g>

      {/* teacher */}
      <g transform="translate(46,162)"><TeacherFigure size={250} mood={tMood} pose={speaking === "garcia" ? "point" : "stand"} look="right" /></g>
      <NamePlate x={134} y={444} text="Prof. García" active={speaking === "garcia"} />
      {speaking === "garcia" && <SpeakingMark x={134} y={146} />}

      {/* presenter (the student) */}
      <ellipse cx="380" cy="430" rx="110" ry="22" fill="url(#lx-spot)" />
      <g transform="translate(300,196)"><CharSVG {...(avatar ?? { hair: "#2C1810", hairStyle: "A", skin: "#FDBCB4", shirt: "#6D28D9" })} mood={mood} size={232} look="right" pose={crowd === "applause" ? "hand" : "stand"} /></g>
      <NamePlate x={382} y={176} text="Tú" active={speaking === "student"} />

      {/* back row */}
      <g key={`back-${crowd}`} className="lx-react">
        {BACK.map((s, i) => { const r = reaction(crowd, s.key, i); return <g key={s.key} transform={`translate(${s.x},${s.y})`}><CharSVG {...CAST[s.key]} size={s.size} mood={r.mood} pose={r.pose} look={r.look} /></g>; })}
      </g>
      {BACK.map(s => <Desk key={`d${s.key}`} x={s.x - 6} y={300} w={118} h={40} />)}

      {/* front row */}
      <g key={`front-${crowd}`} className="lx-react">
        {FRONT.map((s, i) => { const r = reaction(crowd, s.key, i + 1); return <g key={s.key} transform={`translate(${s.x},${s.y})`}><CharSVG {...CAST[s.key]} size={s.size} mood={r.mood} pose={r.pose} look={r.look} /></g>; })}
      </g>
      {FRONT.map(s => <Desk key={`d${s.key}`} x={s.x - 8} y={404} w={158} h={70} />)}
      {FRONT.map(s => <NamePlate key={`n${s.key}`} x={s.x + 70} y={440} text={s.name!} active={speaking === s.key} />)}
      {FRONT.map(s => speaking === s.key ? <SpeakingMark key={`s${s.key}`} x={s.x + 70} y={262} /> : null)}

      {/* reaction marks */}
      <g key={`fx-${crowd}`} className="lx-react" fontFamily="Poppins,sans-serif" fontWeight="800">
        {crowd === "tense" && <><text x="800" y="282" fontSize="20" fill="#FDE58A">ja, ja</text><text x="620" y="238" fontSize="16" fill="#FDE58A">ja</text></>}
        {crowd === "doubtful" && <g><circle cx="900" cy="262" r="18" fill="#F3F6FF" /><text x="900" y="270" textAnchor="middle" fontSize="22" fill="#4B2BC9">?</text></g>}
        {crowd === "bored" && <text x="760" y="208" fontSize="18" fill="#C9D3F3">z z</text>}
        {crowd === "distracted" && <g stroke="#7DE8F8" strokeWidth="2.4" strokeLinecap="round"><path d="M588 330 q-6 -6 0 -12" /><path d="M708 330 q-6 -6 0 -12" /></g>}
        {crowd === "applause" && <g fill="#FDE58A">{[[640,250],[760,240],[880,262],[700,300]].map(([x,y],i)=><path key={i} d={`M${x} ${y-8} L${x+2.5} ${y-2.5} L${x+8} ${y} L${x+2.5} ${y+2.5} L${x} ${y+8} L${x-2.5} ${y+2.5} L${x-8} ${y} L${x-2.5} ${y-2.5} Z`} />)}</g>}
      </g>

      {/* Orion, the mentor, appears when he offers help */}
      {orion !== "hidden" && (
        <g key={`orion-${orion}`} className="lx-react">
          <circle cx="66" cy="112" r={orion === "alert" ? 60 : 50} fill="url(#lx-orion)" />
          <g transform="translate(29,62)"><OrionFigure size={104} mood={orion === "alert" ? "alert" : "warm"} glow={orion === "alert"} /></g>
          <NamePlate x={150} y={92} text="Orion" />
        </g>
      )}
    </svg>
  );
}
