import { Shell, AuthWrap } from "../../components/lx";
import { CharSVG, TeacherFigure } from "../../art/characters";
import { P } from "../../theme";
import { useAppNavigation } from "../../navigation";

export default function RoleSelect() {
  const { setAuthStep } = useAppNavigation();

  return (
    <Shell>
      <AuthWrap title="¿Cómo quieres entrar?" sub="Elige tu rol para continuar" onBack={() => setAuthStep("splash")} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Soy Estudiante",
              desc: "Misiones, simulaciones y tu progreso",
              action: () => setAuthStep("login-s"),
              accent: P.v3,
              art: <CharSVG hair="#2C1810" hairStyle="A" skin="#EDB98A" shirt="#6A4CFF" mood="happy" size={120} />,
            },
            {
              title: "Soy Docente",
              desc: "Seguimiento del grupo y casos didácticos",
              action: () => setAuthStep("login-t"),
              accent: P.c3,
              art: <TeacherFigure size={120} look="front" />,
            },
          ].map(r => (
            <button key={r.title} type="button" onClick={r.action} className="lx-choice rounded-2xl p-5 flex flex-col items-center text-center border transition-all" style={{ background: P.s2, borderColor: P.border }}>
              <span className="w-32 h-32 rounded-full flex items-end justify-center overflow-hidden mb-3" style={{ background: `radial-gradient(circle at 50% 35%, ${r.accent}55, ${P.s3})` }}>{r.art}</span>
              <span className="font-bold text-lg" style={{ color: P.text }}>{r.title}</span>
              <span className="text-sm mt-1" style={{ color: P.muted }}>{r.desc}</span>
            </button>
          ))}
        </div>
      </AuthWrap>
    </Shell>
  );
}
