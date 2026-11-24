// LifeXperience visual identity: night blue base, violet for primary actions,
// cyan for orientation (where am I / what's next), gold for achievements.
export const P = {
  bg:      "#0A1230",   // azul noche
  s1:      "#111C42",   // surface 1 - cards
  s2:      "#17244F",   // surface 2 - elevated
  s3:      "#1F2E61",   // surface 3 - hover
  border:  "rgba(150,170,235,0.18)",
  bHover:  "rgba(139,114,255,0.55)",
  text:    "#F3F6FF",
  muted:   "#A6B3DA",   // ≥ 7:1 on s1/s2
  // Violet — primary actions
  v1: "#4B2BC9", v2: "#6A4CFF", v3: "#8B72FF", v4: "#BBAAFF",
  // Cyan — orientation
  c1: "#0E6F8A", c2: "#0891B2", c3: "#22D3EE", c4: "#7DE8F8",
  // Green — success
  g1: "#047857", g2: "#059669", g3: "#10B981", g4: "#4ADE9B",
  // Gold — achievements
  a1: "#A86A12", a2: "#D9981F", a3: "#F5C542", a4: "#FDE58A",
  // Red — consequences / alerts
  r1: "#991B1B", r2: "#DC2626", r3: "#EF4444", r4: "#FCA5A5",
  // Pink — dialogue accents
  p1: "#9D174D", p2: "#BE185D", p3: "#EC4899", p4: "#F9A8D4",
};

export const g = (a: string, b: string, deg = "135deg") => `linear-gradient(${deg},${a},${b})`;

/** Soft elevation used across the app. Strong glows are reserved for welcome and rewards. */
export const SHADOW = {
  card:   "0 8px 24px rgba(3,8,30,.35)",
  action: "0 6px 16px rgba(74,43,201,.35)",
  reward: "0 0 48px rgba(245,197,66,.45)",
  hero:   "0 0 80px rgba(139,114,255,.55)",
};

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  const r = f((n >> 16) & 255), gg = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1)}`;
}
