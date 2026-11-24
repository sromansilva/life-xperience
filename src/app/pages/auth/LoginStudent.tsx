import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Shell, AuthWrap, InputField, PrimaryBtn } from "../../components/lx";
import { CharSVG } from "../../art/characters";
import { P, g } from "../../theme";
import { SEED_USERS } from "../../data/demo";
import { getLevelInfo } from "../../lib/progress";
import { useSession } from "../../providers/SessionProvider";
import { useAppNavigation } from "../../navigation";

export default function LoginStudent() {
  const { setAuthStep } = useAppNavigation();
  const { login: sessionLogin, demoProfiles } = useSession();

  const [lEmail, setLEmail] = useState("");
  const [lPw, setLPw] = useState("");
  const [lError, setLError] = useState("");
  const [lLoading, setLLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function loginS(emailOverride?: string, pwOverride?: string) {
    setLError("");
    setLLoading(true);
    const error = await sessionLogin(emailOverride ?? lEmail, pwOverride ?? lPw, "student");
    if (error) setLError(error);
    setLLoading(false);
  }

  return (
    <Shell>
      <AuthWrap title="Bienvenido de nuevo" sub="Ingresa con tu correo y contraseña" onBack={() => setAuthStep("role")}>
        <InputField
          label="Correo electrónico"
          type="email"
          value={lEmail}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        <InputField
          label="Contraseña"
          type={showPw ? "text" : "password"}
          value={lPw}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLPw(e.target.value)}
          placeholder="Tu contraseña"
          error={lError}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && loginS()}
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
        <PrimaryBtn full size="lg" onClick={() => loginS()} variant="violet" disabled={lLoading}>
          {lLoading ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 size={16} className="animate-spin" />Ingresando…
            </span>
          ) : (
            "Ingresar →"
          )}
        </PrimaryBtn>
        <div className="mt-4 text-center">
          <span className="text-sm" style={{ color: P.muted }}>¿No tienes cuenta? </span>
          <button onClick={() => setAuthStep("reg-s")} className="text-sm font-bold hover:underline" style={{ color: P.v4 }}>
            Regístrate gratis
          </button>
        </div>
        {/* Demo accounts */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: P.border }}>
          <p className="text-xs font-bold mb-1" style={{ color: P.muted }}>⚡ Acceso rápido demo</p>
          <p className="text-xs mb-2" style={{ color: P.muted }}>Cuentas locales del prototipo · contraseña demo1234</p>
          <div className="space-y-2">
            {SEED_USERS.filter(u => u.role === "student").slice(0, 3).map(demo => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  setLEmail(demo.email);
                  setLPw("demo1234");
                  loginS(demo.email, "demo1234");
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 border text-left transition-all hover:scale-[1.01]"
                style={{ background: P.s2, borderColor: P.border }}
              >
                <CharSVG hair={demo.hairColor} hairStyle={demo.hairStyle} skin={demo.skinTone} shirt={demo.shirtColor} mood="happy" size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: P.text }}>{demo.name} {demo.last}</p>
                  <p className="text-xs truncate" style={{ color: P.muted }}>{demo.email}</p>
                </div>
                <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: g(P.v2, P.v1), color: "#fff" }}>
                  Nivel {getLevelInfo(demoProfiles[demo.id]?.xp ?? demo.xp).level}
                </div>
              </button>
            ))}
          </div>
        </div>
      </AuthWrap>
    </Shell>
  );
}
