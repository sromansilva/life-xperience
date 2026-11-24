import { useState, useRef, useEffect } from "react";
import {
  FlaskConical,
  Play,
  Volume2,
  VolumeX,
  Repeat,
  Users,
  Target,
  Zap,
  TriangleAlert,
  AlertTriangle,
} from "lucide-react";
import { P, g, SHADOW } from "../../theme";
import { Portrait, CharSVG } from "../../art/characters";
import { StatPill, DemoChip, RadarSVG, Skill } from "../../components/lx";
import { TEACHER_DATA, RADAR_DATA_TEACHER, SEED_USERS } from "../../data/demo";
import { getLevelInfo } from "../../lib/progress";
import { playCues, ttsSupported } from "../../lib/voices";
import { useSession } from "../../providers/SessionProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useOrion } from "../../providers/OrionProvider";
import { useAppNavigation } from "../../navigation";
import { useTeacher, ORIENTATION } from "./shared";

export interface DashboardProps {
  /**
   * Handler opcional para iniciar la experiencia de práctica de estudiante.
   */
  onStartPractice?: () => void;
  /**
   * Handler opcional para navegar al generador IA con un estudiante y dificultad pre-seleccionados.
   */
  onNavigateToAi?: (target?: string, diff?: "Básico" | "Intermedio" | "Avanzado") => void;
}

