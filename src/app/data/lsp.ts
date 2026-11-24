// Lengua de Señas Peruana (LSP) — interpretation videos for the pilot mission.
//
// Content is organised by fragment: one fragment per spoken block of a scene
// (narration, dialogue, a consequence or a reaction). Each
// fragment lists its subtitle lines with the speaker and the time range of that
// line inside the video, so the panel can follow the line that is being said.
//
// Rules for adding a video (see LSP_ASSETS below):
//  - Recorded by a competent LSP interpreter, interpreting meaning with LSP grammar
//    (not word-by-word Spanish, not ASL or another sign language).
//  - Reviewed and approved by Deaf people who use LSP before status = "validado".
//  - Framing keeps face, both hands and the full signing space visible; the player
//    never crops the video (object-fit: contain).
//  - No AI-generated signing and no illustrations presented as interpretation.
// A fragment without a validated asset is shown as pending, naming what is missing.

import { COM1_SCRIPT, type MissionScript } from "./comMission";
import { SPEAKERS, speakerForLabel, sentences } from "../lib/voices";

export type LspStatus = "pendiente" | "en_revision" | "validado";
export type LspPhase = "intro" | "narrate" | "dialogue" | "consequence" | "chosen" | "result";

export interface LspLine {
  /** Exact subtitle text (same sentence the captions show). */
  text: string;
  speaker: string;
  role: string;
  /** Seconds inside the fragment video; null until the video is timed. */
  start: number | null;
  end: number | null;
}

export interface LspAsset {
  src: string;                 // e.g. "/lsp/com-1/s1-dialogue.mp4" (H.264 MP4, ≥ 720p)
  poster?: string;
  width: number; height: number;  // native size, used to keep the full frame visible
  duration: number;            // seconds
  /** [start, end] in seconds for each subtitle line of the fragment, in order. */
  lineTimes: [number, number][];
  status: LspStatus;
  interpreter: string;         // name and credential of the LSP interpreter
  review?: { reviewers: string; date: string; notes?: string }; // Deaf LSP users who approved it
}

export interface LspFragment {
  id: string;
  missionId: string;
  sceneId: string;
  stage: number;
  stageLabel: string;
  phase: LspPhase;
  phaseLabel: string;
  choiceId?: string;
  lines: LspLine[];
  asset: LspAsset | null;
  status: LspStatus;
}

/**
 * Validated (or in-review) interpretation videos, keyed by fragment id.
 * Empty on purpose: no LSP video has been recorded and validated yet.
 * Example entry once a video exists:
 *   "com-1:s1:dialogue": { src: "/lsp/com-1/s1-dialogue.mp4", width: 1280, height: 720, duration: 9.4,
 *     lineTimes: [[0, 4.2], [4.2, 9.4]], status: "validado", interpreter: "Nombre · Intérprete LSP",
 *     review: { reviewers: "Nombres de revisores sordos usuarios de LSP", date: "2026-07-15" } },
 */
export const LSP_ASSETS: Record<string, LspAsset> = {};

const PHASE_LABEL: Record<LspPhase, string> = {
  intro: "Presentación", narrate: "Narración", dialogue: "Diálogo", consequence: "Consecuencia", chosen: "Reacción", result: "Cierre",
};

function makeLines(text: string | undefined, speaker: { name: string; role: string }): LspLine[] {
  return sentences(text ?? "").map(t => ({ text: t, speaker: speaker.name, role: speaker.role, start: null, end: null }));
}

function buildFragments(script: MissionScript): LspFragment[] {
  const out: LspFragment[] = [];
  const push = (sceneId: string, stage: number, phase: LspPhase, lines: LspLine[], choiceId?: string) => {
    if (!lines.length) return;
    const id = `${script.id}:${sceneId}:${phase}${choiceId ? `:${choiceId}` : ""}`;
    const asset = LSP_ASSETS[id] ?? null;
    const timed = asset ? lines.map((l, i) => ({ ...l, start: asset.lineTimes[i]?.[0] ?? null, end: asset.lineTimes[i]?.[1] ?? null })) : lines;
    out.push({ id, missionId: script.id, sceneId, stage, stageLabel: script.stages[stage - 1], phase, phaseLabel: PHASE_LABEL[phase],
      choiceId, lines: timed, asset, status: asset?.status ?? "pendiente" });
  };
  const seen = new Set<string>();
  for (const sc of Object.values(script.scenes)) {
    const dlg = sc.speakerId ? SPEAKERS[sc.speakerId] : speakerForLabel(sc.speaker);
    push(sc.id, sc.stage, "narrate", makeLines(sc.narration, SPEAKERS.narrator));
    push(sc.id, sc.stage, "dialogue", makeLines(sc.dialogue, dlg));
    for (const c of sc.choices) {
      const key = `${sc.id}:${c.id}`;
      if (seen.has(key)) continue; seen.add(key);
      if (c.consequence) push(sc.id, sc.stage, "consequence", makeLines(c.consequence, SPEAKERS.narrator), c.id);
      if (c.reaction) push(sc.id, sc.stage, "chosen", makeLines(c.reaction, SPEAKERS.narrator), c.id);
    }
  }
  return out;
}

