import { P, g } from "../../theme";
import { CharSVG } from "../../art/characters";
import { DiffBadge } from "../../components/lx";
import { TEACHER_DATA, SEED_USERS } from "../../data/demo";
import { WORLDS } from "../../data/worlds";
import { CASE_BANK, generateAICase } from "../../data/cases";
import { getLevelInfo } from "../../lib/progress";
import { useSession } from "../../providers/SessionProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useAppNavigation } from "../../navigation";
import { useTeacher } from "./shared";

export interface AiCasesProps {
  /**
   * Callback opcional cuando el docente pulsa "Ver planes" o tras agregar un caso al plan.
   */
  onNavigateToPlans?: () => void;
}

export function AiCases({ onNavigateToPlans }: AiCasesProps) {
  const { currentUser, demoProfiles } = useSession();
  const { setStudentPlans } = useProgress();
  const { setTeacherTab } = useAppNavigation();

  const {
    caseWorldId,
    setCaseWorldId,
    caseDiff,
    setCaseDiff,
    caseTarget,
    setCaseTarget,
    caseContext,
    setCaseContext,
    generatedCase,
    setGeneratedCase,
    caseGenerating,
    setCaseGenerating,
    totalPlans,
  } = useTeacher();

  const u = currentUser;

  function handleGoToPlans() {
    if (onNavigateToPlans) {
      onNavigateToPlans();
    } else {
      setTeacherTab("plans");
    }
  }

  function handleGenerateCase(delayMs = 1800) {
    if (caseGenerating) return;
    setCaseGenerating(true);
    setGeneratedCase(null);
    setTimeout(() => {
      setGeneratedCase(generateAICase(caseWorldId, caseDiff, caseTarget, caseContext));
      setCaseGenerating(false);
    }, delayMs);
  }

  function handleAddToPlan() {
    if (!generatedCase) return;
    const key = generatedCase.targetId === "all" ? "all" : generatedCase.targetId;
    setStudentPlans((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), generatedCase],
    }));
    setGeneratedCase(null);
    setCaseContext("");
    setTimeout(() => {
      handleGoToPlans();
    }, 300);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: P.text }}>
            🤖 Asistente IA · Generador de Casos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: P.muted }}>
            Crea casos didácticos personalizados para tus estudiantes en segundos
          </p>
        </div>
        {totalPlans > 0 && (
          <button
            onClick={handleGoToPlans}
            className="text-sm font-bold px-4 py-2 rounded-xl border"
            style={{
              borderColor: P.v3,
              color: P.v4,
              background: "rgba(139,92,246,.08)",
            }}
          >
            📋 Ver planes ({totalPlans})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Target */}
          <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: P.muted }}>
              ¿Para quién es el caso?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCaseTarget("all")}
                className="rounded-xl p-3 text-left border transition-all"
                style={
                  caseTarget === "all"
                    ? { background: "rgba(14,165,233,.15)", borderColor: P.c3 }
                    : { background: P.s2, borderColor: P.border }
                }
              >
                <p className="text-lg mb-0.5">👥</p>
                <p className="text-xs font-bold" style={{ color: caseTarget === "all" ? P.text : P.muted }}>
                  Todo el grupo
                </p>
                <p className="text-xs" style={{ color: P.muted }}>
                  {u?.group}
                </p>
              </button>
              {TEACHER_DATA.map((s, i) => {
                const key = s.name.split(" ")[0].toLowerCase();
                return (
                  <button
                    key={i}
                    onClick={() => setCaseTarget(key)}
                    className="rounded-xl p-2.5 flex items-center gap-2 border transition-all"
                    style={
                      caseTarget === key
                        ? { background: "rgba(139,92,246,.15)", borderColor: P.v3 }
                        : { background: P.s2, borderColor: P.border }
                    }
                  >
                    <CharSVG
                      hair={SEED_USERS[i]?.hairColor || "#2C1810"}
                      hairStyle={SEED_USERS[i]?.hairStyle || "A"}
                      skin={SEED_USERS[i]?.skinTone || "#FDBCB4"}
                      shirt={SEED_USERS[i]?.shirtColor || P.v2}
                      mood="happy"
                      size={38}
                    />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: P.text }}>
                        {s.name.split(" ")[0]}
                      </p>
                      <p className="text-xs" style={{ color: P.muted }}>
                        Nivel {getLevelInfo(demoProfiles[SEED_USERS[i]?.id]?.xp ?? 0).level}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* World */}
          <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: P.muted }}>
              Habilidad a trabajar
            </p>
            <div className="grid grid-cols-3 gap-2">
              {WORLDS.filter((w) => CASE_BANK[w.id]).map((w) => (
                <button
                  key={w.id}
                  onClick={() => setCaseWorldId(w.id)}
                  className="rounded-xl p-3 text-center border transition-all"
                  style={
                    caseWorldId === w.id
                      ? {
                          background: `linear-gradient(135deg,${w.from}33,${w.to}22)`,
                          borderColor: w.from,
                        }
                      : { background: P.s2, borderColor: P.border }
                  }
                >
                  <p className="text-2xl mb-1">{w.emoji}</p>
                  <p
                    className="text-xs font-semibold leading-tight"
                    style={{ color: caseWorldId === w.id ? P.text : P.muted }}
                  >
                    {w.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="rounded-2xl p-4 border" style={{ background: P.s1, borderColor: P.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: P.muted }}>
              Nivel de dificultad
            </p>
            <div className="flex gap-2">
              {(["Básico", "Intermedio", "Avanzado"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setCaseDiff(d)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
                  style={
                    caseDiff === d
                      ? {
                          background:
                            d === "Básico"
                              ? g(P.g2, P.g1)
                              : d === "Intermedio"
                              ? g(P.a2, P.a1)
                              : g(P.r2, P.r1),
                          color: "#fff",
                          border: "none",
                        }
                      : { background: P.s2, borderColor: P.border, color: P.muted }
                  }
                >
                  {d === "Básico" ? "🟢" : d === "Intermedio" ? "🟡" : "🔴"} {d}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: P.muted }}>
              Contexto <span style={{ color: "rgba(124,143,172,.5)" }}>(opcional)</span>
            </p>
            <p className="text-xs mb-3" style={{ color: P.muted }}>
              Describe el contexto del estudiante, situación del salón o enfoque específico.
            </p>
            <textarea
              value={caseContext}
              onChange={(e) => setCaseContext(e.target.value)}
              rows={3}
              placeholder="Ej: El grupo tuvo un conflicto esta semana y quiero que reflexionen sobre comunicación asertiva..."
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none resize-none"
              style={{
                background: P.s2,
                borderColor: P.border,
                color: P.text,
                fontFamily: "'Poppins',sans-serif",
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = P.v3;
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = P.border;
              }}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Conflicto grupal", "Bajo rendimiento", "Situación real del salón", "Evaluación oral próxima"].map(
                (hint) => (
                  <button
                    key={hint}
                    onClick={() => setCaseContext((p) => (p ? p + ". " + hint : hint))}
                    className="text-xs px-2.5 py-1 rounded-full border hover:opacity-80 transition-all"
                    style={{
                      background: "rgba(139,92,246,.1)",
                      borderColor: "rgba(139,92,246,.25)",
                      color: P.v4,
                    }}
                  >
                    {hint}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            onClick={() => handleGenerateCase(1800)}
            className="w-full py-4 rounded-2xl font-black text-white text-base hover:scale-[1.02] active:scale-[.98] transition-all"
            style={{
              background: g(P.v2, P.c2),
              boxShadow: "0 6px 20px rgba(109,40,217,.35)",
            }}
          >
            {caseGenerating ? "🤖 Generando caso didáctico…" : "✨ Generar caso con IA"}
          </button>

          {caseGenerating && (
            <div
              className="rounded-2xl p-4 border text-center"
              style={{ background: P.s1, borderColor: P.border }}
            >
              <div className="flex justify-center gap-1.5 mb-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: P.v4, animation: `pulse 1s ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
              <p className="text-sm" style={{ color: P.muted }}>
                Analizando perfil y generando caso personalizado…
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          {!generatedCase && !caseGenerating && (
            <div
              className="rounded-2xl p-8 border text-center flex flex-col items-center justify-center"
              style={{ background: P.s1, borderColor: P.border, minHeight: "400px" }}
            >
              <div className="text-6xl mb-4">🤖</div>
              <p className="font-bold text-lg mb-2" style={{ color: P.text }}>
                Asistente IA listo
              </p>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: P.muted }}>
                Configura el caso a la izquierda y pulsa "Generar". En segundos tendrás un caso didáctico completo y listo para asignar a tu(s) estudiante(s).
              </p>
            </div>
          )}

          {generatedCase && !caseGenerating && (
            <div className="space-y-4">
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ background: P.s1, borderColor: P.border }}
              >
                {/* Header */}
                <div
                  className="p-5 border-b"
                  style={{
                    background: `linear-gradient(135deg,${
                      WORLDS.find((w) => w.id === generatedCase.worldId)?.from ?? P.v2
                    }22,transparent)`,
                    borderColor: P.border,
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{generatedCase.worldEmoji}</span>
                    <div>
                      <p className="font-black text-base" style={{ color: P.text }}>
                        {generatedCase.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: P.text,
                            borderColor: `${
                              WORLDS.find((w) => w.id === generatedCase.worldId)?.from ?? P.v2
                            }66`,
                          }}
                        >
                          {generatedCase.worldName}
                        </span>
                        <DiffBadge level={generatedCase.difficulty as any} />
                        <span className="text-xs" style={{ color: P.muted }}>
                          ⏱ {generatedCase.duration}
                        </span>
                        <span className="text-xs font-bold" style={{ color: P.v4 }}>
                          ⚡ {generatedCase.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs p-2 rounded-xl border"
                    style={{ background: "rgba(255,255,255,.04)", borderColor: P.border }}
                  >
                    <span>👤</span>
                    <span style={{ color: P.muted }}>Para:</span>
                    <span className="font-bold" style={{ color: P.text }}>
                      {generatedCase.targetName}
                    </span>
                    <span className="ml-auto" style={{ color: P.muted }}>
                      {generatedCase.createdAt}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: P.c4 }}>
                      🎯 Objetivo de aprendizaje
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(240,246,255,.85)" }}>
                      {generatedCase.objective}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: P.v4 }}>
                      📖 Escenario
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(240,246,255,.8)" }}>
                      {generatedCase.scenario}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: P.a3 }}>
                      💬 Preguntas de reflexión
                    </p>
                    <div className="space-y-1.5">
                      {generatedCase.questions.map((q, i) => (
                        <div key={i} className="flex gap-2.5 text-sm" style={{ color: "rgba(240,246,255,.78)" }}>
                          <span className="font-black flex-shrink-0" style={{ color: P.a3 }}>
                            {i + 1}.
                          </span>
                          <p>{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3.5 border"
                    style={{ background: "rgba(16,185,129,.06)", borderColor: "rgba(16,185,129,.2)" }}
                  >
                    <p className="text-xs font-bold mb-1" style={{ color: P.g3 }}>
                      ✅ Criterio de evaluación
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(240,246,255,.7)" }}>
                      {generatedCase.evaluation}
                    </p>
                  </div>
                  {generatedCase.tips && (
                    <div
                      className="rounded-xl p-3.5 border"
                      style={{ background: "rgba(14,165,233,.06)", borderColor: "rgba(14,165,233,.2)" }}
                    >
                      <p className="text-xs font-bold mb-1" style={{ color: P.c3 }}>
                        💡 Tips para el docente
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(240,246,255,.7)" }}>
                        {generatedCase.tips}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToPlan}
                  className="flex-1 py-3.5 rounded-xl font-black text-white text-sm hover:scale-[1.02] transition-all"
                  style={{
                    background: g(P.g2, P.g3),
                    boxShadow: "0 6px 20px rgba(16,185,129,.3)",
                  }}
                >
                  ✅ Agregar al plan
                </button>
                <button
                  onClick={() => handleGenerateCase(1600)}
                  className="px-5 py-3.5 rounded-xl font-bold text-sm border hover:bg-white/5 transition-all"
                  style={{ color: P.muted, borderColor: P.border }}
                >
                  🔄 Otro caso
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AiCases;
