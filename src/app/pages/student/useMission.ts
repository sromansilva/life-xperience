import { useEffect,useMemo,useRef,useState } from "react";
import { CROWD_LABEL } from "../../art/ClassroomScene";
import { type MissionScene,type SceneChoice } from "../../data/comMission";
import { lspFragmentFor } from "../../data/lsp";
import { MISSION_CASES } from "../../data/missionCases";
import { BONUS_SECONDS,BONUS_XP } from "../../data/sim";
import { WORLDS,findMission,getScript } from "../../data/worlds";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { getOrionHint } from "../../lib/orion";
import { SPEAKERS,playCues,sceneVoiceClip,sentences,speakerForLabel,stopVoicePlayback,ttsSupported,type Cue,type Speaker } from "../../lib/voices";
import { useAppNavigation } from "../../navigation";
import { type OrionMissionContext } from "../../OrionChat";
import { useOrion } from "../../providers/OrionProvider";
import { usePrefs } from "../../providers/PrefsProvider";
import { useProgress } from "../../providers/ProgressProvider";
import { useSession } from "../../providers/SessionProvider";
import type { Decision,MissionItem,ScenePlayback } from "../../types";
import { stageOf } from "./shared";

export function useMission() {
  const { appScreen, setAppScreen, setTeacherTab, worldId, navigate } = useAppNavigation();
  const { su, logout: sessionLogout, exitPractice: sessionExitPractice } = useSession();
  const { run, lastReward, patchRun, beginMission, completeMission: completeProgressMission, resetPractice, resetProgress } = useProgress();
  const selectedWorld = WORLDS.find(w => w.id === (worldId ?? (appScreen === "sim" ? run?.worldId : appScreen === "results" ? lastReward?.worldId : null))) ?? null;
  const [confetti, setConfetti]           = useState(false);
  // General Orion conversation: session-only and independent from mission progress.
  const { orionChat, setOrionChat } = useOrion();



  const { prefs, setPrefs, audioOn, setAudioOn } = usePrefs();
  const [ttsNonce, setTtsNonce]       = useState(0);
  const [timerLeft, setTimerLeft]     = useState(BONUS_SECONDS);
  const [orionPulse, setOrionPulse]   = useState(0);
  const [particles, setParticles]     = useState<{id:number;emoji:string;x:number;delay:number}[]>([]);
  const [levelUpShow, setLevelUpShow] = useState(false);
  const [animXP, setAnimXP]           = useState(su?.xp ?? 0);
  const phaseHeadingRef   = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const chooseRef         = useRef<(c:SceneChoice)=>void>(()=>{});
  const reducedMotion = useReducedMotion();
  const instantText = prefs.instantText || reducedMotion;


  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const script = useMemo(() => run ? getScript(run.missionId) : null, [run?.worldId, run?.missionId]);
  const scene: MissionScene|null = script && run ? (script.scenes[run.sceneId] ?? null) : null;
  const runMission = run ? findMission(run.worldId, run.missionId) : null;
  const runWorld   = run ? (WORLDS.find(w=>w.id===run.worldId) ?? null) : null;
  const outcome    = script && run?.path ? script.outcomes?.[run.path] ?? null : null;

  // ── Subtitle cues for the current phase: who speaks, what is said, relevant sounds ──
  const phaseCues: Cue[] = useMemo(() => {
    if (appScreen!=="sim" || !run || !scene) return [];
    const lines = (text: string|undefined, sp: Speaker, pre: string): Cue[] => sentences(text ?? "").map((t,i)=>({
      id:`${pre}-${i}`, kind:"speech", text:t, speaker:sp,
      audio: pre === "d" ? sceneVoiceClip(run.missionId, scene.id, `${pre}-${i}`) : undefined,
    }));
    const fx = (arr: string[]|undefined, pre: string): Cue[] => (arr ?? []).map((t,i)=>({ id:`${pre}-fx${i}`, kind:"sound", text:t }));
    const dlg = scene.speakerId ? SPEAKERS[scene.speakerId] : speakerForLabel(scene.speaker);
    const activitySetting = MISSION_CASES[run.missionId];
    const visualDescription = activitySetting
      ? `Descripción de la escena: La actividad ocurre en ${scene.location}. Se ve ${activitySetting.context.toLowerCase()} ${CROWD_LABEL[scene.crowd ?? "neutral"]}`
      : `Descripción de la escena: Estás en ${scene.location}. Frente a ti está la actividad «${scene.board.title}». ${CROWD_LABEL[scene.crowd ?? "neutral"]}`;
    switch (run.phase) {
      case "narrate":     return [...lines(visualDescription, SPEAKERS.narrator, "ad"), ...fx(scene.sounds?.narrate,"n"), ...lines(scene.narration, SPEAKERS.narrator, "n")];
      case "dialogue":    return [...fx(scene.sounds?.dialogue,"d"), ...lines(scene.dialogue, dlg, "d")];

      case "consequence": return [
        ...(run.lastChoice ? lines(`Elijo esta opción: ${run.lastChoice.text}.`, SPEAKERS.student, "student-choice") : []),
        ...fx(run.lastChoice?.sounds,"c"), ...lines(run.lastChoice?.consequence, SPEAKERS.narrator, "c"),
      ];
      case "chosen":      return [
        ...(run.lastChoice ? lines(`Elijo esta opción: ${run.lastChoice.text}.`, SPEAKERS.student, "student-choice") : []),
        ...lines(run.lastChoice?.reaction ?? "Tu decisión cambia el rumbo de la escena.", SPEAKERS.narrator, "r"), ...fx(run.lastChoice?.sounds,"r"),
      ];
      default:            return [];
    }
  }, [appScreen, run?.phase, run?.sceneId, run?.lastChoice, scene]);
  const [cueIdx, setCueIdx] = useState(-1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [forceAllCaptions, setForceAllCaptions] = useState(false);
  const [scenePlayback, setScenePlayback] = useState<ScenePlayback>("idle");
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const decisionDialogRef = useRef<HTMLDivElement>(null);
  const decisionTriggerRef = useRef<HTMLButtonElement>(null);
  const twDone = scenePlayback === "complete" || forceAllCaptions;
  const twSkip = () => setForceAllCaptions(true);

  // ── Immersive mode + LSP box ────────────────────────────────────────────────
  const [immersive, setImmersive] = useState(false);
  const [lspOpen, setLspOpen] = useState(false);
  const [lspLarge, setLspLarge] = useState(false);
  const [lspPlaying, setLspPlaying] = useState(false);
  const [lspVideoLine, setLspVideoLine] = useState(-1);
  const lspToggleRef  = useRef<HTMLButtonElement>(null);
  const lspHeadingRef = useRef<HTMLHeadingElement>(null);
  const lspVideoRef   = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    setDecisionDialogOpen(run?.phase === "choices");
  }, [run?.phase, run?.sceneId]);
  function closeDecisionDialog() {
    setDecisionDialogOpen(false);
    setTimeout(() => decisionTriggerRef.current?.focus(), 40);
  }
  useEffect(() => {
    if (!decisionDialogOpen || run?.phase !== "choices") return;
    const root = decisionDialogRef.current;
    if (!root) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const selector = "button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusables = () => [...root.querySelectorAll<HTMLElement>(selector)];
    const focusTimer = setTimeout(() => (phaseHeadingRef.current ?? focusables()[0])?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeDecisionDialog();
      } else if (event.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [decisionDialogOpen, run?.phase]);
  // Line of the current phase that the subtitles are showing (speech lines only).
  const speechCues = phaseCues.filter(c => c.kind === "speech");
  let captionLine = -1;
  if (speechCues.length) {
    captionLine = forceAllCaptions || scenePlayback === "complete"
      ? speechCues.length - 1
      : phaseCues.slice(0, cueIdx + 1).filter(c => c.kind === "speech").length - 1;
  }
  // Caption-aligned LSP segment for every scripted map mission.
  const lspFragment = useMemo(() => {
    if (!run || !script || !scene) return null;
    const ph = run.phase === "choices" ? "dialogue" : run.phase;
    const supplementalText = run.phase === "intro" ? runMission?.desc : run.phase === "result" ? outcome?.head : undefined;
    const setting = MISSION_CASES[run.missionId];
    const prefixText = run.phase === "narrate" ? setting
      ? `Descripción de la escena: La actividad ocurre en ${scene.location}. Se ve ${setting.context.toLowerCase()} ${CROWD_LABEL[scene.crowd ?? "neutral"]}`
      : `Descripción de la escena: Estás en ${scene.location}. Frente a ti está la actividad «${scene.board.title}». ${CROWD_LABEL[scene.crowd ?? "neutral"]}`
      : undefined;
    return lspFragmentFor(script, run.sceneId, ph, run.lastChoice?.id, supplementalText, prefixText);
  }, [run?.missionId, run?.sceneId, run?.phase, run?.lastChoice, script, scene, runMission?.desc, outcome?.head]);
  const lspValidated = !!lspFragment?.asset && lspFragment.status === "validado";
  const lspLine = lspPlaying && lspVideoLine >= 0 ? lspVideoLine : run?.phase === "choices" ? 0 : Math.max(0, captionLine);
  function closeLsp() { lspVideoRef.current?.pause(); setLspOpen(false); setTimeout(() => lspToggleRef.current?.focus(), 40); }
  useEffect(() => { setLspVideoLine(-1); setLspPlaying(false); }, [lspFragment?.id]);
  useEffect(() => { if (appScreen !== "sim" && lspOpen) setLspOpen(false); }, [appScreen]);
  useEffect(() => {
    if (!lspOpen) return;
    const t = setTimeout(() => lspHeadingRef.current?.focus(), 40);
    // Escape closes the LSP panel first (capture phase, before immersive mode) and returns focus to its control.
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLsp(); } };
    window.addEventListener("keydown", onKey, true);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey, true); };
  }, [lspOpen]);
  // Keep the video on the line being voiced (only with voice on, a validated video and motion allowed).
  useEffect(() => {
    const v = lspVideoRef.current, f = lspFragment;
    if (!lspOpen || !v || !f || !lspValidated || reducedMotion) return;
    if (scenePlayback !== "playing" || captionLine < 0) {
      v.pause();
      return;
    }
    const st = f.lines[captionLine]?.start;
    if (st == null) return;
    if (Math.abs(v.currentTime - st) > 0.8) v.currentTime = st;
    if (v.paused) v.play().catch(() => {});
  }, [captionLine, lspFragment?.id, lspOpen, lspValidated, reducedMotion, scenePlayback]);
  const immersiveBtnRef  = useRef<HTMLButtonElement>(null);
  const immersiveExitRef = useRef<HTMLButtonElement>(null);
  function closeImmersive() { setImmersive(false); setTimeout(() => immersiveBtnRef.current?.focus(), 40); }
  useEffect(() => { if (appScreen !== "sim" && immersive) setImmersive(false); }, [appScreen]);
  useEffect(() => {
    // Everything outside the immersive scene becomes inert so keyboard focus stays inside.
    ["lx-sidebar","lx-band","lx-mobilenav"].forEach(id => { const el = document.getElementById(id); if (el) immersive ? el.setAttribute("inert","") : el.removeAttribute("inert"); });
    if (!immersive) return;
    const t = setTimeout(() => immersiveExitRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); closeImmersive(); } };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); ["lx-sidebar", "lx-band", "lx-mobilenav"].forEach(id => document.getElementById(id)?.removeAttribute("inert")); };
  }, [immersive]);

  // ── Bonus timer: optional, explained up front, paused while Orion is open ────
  useEffect(() => {
    if (run?.phase === "choices") setTimerLeft(BONUS_SECONDS);
  }, [run?.phase, run?.missionId, run?.sceneId, run?.decisions.length]);
  useEffect(() => {
    if (appScreen!=="sim" || run?.phase!=="choices" || !prefs.timer || run?.orionOpen) return;
    const t = setInterval(() => setTimerLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [appScreen, run?.phase, run?.sceneId, prefs.timer, run?.orionOpen]);

  // ── Keyboard shortcuts 1–4: only while the options are visible and nobody is typing ──
  useEffect(() => {
    if (appScreen!=="sim" || run?.phase!=="choices" || !scene || !decisionDialogOpen) return;
    const choices = scene.choices;
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName==="INPUT" || t.tagName==="TEXTAREA" || t.tagName==="SELECT" || t.isContentEditable)) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > choices.length) return;
      e.preventDefault();
      chooseRef.current(choices[n-1]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appScreen, run?.phase, scene, decisionDialogOpen]);

  // ── Move focus to the panel heading when the stage or phase changes ─────────
  useEffect(() => {
    const target = appScreen==="sim" ? phaseHeadingRef : appScreen==="results" ? resultsHeadingRef : null;
    if (!target) return;
    const t = setTimeout(() => target.current?.focus({ preventScroll:true }), 30);
    return () => clearTimeout(t);
  }, [appScreen, run?.phase, run?.sceneId]);

  // ── animate XP counter ─────────────────────────────────────────────────────
  useEffect(() => {
    const target = su?.xp ?? 0;
    if (reducedMotion) { setAnimXP(target); return; }
    const t = setInterval(() => {
      setAnimXP(p => {
        if (p === target) { clearInterval(t); return p; }
        const step = Math.max(1, Math.ceil(Math.abs(target - p) / 40));
        return target > p ? Math.min(p + step, target) : Math.max(p - step, target);
      });
    }, 35);
    return () => clearInterval(t);
  }, [su?.xp, reducedMotion]);

  // ── Common scene player. It never advances to choices automatically. ────────
  useEffect(() => { if (ttsSupported()) window.speechSynthesis.getVoices(); }, []);
  useEffect(() => {
    if (scenePlayback !== "playing" || !audioOn || appScreen!=="sim" || !phaseCues.length) {
      setAudioPlaying(false);
      return;
    }
    const first = Math.max(0, cueIdx);
    setAudioPlaying(true);
    const stop = playCues(phaseCues.slice(first), {
      onCue: i => setCueIdx(first + i),
      onDone: () => {
        setAudioPlaying(false);
        setCueIdx(phaseCues.length - 1);
        setScenePlayback("complete");
      },
    });
    return () => { stop(); setAudioPlaying(false); };
  }, [phaseCues, audioOn, appScreen, ttsNonce, scenePlayback]);
  useEffect(() => {
    if (scenePlayback !== "playing" || audioOn || appScreen !== "sim" || !phaseCues.length) return;
    if (cueIdx < 0) { setCueIdx(0); return; }
    const cue = phaseCues[cueIdx];
    const duration = instantText ? 650 : cue.kind === "sound" ? 900 : Math.min(4200, Math.max(1200, cue.text.length * 38));
    const t = setTimeout(() => {
      if (cueIdx >= phaseCues.length - 1) setScenePlayback("complete");
      else setCueIdx(i => i + 1);
    }, duration);
    return () => clearTimeout(t);
  }, [scenePlayback, audioOn, appScreen, phaseCues, cueIdx, instantText]);
  // The scene continues on its own after each spoken block; no extra Continue button is needed.
  useEffect(() => {
    if (appScreen !== "sim" || scenePlayback !== "complete" || (run?.phase !== "narrate" && run?.phase !== "dialogue")) return;
    const t = setTimeout(() => continueScenePlayback(), reducedMotion ? 1800 : 1200);
    return () => clearTimeout(t);
  }, [appScreen, scenePlayback, run?.phase, run?.sceneId, reducedMotion]);
  // After a successful response, keep the feedback visible briefly, then move to the next scene/result.
  useEffect(() => {
    if (appScreen !== "sim" || scenePlayback !== "complete" || run?.phase !== "chosen" || !run.lastChoice?.next) return;
    const t = setTimeout(() => continueAfterChoice(), reducedMotion ? 2600 : 1800);
    return () => clearTimeout(t);
  }, [appScreen, scenePlayback, run?.phase, run?.sceneId, run?.lastChoice?.id, reducedMotion]);
  useEffect(() => () => stopVoicePlayback(), [appScreen, run?.missionId, run?.sceneId, run?.phase]);
  useEffect(() => {
    stopVoicePlayback();
    setScenePlayback("idle");
    setCueIdx(-1);
    setForceAllCaptions(false);
  }, [run?.missionId, run?.sceneId]);

  // The interface is in Spanish: let screen readers use the right voice.


  // Re-render when Supabase write log changes (used by the practice band)

  // ── helpers ────────────────────────────────────────────────────────────────
  function spawnParticles(emoji: string) {
    if (reducedMotion) return;
    const ps = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i, emoji, x: 5 + Math.random() * 90, delay: i * 0.06,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 1600);
  }

  function startMission(world: typeof WORLDS[0], m: MissionItem) {
    beginMission(world, m);
    setParticles([]);
    setScenePlayback("idle"); setCueIdx(-1); setForceAllCaptions(false);
    setAppScreen("sim", m.id);
  }

  function continueMission() {
    if (!run) return;
    setAppScreen("sim", run.missionId);
  }

  function startScenePlayback() {
    if (!run || !scene) return;
    setCueIdx(0);
    setForceAllCaptions(instantText);
    if (!audioOn) setAudioOn(true);
    setScenePlayback("playing");
    if (run.phase === "intro") patchRun({ phase:"narrate" });
  }

  function startResponsePlayback() {
    if (!phaseCues.length) return;
    setCueIdx(0);
    setForceAllCaptions(instantText);
    if (!audioOn) setAudioOn(true);
    setScenePlayback("playing");
  }

  function toggleScenePlayback() {
    if (scenePlayback === "playing") {
      stopVoicePlayback();
      setScenePlayback("paused");
    } else if (scenePlayback === "paused") {
      setScenePlayback("playing");
    }
  }

  function continueScenePlayback() {
    if (!run || !scene || scenePlayback !== "complete") return;
    stopVoicePlayback();
    setCueIdx(0);
    setForceAllCaptions(instantText);
    if (run.phase === "narrate" && scene.dialogue) {
      setScenePlayback("playing");
      patchRun({ phase:"dialogue" });
    } else {
      setScenePlayback("idle");
      patchRun({ phase:"choices" });
    }
  }

  function chooseOption(c: SceneChoice) {
    if (!run || run.phase !== "choices" || !scene) return;
    const decision: Decision = { sceneId:run.sceneId, choiceId:c.id, quality:c.quality, text:c.text, at:Date.now() };
    if (c.quality === "negative") {
      setScenePlayback("playing"); setCueIdx(0); setForceAllCaptions(false);
      patchRun(r => ({ decisions:[...r.decisions, decision], lastChoice:c, phase:"consequence", orionOpen:false, reread:false }));
      setOrionPulse(n => n + 1);
      return;
    }
    const bonus = prefs.timer && timerLeft > 0 ? BONUS_XP : 0;
    spawnParticles(c.emoji);
    setScenePlayback("playing"); setCueIdx(0); setForceAllCaptions(false);
    patchRun(r => ({ decisions:[...r.decisions, decision], lastChoice:c, phase:"chosen", bonusXP:r.bonusXP + bonus, lastBonus:bonus, orionOpen:false, reread:false }));
  }
  chooseRef.current = chooseOption;

  function continueAfterChoice() {
    const next = run?.lastChoice?.next;
    if (!next) return;
    if (next.startsWith("end:")) patchRun({ path: next.slice(4), phase:"result" });
    else {
      const upcoming = script?.scenes[next];
      if (!upcoming) return;
      const phase = upcoming.narration ? "narrate" : upcoming.dialogue ? "dialogue" : "choices";
      setScenePlayback("idle"); setCueIdx(-1); setForceAllCaptions(false);
      patchRun({ sceneId: next, phase, lastChoice:null, orionOpen:false, reread:false, supportRequested:false });
    }
  }

  function requestHint() {
    if (!run || !scene) return;
    const previous = run.hints.filter(h => h.sceneId === run.sceneId);
    const negativeAttempts = run.decisions.filter(d => d.sceneId === run.sceneId && d.quality === "negative").length;
    const lastNegative = run.lastChoice?.quality === "negative" ? { id:run.lastChoice.id, text:run.lastChoice.text } : null;
    const context = { sceneId:run.sceneId, hints:scene.hints, lastNegative, negativeAttempts, previous };
    const reply = getOrionHint(context);
    patchRun(r => ({ hints:[...r.hints, { ...reply, id:r.hints.length + 1 }], orionOpen:true }));
    setOrionPulse(n => n + 1);
  }

  function completeMission() {
    const completedMissionId = run?.missionId;
    const reward = completeProgressMission();
    if (!reward) return;
    setParticles([]); setAppScreen("results", completedMissionId);
    if (!reducedMotion) {
      setConfetti(true); setTimeout(() => setConfetti(false), 1500);
      if (reward.leveledUp) setTimeout(() => { setLevelUpShow(true); setTimeout(() => setLevelUpShow(false), 1800); }, 400);
    }
  }
  function exitPractice() {
    stopVoicePlayback(); sessionExitPractice(); resetPractice(); setOrionChat([]);
    setConfetti(false); setLevelUpShow(false); setParticles([]);
    setTeacherTab("dashboard");
  }
  async function logout() {
    stopVoicePlayback(); await sessionLogout(); navigate("/", { replace: true }); setOrionChat([]); resetProgress();
  }

  const me = su!;
  const avatar = { hair: me.hairColor, hairStyle: me.hairStyle, skin: me.skinTone, shirt: me.shirtColor };
  const chatStage = stageOf(run);
  const orionMissionContext: OrionMissionContext | null = run && scene && runMission && runWorld && chatStage ? {
    missionTitle: runMission.title,
    worldName: runWorld.name,
    stage: `${chatStage.n} de ${chatStage.total}: ${chatStage.label}`,
    instruction: scene.consigna,
    lastDecision: run.lastChoice?.text,
    consequence: run.lastChoice?.quality === "negative" ? run.lastChoice.consequence : undefined,
    attempts: run.decisions.filter(d => d.sceneId === run.sceneId).length,
    hintsUsed: run.hints.filter(h => h.sceneId === run.sceneId).length,
  } : null;
  return { scene, phaseCues, orionMissionContext, patchRun, selectedWorld, confetti, setTtsNonce, timerLeft, orionPulse, particles, levelUpShow, animXP, phaseHeadingRef, resultsHeadingRef, reducedMotion, instantText, hintButtonRef, script, runMission, runWorld, outcome, cueIdx, setCueIdx, audioPlaying, forceAllCaptions, scenePlayback, setScenePlayback, decisionDialogOpen, setDecisionDialogOpen, decisionDialogRef, decisionTriggerRef, twDone, twSkip, immersive, setImmersive, lspOpen, setLspOpen, lspLarge, setLspLarge, lspPlaying, setLspPlaying, setLspVideoLine, lspToggleRef, lspHeadingRef, lspVideoRef, closeDecisionDialog, lspFragment, lspValidated, lspLine, closeLsp, immersiveBtnRef, immersiveExitRef, closeImmersive, startMission, continueMission, startScenePlayback, startResponsePlayback, toggleScenePlayback, chooseOption, requestHint, completeMission, exitPractice, logout, me, avatar, run, lastReward, appScreen, setAppScreen, prefs, setPrefs, audioOn, setAudioOn, orionChat, setOrionChat };
}

export type MissionState = ReturnType<typeof useMission>;
