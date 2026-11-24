import { useId, type ComponentType } from "react";
import { MessageCircle, Wallet, Users, Heart, Crown, Lightbulb, Palette, Rocket, Laptop, Sprout, Clock, Puzzle, Star, Flame, Trophy, Target, Zap, Lock } from "lucide-react";
import { CharSVG, CAST } from "./characters";
import { shade } from "../theme";

type Icon = ComponentType<{ size?: number; color?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
export const WORLD_ICON: Record<string, Icon> = {
  com: MessageCircle, fin: Wallet, tea: Users, emo: Heart, lid: Crown, pen: Lightbulb,
  cre: Palette, inn: Rocket, dig: Laptop, emp: Sprout, tie: Clock, pro: Puzzle,
};

/** Welcome hero: reusable vector art with a luminous platform and a student avatar. */
export function WelcomePortal() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 620 410" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id={`halo${id}`}>
          <stop stopColor="#7C3BFF" stopOpacity=".85"/><stop offset=".55" stopColor="#3048EA" stopOpacity=".34"/>
          <stop offset="1" stopColor="#141A58" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`orbit${id}`}>
          <stop stopColor="#EC5BFF"/><stop offset=".55" stopColor="#8D6BFF"/><stop offset="1" stopColor="#5AF0FF"/>
        </linearGradient>
        <linearGradient id={`base${id}`} x2="0" y2="1">
          <stop stopColor="#C594FF"/><stop offset=".5" stopColor="#6443EC"/><stop offset="1" stopColor="#211661"/>
        </linearGradient>
        <radialGradient id={`deck${id}`}>
          <stop stopColor="#263B99"/><stop offset=".75" stopColor="#563BD2"/><stop offset="1" stopColor="#5CCBFF"/>
        </radialGradient>
      </defs>
      <ellipse cx="311" cy="215" rx="267" ry="198" fill={`url(#halo${id})`}/>
      <ellipse cx="308" cy="202" rx="247" ry="91" transform="rotate(-12 308 202)" fill="none" stroke={`url(#orbit${id})`} opacity=".58" strokeWidth="2"/>
      <path d="M67 218c-5 50 152 98 306 45 92-31 159-68 174-102" fill="none" stroke={`url(#orbit${id})`} opacity=".44" strokeWidth="1.5"/>
      {[[91,109,4],[126,58,2],[502,75,4],[532,178,3],[553,272,2],[80,294,3],[447,304,2],[286,44,2]].map(([x,y,r])=>(
        <circle key={x} cx={x} cy={y} r={r} fill={x>310?"#8BEFFF":"#E9A3FF"} opacity=".85"/>
      ))}
      <path d="M135 127l4 10 10 4-10 4-4 10-4-10-10-4 10-4zM484 148l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#FFE2A6"/>
      <ellipse cx="310" cy="352" rx="157" ry="29" fill="#060B29" opacity=".65"/>
      <path d="M167 325v22c0 23 64 39 143 39s143-16 143-39v-22" fill={`url(#base${id})`}/>
      <ellipse cx="310" cy="327" rx="143" ry="37" fill={`url(#deck${id})`} stroke="#A5EDFF" strokeWidth="3"/>
      <ellipse cx="310" cy="325" rx="114" ry="25" fill="none" stroke="#D8B8FF" opacity=".65" strokeWidth="2"/>
      <g transform="translate(176,55)">
        <CharSVG {...CAST.lucas} shirt="#7040E8" size={268} mood="happy" pose="hand" look="front"/>
      </g>
      <g transform="translate(59,178) rotate(-8)">
        <rect width="127" height="39" rx="19.5" fill="#3C2F87" stroke="#BD95FF" strokeWidth="2"/>
        <text x="63.5" y="25" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">12 mundos</text>
      </g>
      <g transform="translate(436,213) rotate(8)">
        <rect width="127" height="39" rx="19.5" fill="#165673" stroke="#73EFFF" strokeWidth="2"/>
        <text x="63.5" y="25" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700">48 misiones</text>
      </g>
      <g transform="translate(432,89) rotate(12)">
        <path d="M0 9l26-9 26 9v19c0 15-13 24-26 29C13 52 0 43 0 28z" fill="#6330A7" stroke="#FFDB88" strokeWidth="2.5"/>
        <path d="M26 12l5 10 11 2-8 8 1 11-9-5-9 5 1-11-8-8 11-2z" fill="#FFE5A4"/>
      </g>
    </svg>
  );
}

