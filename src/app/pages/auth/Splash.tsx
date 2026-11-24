import { Play, ChevronRight, Sparkles } from "lucide-react";
import { Shell, LXLogo } from "../../components/lx";
import { WelcomePortal } from "../../art/illustrations";
import { OrionFigure } from "../../art/characters";
import { P } from "../../theme";
import { useAppNavigation } from "../../navigation";

export default function Splash() {
  const { setAuthStep } = useAppNavigation();

  return (
    <Shell>
      <div className="lx-welcome min-h-screen relative flex flex-col overflow-hidden">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-9">
          <LXLogo size={44} />
          <main className="flex flex-1 items-center py-5 sm:py-8 lg:py-0">
            <div className="grid w-full lg:grid-cols-[1.12fr_.88fr] gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 text-center">
                <div className="mx-auto max-w-[510px] aspect-[620/410]"><WelcomePortal /></div>
                <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: P.c4 }}>Simulaciones para la vida</p>
                <h1 className="mt-2 text-3xl sm:text-5xl font-black leading-tight" style={{ color: P.text }}>
                  Practica la vida<br /><span className="lx-welcome-accent">antes de vivirla.</span>
                </h1>
                <p className="max-w-md mx-auto mt-3 text-sm sm:text-base leading-relaxed" style={{ color: "#D3DBF5" }}>
                  Vive historias, toma decisiones y practica habilidades para el colegio y para tu vida.
                </p>
              </div>
              <section aria-labelledby="lx-welcome-title" className="lx-welcome-panel order-1 lg:order-2 p-5 sm:p-8 rounded-3xl">
                <h2 id="lx-welcome-title" className="text-3xl sm:text-4xl font-black" style={{ color: P.text }}>¡Bienvenido!</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#D3DBF5" }}>Inicia sesión o crea tu cuenta para comenzar.</p>
                <div className="grid gap-3 mt-6">
                  <button type="button" onClick={() => setAuthStep("role")} className="lx-neon-action min-h-14 px-5 py-3 rounded-full font-bold text-white text-base flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3"><Play size={18} aria-hidden="true" />Iniciar sesión</span><ChevronRight size={20} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setAuthStep("reg-role")} className="min-h-14 px-5 py-3 rounded-full font-bold text-base border flex items-center justify-between gap-3"
                    style={{ color: P.text, borderColor: "#9F92F0", background: "rgba(113,105,230,.13)" }}>
                    <span className="flex items-center gap-3"><Sparkles size={18} aria-hidden="true" />Crear cuenta</span><ChevronRight size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl p-3 border" style={{ background: "rgba(102,102,205,.14)", borderColor: "rgba(161,169,255,.35)" }}>
                  <span className="w-14 h-14 rounded-2xl overflow-hidden flex items-end justify-center shrink-0" style={{ background: "linear-gradient(160deg,#2E2A7A,#17205A)" }}><OrionFigure variant="bust" size={56} /></span>
                  <div className="text-sm leading-relaxed" style={{ color: "#E3E8FA" }}>
                    <p className="font-bold" style={{ color: P.v4 }}>Orion, tu mentor</p>
                    <p>Cuando tengas dudas en una misión, puedes pedirme una pista.</p>
                  </div>
                </div>
                <p className="mt-4 text-xs" style={{ color: P.muted }}>Hay cuentas demo para estudiantes y docentes.</p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </Shell>
  );
}
