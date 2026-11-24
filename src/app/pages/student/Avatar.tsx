import { useState } from "react";
import { Check } from "lucide-react";
import { P, g } from "../../theme";
import { CharSVG } from "../../art/characters";
import { getLevelInfo } from "../../lib/progress";
import { avatarSelectedBadge } from "../../components/lx";
import { SKIN_TONES, HAIR_COLORS, HAIR_STYLES, SHIRT_COLORS, PETS } from "../../data/catalog";
import { useSession } from "../../providers/SessionProvider";

export interface AvatarProps {}

export default function Avatar(_props: AvatarProps = {}) {
  const { su, isPractice, updateActiveProfile } = useSession();
  const [avTab, setAvTab] = useState<"char" | "pet">("char");

  if (!su) return null;

  const me = su;
  const meLevel = getLevelInfo(me.xp);
  const avatar = { hair: me.hairColor, hairStyle: me.hairStyle, skin: me.skinTone, shirt: me.shirtColor };

  const swatch = (selected: boolean) =>
    selected ? <Check size={18} className="text-white" style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,.9))" }} aria-hidden="true" /> : null;

  return (
    <div>
      <h1 className="text-2xl font-black mb-1" style={{ color: P.text }}>Mi avatar</h1>
      <p className="mb-6" style={{ color: P.muted }}>Personaliza tu personaje</p>
      {isPractice && (
        <p className="text-sm rounded-xl px-4 py-3 mb-6 border" style={{ color: "#D3E9F8", borderColor: "rgba(56,189,248,.45)", background: "rgba(14,165,233,.08)" }}>
          Vista de práctica: los cambios de avatar solo se aplican a la cuenta de práctica y se descartan al volver al panel docente.
        </p>
      )}
      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="rounded-2xl p-6 border text-center mb-4" style={{ background: P.s1, borderColor: P.border }}>
            <div className="relative w-32 h-40 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle,rgba(109,40,217,.2) 0%,transparent 70%)" }} />
              <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={140} />
              {me.pet && me.pet !== "⛔" && <div className="absolute bottom-0 right-0 text-2xl" aria-hidden="true">{me.pet}</div>}
            </div>
            <p className="font-bold" style={{ color: P.text }}>{me.name} {me.last}</p>
            <p className="text-xs mt-0.5" style={{ color: P.muted }}>Nivel {meLevel.level} · {me.xp.toLocaleString()} XP</p>
          </div>
        </div>

        <div className="col-span-2 space-y-5">
          <div className="flex gap-2" role="group" aria-label="Qué personalizar">
            {(["char", "pet"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={avTab === t} onClick={() => setAvTab(t)} className="min-h-11 px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={avTab === t ? { background: g(P.v2, P.v3), color: "#fff" } : { background: P.s1, color: P.text, border: `1px solid ${P.border}` }}>
                {t === "char" ? "🧍 Personaje" : "🐾 Mascota"}
              </button>
            ))}
          </div>

          {avTab === "char" && (
            <>
              <fieldset>
                <legend className="text-xs font-bold mb-2" style={{ color: P.muted }}>Tono de piel</legend>
                <div className="flex gap-2">
                  {SKIN_TONES.map((s, i) => (
                    <button key={s} type="button" aria-label={`Tono de piel ${i + 1}`} aria-pressed={avatar.skin === s} onClick={() => updateActiveProfile({ skinTone: s })} className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background: s, borderColor: avatar.skin === s ? "#fff" : "transparent" }}>
                      {swatch(avatar.skin === s)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-xs font-bold mb-2" style={{ color: P.muted }}>Color de cabello</legend>
                <div className="flex gap-2 flex-wrap">
                  {HAIR_COLORS.map((h, i) => (
                    <button key={h} type="button" aria-label={`Color de cabello ${i + 1}`} aria-pressed={avatar.hair === h} onClick={() => updateActiveProfile({ hairColor: h })} className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background: h === "#F5F5F5" ? "#c8c8c8" : h, borderColor: avatar.hair === h ? "#fff" : "transparent" }}>
                      {swatch(avatar.hair === h)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-xs font-bold mb-2" style={{ color: P.muted }}>Estilo de cabello</legend>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_STYLES.map((s, i) => (
                    <button key={s} type="button" aria-label={`Estilo de cabello ${i + 1}`} aria-pressed={avatar.hairStyle === s} onClick={() => updateActiveProfile({ hairStyle: s })} className="relative rounded-xl p-2 border transition-all hover:scale-105 flex justify-center" style={{ background: avatar.hairStyle === s ? g(P.v2, P.v3) : P.s2, borderColor: avatar.hairStyle === s ? "#fff" : P.border }}>
                      <CharSVG hair={avatar.hair} hairStyle={s} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={55} />
                      {avatarSelectedBadge(avatar.hairStyle === s)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-xs font-bold mb-2" style={{ color: P.muted }}>Color de ropa</legend>
                <div className="flex gap-2 flex-wrap">
                  {SHIRT_COLORS.map((c, i) => (
                    <button key={c} type="button" aria-label={`Color de ropa ${i + 1}`} aria-pressed={avatar.shirt === c} onClick={() => updateActiveProfile({ shirtColor: c })} className="w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background: c, borderColor: avatar.shirt === c ? "#fff" : "transparent" }}>
                      {swatch(avatar.shirt === c)}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {avTab === "pet" && (
            <div className="grid grid-cols-6 gap-3" role="group" aria-label="Mascota">
              {PETS.map((p) => (
                <button key={p} type="button" aria-label={p === "⛔" ? "Sin mascota" : `Mascota ${p}`} aria-pressed={me.pet === p} onClick={() => updateActiveProfile({ pet: p })} className="relative h-14 rounded-xl flex items-center justify-center text-2xl border transition-all hover:scale-110" style={{ background: me.pet === p ? g(P.v2, P.v1) : P.s2, borderColor: me.pet === p ? "#fff" : P.border }}>
                  {p === "⛔" ? <span className="text-xs" style={{ color: P.text }}>Sin</span> : p}
                  {avatarSelectedBadge(me.pet === p)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