/** Round world emblem with soft volume. */
export function WorldEmblem({ worldId, from, to, size = 56, locked = false }: { worldId: string; from: string; to: string; size?: number; locked?: boolean }) {
  const I = locked ? Lock : (WORLD_ICON[worldId] ?? Star);
  return (
    <span className="relative inline-flex items-center justify-center rounded-full flex-shrink-0" aria-hidden="true"
      style={{ width: size, height: size, background: locked ? "linear-gradient(135deg,#3A4470,#252D52)" : `radial-gradient(circle at 35% 30%, ${shade(from, 0.35)}, ${from} 45%, ${to})`,
        boxShadow: `inset 0 -4px 8px rgba(0,0,0,.25), inset 0 3px 6px rgba(255,255,255,.25)` }}>
      <I size={size * 0.46} color={locked ? "#A6B3DA" : "#fff"} strokeWidth={2.2} aria-hidden />
    </span>
  );
}

const BADGE_ICON: Record<string, Icon> = { star: Star, flame: Flame, trophy: Trophy, bulb: Lightbulb, target: Target, zap: Zap };

/** Gold achievement medal. */
export function Medal({ icon = "star", size = 56, locked = false }: { icon?: string; size?: number; locked?: boolean }) {
  const id = useId().replace(/:/g, "");
  const I = BADGE_ICON[icon] ?? Star;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size * 1.15 }} aria-hidden="true">
      <svg viewBox="0 0 60 69" width={size} height={size * 1.15} className="absolute inset-0">
        <defs><linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={locked ? "#6B7398" : "#FDE58A"} /><stop offset="1" stopColor={locked ? "#3A4470" : "#C9861A"} /></linearGradient></defs>
        <path d="M16 40 L10 68 L22 61 L28 69 L30 44 Z" fill={locked ? "#4A5280" : "#8B72FF"} />
        <path d="M44 40 L50 68 L38 61 L32 69 L30 44 Z" fill={locked ? "#3A4470" : "#6A4CFF"} />
        <circle cx="30" cy="28" r="26" fill={`url(#m${id})`} />
        <circle cx="30" cy="28" r="19" fill={locked ? "#252D52" : "#7A4D10"} opacity=".35" />
        <path d="M12 20 Q20 6 36 5" stroke="#fff" strokeWidth="3" opacity=".45" fill="none" strokeLinecap="round" />
      </svg>
      <span className="relative" style={{ marginTop: -size * 0.15 }}><I size={size * 0.38} color={locked ? "#A6B3DA" : "#FFF8DB"} strokeWidth={2.4} aria-hidden /></span>
    </span>
  );
}

const ART_CAST: (keyof typeof CAST)[][] = [["daniela","lucas"],["sofia","mateo"],["vale","lucas"],["mateo","daniela"]];

/** Illustrated mission header: two characters in conversation, in the colours of the world. */
export function MissionArt({ worldId, from, index = 0, height = 150 }: { worldId: string; from: string; index?: number; height?: number }) {
  const I = WORLD_ICON[worldId] ?? Star;
  const [a, b] = ART_CAST[index % ART_CAST.length];
  return (
    <div className="relative w-full overflow-hidden" style={{ height, background: `radial-gradient(ellipse at 50% 36%, ${shade(from, 0.40)}, transparent 70%), linear-gradient(145deg, ${shade(from, -0.33)}, ${shade(from, -0.57)})` }} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0" style={{ height: height * 0.3, background: shade(from, -0.15), opacity: .55 }} />
      <div className="absolute rounded-full" style={{ width: height * 1.2, height: height * 1.2, right: -height * 0.4, top: -height * 0.5, background: "rgba(255,255,255,.18)" }} />
      <div className="absolute flex items-end gap-1" style={{ left: "50%", bottom: 0, transform: "translateX(-50%)" }}>
        <CharSVG {...CAST[a]} size={height * 0.92} look="right" mood="happy" pose={index % 2 ? "point" : "stand"} />
        <CharSVG {...CAST[b]} size={height * 0.86} look="left" mood={index % 3 === 1 ? "thinking" : "laugh"} />
      </div>
      <div className="absolute flex items-center justify-center rounded-2xl" style={{ left: "50%", top: height * 0.08, transform: "translateX(-50%)", width: height * 0.32, height: height * 0.26, background: "linear-gradient(145deg,#F0EAFF,#BFB4FF)", boxShadow: "0 4px 18px rgba(115,96,255,.5)" }}>
        <I size={height * 0.15} color={shade(from, -0.2)} strokeWidth={2.4} aria-hidden />
        <span className="absolute" style={{ bottom: -6, left: "30%", width: 12, height: 12, background: "#CFC5FF", transform: "rotate(45deg)" }} />
      </div>
    </div>
  );
}
