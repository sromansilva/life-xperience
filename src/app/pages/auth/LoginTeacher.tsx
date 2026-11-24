import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Shell, AuthWrap, InputField, PrimaryBtn } from "../../components/lx";
import { Portrait } from "../../art/characters";
import { P, g } from "../../theme";
import { useSession } from "../../providers/SessionProvider";
import { useAppNavigation } from "../../navigation";

export default function LoginTeacher() {
  const { setAuthStep } = useAppNavigation();
  const { login: sessionLogin } = useSession();

  const [lEmail, setLEmail] = useState("");
  const [lPw, setLPw] = useState("");
  const [lError, setLError] = useState("");
  const [lLoading, setLLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function loginT(emailOverride?: string, pwOverride?: string) {
    setLError("");
    setLLoading(true);
    const error = await sessionLogin(emailOverride ?? lEmail, pwOverride ?? lPw, "teacher");
    if (error) setLError(error);
    setLLoading(false);
  }

  return (
    <Shell>
      <AuthWrap title="Acceso Docente" sub="Panel de monitoreo y seguimiento" onBack={() => setAuthStep("role")}>
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3 border" style={{ background: "rgba(14,165,233,.08)", borderColor: "rgba(14,165,233,.25)" }}>
          <Portrait who="garcia" size={48} />
          <div>
            <p className="font-bold" style={{ color: P.text }}>Prof. Ana García</p>
            <p className="text-xs" style={{ color: P.c4 }}>Ciencias Sociales · Grupo 1°A · 1°B</p>
          </div>
        </div>
        <InputField
          label="Correo"
          type="email"
          value={lEmail}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLEmail(e.target.value)}
          placeholder="docente@demo.com"
        />
        <InputField
          label="Contraseña"
          type={showPw ? "text" : "password"}
          value={lPw}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLPw(e.target.value)}
          placeholder="Tu contraseña"
          error={lError}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && loginT()}
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
        <PrimaryBtn full size="lg" onClick={() => loginT()} variant="cyan" disabled={lLoading}>
          {lLoading ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 size={16} className="animate-spin" />Ingresando…
            </span>
          ) : (
            "Ingresar al panel →"
          )}
        </PrimaryBtn>
        <div className="mt-4 text-center">
          <button onClick={() => setAuthStep("reg-t")} className="text-sm font-bold hover:underline" style={{ color: P.c4 }}>
            Registrar cuenta docente
          </button>
        </div>
        {/* Demo docente */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: P.border }}>
          <p className="text-xs font-bold mb-1" style={{ color: P.muted }}>⚡ Acceso rápido demo</p>
          <p className="text-xs mb-2" style={{ color: P.muted }}>Cuentas locales del prototipo · contraseña demo1234</p>
          <button
            type="button"
            onClick={() => {
              setLEmail("docente@demo.com");
              setLPw("demo1234");
              loginT("docente@demo.com", "demo1234");
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all hover:scale-[1.01]"
            style={{ background: P.s2, borderColor: P.border }}
          >
            <Portrait who="garcia" size={36} />
            <div className="flex-1 text-left">
              <p className="text-xs font-bold" style={{ color: P.text }}>Prof. Ana García</p>
              <p className="text-xs" style={{ color: P.muted }}>docente@demo.com</p>
            </div>
            <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: g(P.c2, P.c1), color: "#fff" }}>
              Docente
            </div>
          </button>
        </div>
      </AuthWrap>
    </Shell>
  );
}