const fragmentCache = new WeakMap<MissionScript, LspFragment[]>();

/** Builds caption-aligned LSP slots for any map mission, not just the pilot. */
export function lspFragmentsFor(script: MissionScript): LspFragment[] {
  const cached = fragmentCache.get(script);
  if (cached) return cached;
  const fragments = buildFragments(script);
  fragmentCache.set(script, fragments);
  return fragments;
}

/** Kept as the pilot's reference set for compatibility with existing views. */
export const LSP_FRAGMENTS: LspFragment[] = lspFragmentsFor(COM1_SCRIPT);

export function lspFragmentFor(script: MissionScript, sceneId: string, phase: string, choiceId?: string | null, supplementalText?: string, prefixText?: string): LspFragment | null {
  const fragments = lspFragmentsFor(script);
  const match = fragments.find(f => f.sceneId === sceneId && f.phase === phase &&
    (f.phase === "consequence" || f.phase === "chosen" ? f.choiceId === choiceId : true));
  if (match && !(phase === "narrate" && prefixText?.trim())) return match;

  if (phase === "narrate" && prefixText?.trim()) {
    const scene = script.scenes[sceneId];
    const id = `${script.id}:${sceneId}:narrate`;
    const asset = match?.asset ?? LSP_ASSETS[id] ?? null;
    const lines = [...makeLines(prefixText, SPEAKERS.narrator), ...(match?.lines ?? [])];
    const timed = asset ? lines.map((line, index) => ({ ...line, start: asset.lineTimes[index]?.[0] ?? null, end: asset.lineTimes[index]?.[1] ?? null })) : lines;
    if (!scene || !timed.length) return null;
    return {
      id, missionId:script.id, sceneId, stage:scene.stage, stageLabel:script.stages[scene.stage - 1],
      phase:"narrate", phaseLabel:PHASE_LABEL.narrate,
      lines:timed, asset, status:asset?.status ?? "pendiente",
    };
  }

  if ((phase !== "intro" && phase !== "result") || !supplementalText?.trim()) return match ?? null;

  // Mission introductions and endings are generated from the active case/outcome.
  // Show their actual caption while keeping the video status honest and pending.
  const typedPhase = phase as "intro" | "result";
  const id = `${script.id}:${sceneId}:${typedPhase}${choiceId ? `:${choiceId}` : ""}`;
  const asset = LSP_ASSETS[id] ?? null;
  const lines = makeLines(supplementalText, SPEAKERS.narrator);
  const timed = asset ? lines.map((line, index) => ({ ...line, start: asset.lineTimes[index]?.[0] ?? null, end: asset.lineTimes[index]?.[1] ?? null })) : lines;
  const scene = script.scenes[sceneId];
  if (!scene || !timed.length) return null;
  return {
    id, missionId: script.id, sceneId, stage: scene.stage, stageLabel: script.stages[scene.stage - 1],
    phase: typedPhase, phaseLabel: PHASE_LABEL[typedPhase], lines: timed, asset,
    status: asset?.status ?? "pendiente",
  };
}

/** Index of the line being signed at `time` (seconds), or -1. */
export function lineAtTime(f: LspFragment, time: number): number {
  return f.lines.findIndex(l => l.start !== null && l.end !== null && time >= l.start && time < l.end);
}

export function lspCoverage(script: MissionScript) {
  const all = lspFragmentsFor(script);
  const validated = all.filter(f => f.status === "validado");
  return { total: all.length, validated: validated.length, pending: all.filter(f => f.status !== "validado") };
}
