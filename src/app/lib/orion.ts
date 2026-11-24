// Orion — contextual hint logic for the prototype.
// This is deterministic, rule-based logic (no AI): it chooses a hint from the
// current scene's hint bank using the phase, the last decision and prior attempts.

export type HintFocus = "consigna" | "publico" | "objetivo" | "ejemplo";

export const FOCUS_LABEL: Record<HintFocus, string> = {
  consigna: "La consigna",
  publico:  "El punto de vista del público",
  objetivo: "El objetivo de la etapa",
  ejemplo:  "Un ejemplo parecido",
};

export interface HintEntry { focus: HintFocus; text: string }

export interface SceneHints {
  /** Before choosing: clarify the task without pointing to an option. */
  clarify?: HintEntry[];
  /** After a negative choice, keyed by choice id. */
  recover?: Record<string, HintEntry[]>;
}

export type HintKind = "clarify" | "recover" | "fallback";

export interface HintRecord {
  id: number;
  sceneId: string;
  kind: HintKind;
  focus?: HintFocus;
  focusLabel?: string;
  intro: string;
  text: string;
  choiceId?: string;
  changedFocus: boolean;
}

export interface OrionContext {
  sceneId: string;
  hints?: SceneHints;
  /** Last decision on this scene, if it had negative consequences. */
  lastNegative?: { id: string; text: string } | null;
  /** Negative decisions already made on this scene. */
  negativeAttempts: number;
  /** Hints already given on this scene (oldest first). */
  previous: HintRecord[];
}

export type OrionReply = Omit<HintRecord, "id">;

export function getOrionHint(ctx: OrionContext): OrionReply {
  const recovering = !!ctx.lastNegative;
  const kind: HintKind = recovering ? "recover" : "clarify";
  const pool: HintEntry[] = recovering
    ? (ctx.hints?.recover?.[ctx.lastNegative!.id] ?? [])
    : (ctx.hints?.clarify ?? []);

  const usedTexts = new Set(ctx.previous.map(p => p.text));
  // Focuses used for the same difficulty (same kind and, when recovering, the same choice).
  const sameDifficulty = ctx.previous.filter(p =>
    p.kind === kind && (!recovering || p.choiceId === ctx.lastNegative!.id));
  const usedFocus = new Set(sameDifficulty.map(p => p.focus));
  const lastFocus = ctx.previous.length ? ctx.previous[ctx.previous.length - 1].focus : undefined;

  // Prefer a focus not used yet for this difficulty, and never repeat the last focus.
  const candidate =
    pool.find(h => !usedFocus.has(h.focus) && h.focus !== lastFocus && !usedTexts.has(h.text)) ??
    pool.find(h => !usedTexts.has(h.text) && h.focus !== lastFocus) ??
    pool.find(h => !usedTexts.has(h.text));

  if (!candidate) {
    return {
      sceneId: ctx.sceneId,
      kind: "fallback",
      intro: ctx.previous.length ? "Ya te di las pistas que tengo para este momento." : "No tengo una pista específica para este momento.",
      text: "Puedes releer la consigna con calma o pedir apoyo. Puedes volver a intentarlo sin perder XP.",
      choiceId: ctx.lastNegative?.id,
      changedFocus: false,
    };
  }

  const repeated = recovering ? (ctx.negativeAttempts >= 2 || sameDifficulty.length > 0) : ctx.previous.length > 0;
  const changedFocus = lastFocus !== undefined && lastFocus !== candidate.focus;
  const intro = recovering
    ? (repeated ? "Esta parte se está complicando. Probemos con otro enfoque." : "Veamos qué pasó y cómo reconsiderarlo.")
    : (repeated ? "Te lo explico de otra forma." : "Te aclaro lo que se pide.");

  return {
    sceneId: ctx.sceneId,
    kind,
    focus: candidate.focus,
    focusLabel: FOCUS_LABEL[candidate.focus],
    intro,
    text: candidate.text,
    choiceId: ctx.lastNegative?.id,
    changedFocus,
  };
}
