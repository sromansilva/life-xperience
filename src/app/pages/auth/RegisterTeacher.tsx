import { useState, type ChangeEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Shell, AuthWrap, InputField, PrimaryBtn } from "../../components/lx";
import { P } from "../../theme";
import { useSession } from "../../providers/SessionProvider";
import { useAppNavigation } from "../../navigation";

export default function RegisterTeacher() {
  const { setAuthStep } = useAppNavigation();
  const { register } = useSession();

  const [lLoading, setLLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [rName, setRName] = useState("");
  const [rLast, setRLast] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPw, setRPw] = useState("");
  const [rSubj, setRSubj] = useState("");
  const [rGrp, setRGrp] = useState("3°A · 3°B");
  const [rErrors, setRErrors] = useState<Record<string, string>>({});

  function validateT() {
    const e: Record<string, string> = {};
    if (!rName.trim()) e.name = "Nombre requerido";
    if (!rSubj.trim()) e.subj = "Materia requerida";
    if (!rEmail.includes("@")) e.email = "Correo inválido";
    if (rPw.length < 6) e.pw = "Mínimo 6 caracteres";
    setRErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitTeacher() {
    setLLoading(true);
    const error = await register({
      email: rEmail.trim(),
      role: "teacher",
      name: rName,
      last: rLast,
      grade: "",
      hair_color: "#1A1A2E",
      hair_style: "B",
      skin_tone: "#D08B5B",
      shirt_color: "#0E7490",
      pet: "🦉",
      level: 1,
      xp: 0,
      coins: 0,
      streak: 0,
      subject: rSubj,
      group_name: rGrp,
    }, rPw);
    if (error) setRErrors({ email: error });
    setLLoading(false);
  }

  return (
    <Shell>
      <AuthWrap title="Registro Docente" sub="Crea tu cuenta para gestionar tu grupo" onBack={() => setAuthStep("reg-role")}>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Nombre *" value={rName} onChange={(e: ChangeEvent<HTMLInputElement>) => setRName(e.target.value)} placeholder="Ana" error={rErrors.name} />
          <InputField label="Apellido" value={rLast} onChange={(e: ChangeEvent<HTMLInputElement>) => setRLast(e.target.value)} placeholder="García" />
        </div>
        <InputField label="Correo *" type="email" value={rEmail} onChange={(e: ChangeEvent<HTMLInputElement>) => setREmail(e.target.value)} placeholder="docente@colegio.edu" error={rErrors.email} />
        <InputField label="Materia *" value={rSubj} onChange={(e: ChangeEvent<HTMLInputElement>) => setRSubj(e.target.value)} placeholder="Ciencias Sociales, Matemáticas…" error={rErrors.subj} />
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: P.muted }}>Grupo(s)</label>
          <select value={rGrp} onChange={e => setRGrp(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none" style={{ background: P.s2, borderColor: P.border, color: P.text }}>
            {["3°A", "3°B", "3°A · 3°B", "2°A · 2°B", "Todo el grado"].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <InputField
          label="Contraseña *"
          type={showPw ? "text" : "password"}
          value={rPw}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRPw(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          error={rErrors.pw}
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
        <PrimaryBtn full size="lg" onClick={() => { if (validateT()) submitTeacher(); }} variant="cyan" disabled={lLoading}>
          {lLoading ? <span className="flex items-center gap-2 justify-center"><Loader2 size={16} className="animate-spin" />Creando cuenta…</span> : "✅ Crear cuenta docente"}
        </PrimaryBtn>
      </AuthWrap>
    </Shell>
  );
}
