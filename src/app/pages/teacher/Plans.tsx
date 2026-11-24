import { P, g } from "../../theme";
import { CharSVG } from "../../art/characters";
import { CaseCard } from "../../components/lx";
import { TEACHER_DATA, SEED_USERS } from "../../data/demo";
import { useSession } from "../../providers/SessionProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";
import { useTeacher } from "./shared";

export interface PlansProps {
  /**
   * Callback opcional cuando el docente pulsa el botón "Ir al Asistente IA" en estado vacío.
   */
  onNavigateToAi?: () => void;
}

export function Plans({ onNavigateToAi }: PlansProps) {
  const { currentUser } = useSession();
  const { studentPlans, setStudentPlans } = useProgress();
  const { setTeacherTab } = useAppNavigation();
  const { totalPlans } = useTeacher();

  const u = currentUser;

  function handleGoToAi() {
    if (onNavigateToAi) {
      onNavigateToAi();
    } else {
      setTeacherTab("ai");
    }
  }

  return (
    <>
      <h1 className="text-2xl font-black mb-0.5" style={{ color: P.text }}>
        Planes Asignados
      </h1>
      <p className="text-sm mb-6" style={{ color: P.muted }}>
        {totalPlans} caso{totalPlans !== 1 ? "s" : ""} generado{totalPlans !== 1 ? "s" : ""} con IA · Grupo {u?.group}
      </p>

      {totalPlans === 0 ? (
        <div
          className="rounded-2xl p-12 border text-center"
          style={{ background: P.s1, borderColor: P.border }}
        >
          <div className="text-6xl mb-4">📋</div>
          <p className="font-bold text-lg mb-2" style={{ color: P.text }}>
            Sin planes asignados aún
          </p>
          <p className="text-sm mb-5" style={{ color: P.muted }}>
            Usa el Asistente IA para generar casos didácticos y asignarlos.
          </p>
          <button
            onClick={handleGoToAi}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: g(P.v2, P.c2) }}
          >
            🤖 Ir al Asistente IA
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {(studentPlans["all"] ?? []).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">👥</span>
                <h3 className="font-bold" style={{ color: P.text }}>
                  Todo el grupo
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(14,165,233,.15)", color: P.c4 }}
                >
                  {studentPlans["all"].length} casos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {studentPlans["all"].map((c) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    onRemove={() =>
                      setStudentPlans((prev) => ({
                        ...prev,
                        all: (prev.all ?? []).filter((x) => x.id !== c.id),
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {TEACHER_DATA.map((s, i) => {
            const key = s.name.split(" ")[0].toLowerCase();
            const plans = studentPlans[key] ?? [];
            if (!plans.length) return null;
            return (
              <div key={i}>
                <div className="flex items-center gap-3 mb-3">
                  <CharSVG
                    hair={SEED_USERS[i]?.hairColor || "#2C1810"}
                    hairStyle={SEED_USERS[i]?.hairStyle || "A"}
                    skin={SEED_USERS[i]?.skinTone || "#FDBCB4"}
                    shirt={SEED_USERS[i]?.shirtColor || P.v2}
                    mood="happy"
                    size={40}
                  />
                  <h3 className="font-bold" style={{ color: P.text }}>
                    {s.name}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(139,92,246,.15)", color: P.v4 }}
                  >
                    {plans.length} caso{plans.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {plans.map((c) => (
                    <CaseCard
                      key={c.id}
                      c={c}
                      onRemove={() =>
                        setStudentPlans((prev) => ({
                          ...prev,
                          [key]: (prev[key] ?? []).filter((x) => x.id !== c.id),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Plans;