export function Dashboard({ onStartPractice, onNavigateToAi }: DashboardProps) {
  const { currentUser, demoProfiles, startPractice: sessionStartPractice } = useSession();
  const { studentPlans, setStudentPlans, resetPractice } = useProgress();
  const { setOrionChat } = useOrion();
  const { setTeacherTab, navigate } = useAppNavigation();
  const { setCaseTarget, setCaseDiff } = useTeacher();

  const [expandedS, setExpandedS] = useState<string | null>(null);
  const [orientSpeaking, setOrientSpeaking] = useState(false);
  const orientStop = useRef<(() => void) | null>(null);

  const u = currentUser;

  // Detener la síntesis de voz al desmontar el componente
  useEffect(() => {
    return () => {
      orientStop.current?.();
      orientStop.current = null;
    };
  }, []);

  function handleStartPractice() {
    if (onStartPractice) {
      onStartPractice();
      return;
    }
    sessionStartPractice();
    resetPractice();
    setOrionChat([]);
    navigate("/app");
  }

  function handleOrientSpeak() {
    if (orientStop.current) {
      orientStop.current();
      orientStop.current = null;
      setOrientSpeaking(false);
    } else {
      setOrientSpeaking(true);
      orientStop.current = playCues(
        [
          {
            id: "o",
            kind: "speech",
            text: ORIENTATION,
            speaker: {
              id: "other",
              name: "Orientación docente",
              role: "Docente",
              voice: "teacher",
              portrait: "garcia",
            },
          },
        ],
        {
          onCue: () => {},
          onDone: () => {
            orientStop.current = null;
            setOrientSpeaking(false);
          },
        }
      );
    }
  }

  function handleOrientRepeat() {
    orientStop.current?.();
    setOrientSpeaking(true);
    orientStop.current = playCues(
      [
        {
          id: "o",
          kind: "speech",
          text: ORIENTATION,
          speaker: {
            id: "other",
            name: "Orientación docente",
            role: "Docente",
            voice: "teacher",
            portrait: "garcia",
          },
        },
      ],
      {
        onCue: () => {},
        onDone: () => {
          orientStop.current = null;
          setOrientSpeaking(false);
        },
      }
    );
  }

  return (
    <>
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-black mb-0.5" style={{ color: P.text }}>
            Panel Docente
          </h1>
          <p className="text-sm" style={{ color: P.muted }}>
            {u?.subject} · Grupo {u?.group} · Lunes 30 Jun, 2026
          </p>
        </div>
      </div>

      {/* Practice entry */}
      <div
        className="rounded-2xl p-5 mb-3 border flex flex-wrap items-center gap-5"
        style={{ background: P.s1, borderColor: "rgba(34,211,238,.4)" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(34,211,238,.14)" }}
        >
          <FlaskConical size={22} style={{ color: P.c4 }} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold" style={{ color: P.text }}>
            Prueba la experiencia del estudiante
          </h2>
          <p className="text-sm mt-0.5" style={{ color: P.muted }}>
            Usa las mismas pantallas, misiones, decisiones y ayudas de Orion. La práctica no cambia el XP, las monedas, el avatar ni el progreso de ningún estudiante.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartPractice}
          className="min-h-11 px-5 py-3 rounded-xl font-bold text-white text-sm flex items-center gap-2 flex-shrink-0"
          style={{ background: g(P.v2, P.v1), boxShadow: SHADOW.action }}
        >
          <Play size={16} aria-hidden="true" />
          Probar como estudiante
        </button>
      </div>

      {/* Teacher-role guidance, with an adult female voice */}
      <div
        className="rounded-2xl px-5 py-4 mb-6 border flex flex-wrap items-start gap-4"
        style={{ background: P.s1, borderColor: P.border }}
      >
        <Portrait who="garcia" size={36} />
        <div className="flex-1 min-w-[240px]">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: P.c4 }}>
            Orientación docente · voz femenina adulta
          </p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "#E3E8FA" }}>
            {ORIENTATION}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleOrientSpeak}
            disabled={!ttsSupported()}
            className="min-h-11 px-4 rounded-xl text-sm font-semibold border inline-flex items-center gap-2"
            style={{ color: P.text, borderColor: P.border }}
          >
            {orientSpeaking ? (
              <>
                <VolumeX size={15} aria-hidden="true" />
                Silenciar
              </>
            ) : (
              <>
                <Volume2 size={15} aria-hidden="true" />
                Escuchar orientación
              </>
            )}
          </button>
          <button
            type="button"
            disabled={!ttsSupported()}
            onClick={handleOrientRepeat}
            className="min-h-11 px-4 rounded-xl text-sm font-semibold border inline-flex items-center gap-2"
            style={{ color: P.text, borderColor: P.border }}
          >
            <Repeat size={15} aria-hidden="true" />
            Repetir audio
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-sm" style={{ color: P.text }}>
          Resumen del grupo
        </h2>
        <DemoChip />
        <span className="text-xs" style={{ color: P.muted }}>
          Participación, misiones de hoy, gráficas y habilidades son ejemplos del prototipo.
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatPill
          icon={<Users size={22} aria-hidden="true" />}
          val={String(TEACHER_DATA.length)}
          label="Estudiantes demo"
          color={P.c4}
        />
        <StatPill
          icon={<Target size={22} aria-hidden="true" />}
          val="87%"
          label="Participación (demo)"
          color={P.v4}
        />
        <StatPill
          icon={<Zap size={22} aria-hidden="true" />}
          val="142"
          label="Misiones hoy (demo)"
          color={P.a3}
        />
        <StatPill
          icon={<TriangleAlert size={22} aria-hidden="true" />}
          val={String(TEACHER_DATA.filter((s) => s.alert).length)}
          label="Alertas (demo)"
          color={P.r4}
        />
      </div>

      {TEACHER_DATA.some((s) => s.alert) && (
        <div
          className="rounded-2xl p-4 mb-6 border flex gap-3"
          style={{ background: "rgba(239,68,68,.07)", borderColor: "rgba(239,68,68,.25)" }}
        >
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: P.r3 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: P.r4 }}>
              Estudiantes que requieren atención inmediata <DemoChip />
            </p>
            {TEACHER_DATA.filter((s) => s.alert).map((s) => (
              <p key={s.name} className="text-xs leading-relaxed" style={{ color: "rgba(240,246,255,.7)" }}>
                • <strong>{s.name}</strong> — racha de {s.streak} día(s), habilidades bajo el promedio.
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: P.text }}>
            Habilidades promedio del grupo <DemoChip />
          </h3>
          <RadarSVG data={RADAR_DATA_TEACHER} color={P.c3} size={230} />
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: P.s1, borderColor: P.border }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: P.text }}>
            Actividad semanal del grupo <DemoChip />
          </h3>
          <div className="flex items-end gap-2 h-40">
            {[42, 67, 31, 88, 55, 76, 20].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${(v / 88) * 130}px`,
                    background: i === 5 ? g(P.c2, P.c3, "180deg") : "rgba(255,255,255,0.08)",
                  }}
                />
                <span className="text-xs" style={{ color: P.muted }}>
                  {"LMXJVSD"[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="font-bold text-sm mb-1" style={{ color: P.text }}>
        Progreso individual
      </h3>
      <p className="text-xs mb-3" style={{ color: P.muted }}>
        Nivel, XP y monedas muestran las cuentas demo en esta sesión. Misiones, racha y habilidades son{" "}
        <strong style={{ color: "#FCD34D" }}>datos demo</strong>.
      </p>

      <div className="space-y-3">
        {TEACHER_DATA.map((s, i) => {
          const stuKey = s.name.split(" ")[0].toLowerCase();
          const stuPlans = studentPlans[stuKey] ?? [];
          const live = demoProfiles[SEED_USERS[i]?.id];
          return (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                background: expandedS === s.name ? "rgba(139,92,246,.07)" : P.s1,
                borderColor: expandedS === s.name ? P.v3 : P.border,
              }}
            >
              <button
                type="button"
                aria-expanded={expandedS === s.name}
                className="w-full px-5 py-4 flex items-center gap-4"
                onClick={() => setExpandedS(expandedS === s.name ? null : s.name)}
              >
                <div className="flex-shrink-0">
                  <CharSVG
                    hair={SEED_USERS[i]?.hairColor || "#2C1810"}
                    hairStyle={SEED_USERS[i]?.hairStyle || "A"}
                    skin={SEED_USERS[i]?.skinTone || "#FDBCB4"}
                    shirt={SEED_USERS[i]?.shirtColor || P.v2}
                    mood="happy"
                    size={50}
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: P.text }}>
                      {s.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={
                        s.alert
                          ? {
                              background: "rgba(239,68,68,.15)",
                              color: P.r3,
                              border: "1px solid rgba(239,68,68,.3)",
                            }
                          : { background: "rgba(16,185,129,.15)", color: P.g3 }
                      }
                    >
                      {s.alert ? "⚠ Alerta" : "✓ Progreso"}
                    </span>
                    {stuPlans.length > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(139,92,246,.15)", color: P.v4 }}
                      >
                        📋 {stuPlans.length} caso{stuPlans.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs mt-0.5 flex-wrap" style={{ color: P.muted }}>
                    <span data-testid={`teacher-xp-${SEED_USERS[i]?.id}`} style={{ color: P.text }}>
                      Nivel {getLevelInfo(live?.xp ?? 0).level} · {(live?.xp ?? 0).toLocaleString()} XP ·{" "}
                      {live?.coins ?? 0} monedas
                    </span>
                    <span>{s.missions} misiones (demo)</span>
                    <span>🔥 {s.streak} días (demo)</span>
                  </div>
                </div>
                <span aria-hidden="true" style={{ color: P.muted }}>
                  {expandedS === s.name ? "▲" : "▼"}
                </span>
              </button>

              {expandedS === s.name && (
                <div className="px-5 pb-5 pt-2 border-t" style={{ borderColor: P.border }}>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <Skill label="Comunicación" value={s.com} color={P.v3} />
                      <Skill label="Liderazgo" value={s.lid} color={P.a3} />
                      <Skill label="Empatía" value={s.emp} color={P.g3} />
                      <Skill label="Pensamiento" value={s.pen} color={P.c3} />
                    </div>
                    <div
                      className="rounded-xl p-4 border"
                      style={
                        s.alert
                          ? { background: "rgba(239,68,68,.06)", borderColor: "rgba(239,68,68,.2)" }
                          : { background: "rgba(16,185,129,.06)", borderColor: "rgba(16,185,129,.2)" }
                      }
                    >
                      <p
                        className="text-xs font-bold mb-2"
                        style={{ color: s.alert ? P.r3 : P.g3 }}
                      >
                        {s.alert ? "📌 Recomendación IA" : "✅ Sugerencia IA"}
                      </p>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(240,246,255,.7)" }}>
                        {s.alert
                          ? `Generar un caso Básico personalizado para ${s.name.split(" ")[0]} con el Asistente IA para retomar el ritmo.`
                          : `${s.name.split(" ")[0]} está listo para casos Avanzados. El Asistente IA puede generar uno de Liderazgo.`}
                      </p>
                      <button
                        onClick={() => {
                          const diff = s.alert ? "Básico" : "Avanzado";
                          setCaseTarget(stuKey);
                          setCaseDiff(diff);
                          if (onNavigateToAi) {
                            onNavigateToAi(stuKey, diff);
                          } else {
                            setTeacherTab("ai");
                          }
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
                        style={{ background: g(P.v2, P.c2) }}
                      >
                        🤖 Generar caso con IA
                      </button>
                    </div>
                  </div>

                  {stuPlans.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: P.muted }}>
                        Casos asignados ({stuPlans.length})
                      </p>
                      <div className="space-y-2">
                        {stuPlans.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl border"
                            style={{ background: P.s2, borderColor: P.border }}
                          >
                            <span className="text-lg">{c.worldEmoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: P.text }}>
                                {c.title}
                              </p>
                              <p className="text-xs" style={{ color: P.muted }}>
                                {c.worldName} · {c.difficulty} · {c.duration} · {c.xp} XP
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setStudentPlans((prev) => {
                                  const p = { ...prev };
                                  p[stuKey] = (p[stuKey] ?? []).filter((x) => x.id !== c.id);
                                  return p;
                                })
                              }
                              className="text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                              style={{ color: P.r3 }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Dashboard;
