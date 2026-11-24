import { ChevronRight } from "lucide-react";
import { Shell, AuthWrap } from "../../components/lx";
import { P, g } from "../../theme";
import { useAppNavigation } from "../../navigation";

export default function RegisterRole() {
  const { setAuthStep } = useAppNavigation();

  return (
    <Shell>
      <AuthWrap title="Crear cuenta" sub="¿Cómo participarás en LifeXperience?" onBack={() => setAuthStep("splash")}>
        <div className="space-y-4">
          {[
            { icon: "🎒", title: "Cuenta Estudiante", desc: "Accede a misiones y simulaciones de habilidades para la vida", action: () => setAuthStep("reg-s"), col: P.v3 },
            { icon: "👩‍🏫", title: "Cuenta Docente",   desc: "Gestiona grupos y monitorea el progreso de tus estudiantes",  action: () => setAuthStep("reg-t"), col: P.c3 },
          ].map(r => (
            <button
              key={r.title}
              type="button"
              onClick={r.action}
              className="w-full rounded-2xl p-5 flex items-center gap-4 border transition-all hover:scale-[1.01] text-left"
              style={{ background: P.s1, borderColor: P.border }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = r.col; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.border; }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: r.col === P.v3 ? g(P.v2, P.v1) : g(P.c2, P.c1) }}>
                {r.icon}
              </div>
              <div>
                <p className="font-bold" style={{ color: P.text }}>{r.title}</p>
                <p className="text-sm mt-0.5" style={{ color: P.muted }}>{r.desc}</p>
              </div>
              <ChevronRight size={20} className="ml-auto" style={{ color: P.muted }} />
            </button>
          ))}
        </div>
        <div className="mt-5 text-center">
          <span className="text-sm" style={{ color: P.muted }}>¿Ya tienes cuenta? </span>
          <button onClick={() => setAuthStep("role")} className="text-sm font-bold hover:underline" style={{ color: P.v4 }}>
            Iniciar sesión
          </button>
        </div>
      </AuthWrap>
    </Shell>
  );
}
