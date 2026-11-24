import { useState, type ChangeEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Shell, BackArrow, InputField, PrimaryBtn } from "../../components/lx";
import { CharSVG } from "../../art/characters";
import { P, g } from "../../theme";
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES, SHIRT_COLORS, PETS, GRADES } from "../../data/catalog";
import { useSession } from "../../providers/SessionProvider";
import { useAppNavigation } from "../../navigation";

export default function RegisterStudent() {
  const { setAuthStep } = useAppNavigation();
  const { register } = useSession();

  const [lLoading, setLLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [rName, setRName] = useState("");
  const [rLast, setRLast] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPw, setRPw] = useState("");
  const [rPw2, setRPw2] = useState("");
  const [rGrade, setRGrade] = useState("3°A");
  const [rHair, setRHair] = useState(HAIR_COLORS[0]);
  const [rHairSt, setRHairSt] = useState("A");
  const [rSkin, setRSkin] = useState(SKIN_TONES[0]);
  const [rShirt, setRShirt] = useState(SHIRT_COLORS[0]);
  const [rPet, setRPet] = useState("🐶");
  const [rErrors, setRErrors] = useState<Record<string, string>>({});
  const [rStep, setRStep] = useState(1);

  function validateS1() {
    const e: Record<string, string> = {};
    if (!rName.trim()) e.name = "Nombre requerido";
    if (!rLast.trim()) e.last = "Apellido requerido";
    if (!rEmail.includes("@")) e.email = "Correo inválido";
    if (rPw.length < 6) e.pw = "Mínimo 6 caracteres";
    if (rPw !== rPw2) e.pw2 = "Las contraseñas no coinciden";
    setRErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitStudent() {
    setLLoading(true);
    const error = await register({
      email: rEmail.trim(),
      role: "student",
      name: rName,
      last: rLast,
      grade: rGrade,
      hair_color: rHair,
      hair_style: rHairSt,
      skin_tone: rSkin,
      shirt_color: rShirt,
      pet: rPet,
      level: 1,
      xp: 0,
      coins: 50,
      streak: 0,
      subject: null,
      group_name: null,
    }, rPw);
    if (error) setRErrors({ email: error });
    setLLoading(false);
  }

  return (
    <Shell>
      <div className="min-h-screen flex">
        {/* Left - Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10" style={{ background: P.bg }}>
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <BackArrow onClick={() => rStep > 1 ? setRStep(p => p - 1) : setAuthStep("reg-role")} />
              <div>
                <h2 className="text-xl font-black" style={{ color: P.text }}>Crea tu cuenta</h2>
                <p className="text-xs" style={{ color: P.muted }}>Paso {rStep} de 3 — {rStep === 1 ? "Datos personales" : rStep === 2 ? "Personaliza tu avatar" : "Confirma y listo"}</p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map(s => <div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: s <= rStep ? g(P.v2, P.v3) : "rgba(255,255,255,0.1)" }} />)}
            </div>

            {rStep === 1 && (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Nombre *" value={rName} onChange={(e: ChangeEvent<HTMLInputElement>) => setRName(e.target.value)} placeholder="Ana" error={rErrors.name} />
                  <InputField label="Apellido *" value={rLast} onChange={(e: ChangeEvent<HTMLInputElement>) => setRLast(e.target.value)} placeholder="García" error={rErrors.last} />
                </div>
                <InputField label="Correo electrónico *" type="email" value={rEmail} onChange={(e: ChangeEvent<HTMLInputElement>) => setREmail(e.target.value)} placeholder="tu@correo.com" error={rErrors.email} />
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>Grado</label>
                  <select value={rGrade} onChange={e => setRGrade(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none" style={{ background: P.s2, borderColor: P.border, color: P.text }}>
                    {GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <InputField
                  label="Contraseña *"
                  type={showPw ? "text" : "password"}
                  value={rPw}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRPw(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  error={rErrors.pw}
                  hint="Al menos 6 caracteres"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPw}
                      className="w-9 h-9 flex items-center justify-center rounded-lg"
                      style={{ color: P.muted }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <InputField label="Confirmar contraseña *" type="password" value={rPw2} onChange={(e: ChangeEvent<HTMLInputElement>) => setRPw2(e.target.value)} placeholder="Repite la contraseña" error={rErrors.pw2} />
                <PrimaryBtn full size="lg" onClick={() => { if (validateS1()) setRStep(2); }} variant="violet">Continuar →</PrimaryBtn>
              </div>
            )}

            {rStep === 2 && (
              <div>
                <p className="text-xs font-bold mb-3" style={{ color: P.muted }}>Tono de piel</p>
                <div className="flex gap-2 mb-4">
                  {SKIN_TONES.map(s => <button key={s} type="button" onClick={() => setRSkin(s)} className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110" style={{ background: s, borderColor: rSkin === s ? P.v4 : "transparent" }} />)}
                </div>
                <p className="text-xs font-bold mb-3" style={{ color: P.muted }}>Color de cabello</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {HAIR_COLORS.map(h => <button key={h} type="button" onClick={() => setRHair(h)} className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110" style={{ background: h === "#F5F5F5" ? "#d0d0d0" : h, borderColor: rHair === h ? P.v4 : "transparent" }} />)}
                </div>
                <p className="text-xs font-bold mb-3" style={{ color: P.muted }}>Estilo de cabello</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {HAIR_STYLES.map(s => (
                    <button key={s} type="button" onClick={() => setRHairSt(s)} className="rounded-xl p-2 border transition-all hover:scale-105" style={{ background: rHairSt === s ? g(P.v2, P.v3) : P.s2, borderColor: rHairSt === s ? P.v3 : P.border }}>
                      <CharSVG hair={rHair} hairStyle={s} skin={rSkin} shirt={rShirt} mood="happy" size={55} />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold mb-3" style={{ color: P.muted }}>Color de ropa</p>
                <div className="flex gap-2 flex-wrap mb-5">
                  {SHIRT_COLORS.map(c => <button key={c} type="button" onClick={() => setRShirt(c)} className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110" style={{ background: c, borderColor: rShirt === c ? P.text : "transparent" }} />)}
                </div>
                <div className="flex gap-3">
                  <PrimaryBtn onClick={() => setRStep(1)} variant="ghost">← Atrás</PrimaryBtn>
                  <PrimaryBtn full onClick={() => setRStep(3)} variant="violet">Continuar →</PrimaryBtn>
                </div>
              </div>
            )}

            {rStep === 3 && (
              <div>
                <p className="text-xs font-bold mb-3" style={{ color: P.muted }}>Elige tu mascota</p>
                <div className="grid grid-cols-6 gap-2 mb-5">
                  {PETS.map(p => (
                    <button key={p} type="button" onClick={() => setRPet(p)} className="h-12 rounded-xl flex items-center justify-center text-xl border transition-all hover:scale-110" style={{ background: rPet === p ? g(P.g2, P.g1) : P.s2, borderColor: rPet === p ? P.g3 : P.border }}>
                      {p === "⛔" ? <span className="text-xs" style={{ color: P.muted }}>Sin</span> : p}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl p-5 border mb-5" style={{ background: P.s2, borderColor: P.border }}>
                  {[{ label: "Nombre", val: `${rName} ${rLast}` }, { label: "Correo", val: rEmail }, { label: "Grado", val: rGrade }].map(r => (
                    <div key={r.label} className="flex justify-between text-sm py-2 border-b last:border-0" style={{ borderColor: P.border }}>
                      <span style={{ color: P.muted }}>{r.label}</span>
                      <span style={{ color: P.text }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <PrimaryBtn onClick={() => setRStep(2)} variant="ghost">← Atrás</PrimaryBtn>
                  <PrimaryBtn full onClick={submitStudent} variant="violet" disabled={lLoading}>
                    {lLoading ? <span className="flex items-center gap-2 justify-center"><Loader2 size={16} className="animate-spin" />Creando cuenta…</span> : "✅ Crear mi cuenta"}
                  </PrimaryBtn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Avatar preview */}
        <div className="hidden lg:flex w-80 flex-col items-center justify-center border-l" style={{ background: "linear-gradient(145deg,#0A1420,#0D1F38)", borderColor: P.border }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: P.muted }}>Tu personaje</p>
          <div className="relative mb-6">
            <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle,rgba(109,40,217,0.2) 0%,transparent 70%)" }}>
              <CharSVG hair={rHair} hairStyle={rHairSt} skin={rSkin} shirt={rShirt} mood="happy" size={160} />
            </div>
            {rPet && rPet !== "⛔" && <div className="absolute bottom-2 right-2 text-3xl">{rPet}</div>}
          </div>
          {rName && <p className="font-black text-lg" style={{ color: P.text }}>{rName} {rLast}</p>}
          <p className="text-sm" style={{ color: P.muted }}>{rGrade} · Nivel 1</p>
          {/* XP preview */}
          <div className="mt-6 w-48">
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full w-0" style={{ background: g(P.v2, P.v4, "90deg") }} />
            </div>
            <p className="text-xs text-center mt-1.5" style={{ color: P.muted }}>0 / 500 XP · Nivel 1</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
