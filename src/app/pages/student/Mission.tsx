import { AlertTriangle,AudioLines,BookOpen,Check,CheckCircle,Hand,LifeBuoy,Lightbulb,Maximize2,Minimize2,Pause,Play,Repeat,RotateCcw,Settings,Timer,TimerOff,Type,Volume2,VolumeX,X,Zap } from "lucide-react";
import { Portrait } from "../../art/characters";
import { CROWD_LABEL,ClassroomScene,type Crowd } from "../../art/ClassroomScene";
import { LspSpellingPreview } from "../../art/LspSpellingPreview";
import { MissionSetting } from "../../art/MissionSetting";
import { BackArrow,OrionFace,Skill,Toggle } from "../../components/lx";
import { lineAtTime,lspCoverage } from "../../data/lsp";
import { MISSION_CASES } from "../../data/missionCases";
import { BONUS_SECONDS,BONUS_XP,PHASE_LABEL } from "../../data/sim";
import { computeReward,computeScore } from "../../lib/progress";
import { SPEAKERS,describeVoice,sentences,speakAs,speakerForLabel,stopVoicePlayback,ttsSupported,voiceStyle,type Cue } from "../../lib/voices";
import { P,SHADOW,g } from "../../theme";
import { btnGhost,btnPrimary,ghostStyle,primaryStyle } from "./shared";
import type { MissionState } from "./useMission";

export default function Mission({ state }: { state: MissionState }) {
  const { scene, phaseCues, patchRun, setTtsNonce, timerLeft, orionPulse, phaseHeadingRef, reducedMotion, instantText, hintButtonRef, script, runMission, runWorld, outcome, cueIdx, setCueIdx, audioPlaying, forceAllCaptions, scenePlayback, setScenePlayback, decisionDialogOpen, setDecisionDialogOpen, decisionDialogRef, decisionTriggerRef, twDone, twSkip, immersive, setImmersive, lspOpen, setLspOpen, lspLarge, setLspLarge, lspPlaying, setLspPlaying, setLspVideoLine, lspToggleRef, lspHeadingRef, lspVideoRef, closeDecisionDialog, lspFragment, lspValidated, lspLine, closeLsp, immersiveBtnRef, immersiveExitRef, closeImmersive, startScenePlayback, startResponsePlayback, toggleScenePlayback, chooseOption, requestHint, completeMission, me, avatar, run, setAppScreen, prefs, setPrefs, audioOn, setAudioOn } = state;
    if (!run || !scene || !script || !runMission || !runWorld) {
      return (
        <div className="text-center py-20">
          <h1 ref={phaseHeadingRef} tabIndex={-1} className="text-xl font-bold mb-4" style={{ color:P.text }}>No hay ninguna misión en curso</h1>
          <button type="button" onClick={()=>setAppScreen("map")} className={btnPrimary} style={primaryStyle}>Elegir misión</button>
        </div>
      );
    }
    const phase = run.phase;
    const stage = { n: scene.stage, total: script.stages.length, label: script.stages[scene.stage-1] };
    const sceneHints = run.hints.filter(h=>h.sceneId===run.sceneId);
    const lastHint = sceneHints[sceneHints.length-1];
    const specificHints = sceneHints.filter(h=>h.kind!=="fallback").length;
    const negHere = run.decisions.filter(d=>d.sceneId===run.sceneId && d.quality==="negative");
    const triedNegative = new Set(negHere.map(d=>d.choiceId));
    const crowd: Crowd = phase==="consequence" ? (run.lastChoice?.crowd ?? "distracted")
      : phase==="chosen" ? (run.lastChoice?.crowd ?? (run.lastChoice?.quality==="good" ? "engaged" : "attentive"))
      : phase==="result" ? "applause" : (scene.crowd ?? "neutral");
    const mood = phase==="consequence" ? "nervous" : (phase==="chosen"||phase==="result") ? "confident" : scene.mood;
    const dlgSpeaker = scene.speakerId ? SPEAKERS[scene.speakerId] : speakerForLabel(scene.speaker);
    const activeCueSpeaker = scenePlayback === "playing" ? phaseCues[cueIdx]?.speaker : undefined;
    const activePortrait = activeCueSpeaker?.portrait;
    const settingSpeaker = ["garcia","lucas","daniela","sofia"].includes(dlgSpeaker.portrait)
      ? dlgSpeaker.portrait as "garcia"|"lucas"|"daniela"|"sofia"
      : scene.speakerId;
    const characterSpeaking = phase==="dialogue" || phase==="consequence" || phase==="chosen";
    const speakingInScene = characterSpeaking && (activePortrait==="garcia" || activePortrait==="lucas" || activePortrait==="daniela")
      ? activePortrait : characterSpeaking && activePortrait==="student" ? "student" : null;
    const settingSpeaking = characterSpeaking && activePortrait && activePortrait!=="narrator" && activePortrait!=="orion"
      ? activePortrait==="student" ? "student" : activePortrait==="garcia" ? "teacher" : "peer"
      : null;
    const orionState: "hidden"|"present"|"alert" = run.orionOpen ? "alert" : phase==="consequence" ? "present" : "hidden";
    const sceneDesc = `Ilustración: ${scene.location}. Actividad: ${scene.board.title}. ${CROWD_LABEL[crowd]}${speakingInScene?` Habla ${dlgSpeaker.name}.`:""}${orionState!=="hidden"?" Orion, tu mentor, está cerca para ayudarte.":""}`;
    const setting = MISSION_CASES[script.id];
    const nextRef = run.lastChoice?.next;
    const nextScene = nextRef && !nextRef.startsWith("end:") ? script.scenes[nextRef] : null;
    const preview = computeReward(me.xp, runMission.xp, run.bonusXP);
    const heading = (text: React.ReactNode, extra?: React.ReactNode) => (
      <div className="flex items-center gap-2">
        <h2 ref={phaseHeadingRef} tabIndex={-1} className="text-lg font-black flex items-center gap-2" style={{ color:P.text }}>{text}</h2>
        {extra}
      </div>
    );
    const card = (children: React.ReactNode, border = P.border) => (
      <div className="rounded-2xl p-5 border space-y-3" style={{ background:P.s1, borderColor:border }}>{children}</div>
    );
    const hintButton = (
      <button ref={hintButtonRef} type="button" onClick={() => requestHint()} className={`${btnGhost} w-full`} style={{ color:"#DCD3FF", borderColor:"rgba(187,170,255,.55)", background:"rgba(139,114,255,.12)" }}>
        <Lightbulb size={16} aria-hidden="true"/>{sceneHints.length ? "Pedir otra pista" : "Pedir pista"}
      </button>
    );

    // ── Subtitles: speaker, line and relevant sounds, revealed in sync with the voice ──
    const staticCues: Cue[] = phase==="intro"
      ? [{ id:"si", kind:"speech", text:runMission.desc, speaker:SPEAKERS.narrator }]
      : phase==="choices"
        ? sentences(scene.dialogue).map((text,i)=>({ id:`choice-dialogue-${i}`, kind:"speech" as const, text, speaker:dlgSpeaker }))
      : phase==="result" && outcome ? [{ id:"sr", kind:"speech", text:outcome.head, speaker:SPEAKERS.narrator }]
      : [];
    const live = phaseCues.length > 0;
    const rows = (() => {
      const cues = live ? phaseCues : staticCues;
      return cues.map((c, i) => {
        const visible = !live || phase==="consequence" || phase==="chosen" || forceAllCaptions || instantText || scenePlayback === "complete"
          || (scenePlayback !== "idle" && i <= cueIdx);
        return { c, shown: c.text, visible, current: live && scenePlayback === "playing" && i === cueIdx };
      }).filter(r => r.visible);
    })();
    const currentSpeaker = scenePlayback === "playing" ? activeCueSpeaker : rows.filter(r=>r.c.kind==="speech").slice(-1)[0]?.c.speaker;
    const captions = (overlay: boolean) => (
      <section aria-label="Subtítulos" className={overlay ? "absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 max-h-[42%] overflow-y-auto" : "rounded-2xl px-4 py-3 border"}
        style={overlay ? { background:"rgba(5,9,28,.88)", border:"1px solid rgba(255,255,255,.18)" } : { background:"#070D26", borderColor:P.border }}>
        <p className="sr-only">{(live ? phaseCues : staticCues).map(c => c.kind==="sound" ? `[${c.text}]` : `${c.speaker?.name}: ${c.text}`).join(" ")}</p>
        <ul aria-hidden="true" className="space-y-1.5" data-testid="captions">
          {(overlay ? rows.slice(-3) : rows).map((r, i, arr) => {
            const prev = arr[i-1];
            const sameSpeaker = prev && prev.c.kind==="speech" && r.c.kind==="speech" && prev.c.speaker?.name===r.c.speaker?.name;
            if (r.c.kind === "sound") return (
              <li key={r.c.id} className="flex items-center gap-2 text-sm italic" style={{ color:"#FDE58A" }}><AudioLines size={14}/>[{r.c.text}]</li>
            );
            return (
              <li key={r.c.id} className="relative flex items-start gap-2.5 pl-3 py-0.5">
                <span aria-hidden="true" className="absolute left-0 top-1 bottom-1 w-1 rounded-full" style={{ background: r.current ? P.c3 : "transparent" }}/>
                {!sameSpeaker ? (r.c.speaker?.portrait==="other"
                  ? <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background:P.s3, color:P.text, boxShadow:`inset 0 0 0 2px ${P.muted}` }}>{r.c.speaker?.name.charAt(0)}</span>
                  : <Portrait who={(r.c.speaker?.portrait ?? "narrator") as any} size={28} avatar={avatar}/>) : <span className="w-7 flex-shrink-0"/>}
                <p className="text-[15px] leading-relaxed flex-1" style={{ color:"#F3F6FF" }}>
                  {!sameSpeaker && <span className="font-black mr-1.5" style={{ color: r.c.speaker?.voice==="orion"?P.v4:r.c.speaker?.voice==="teacher"?P.c4:r.c.speaker?.voice==="narrator"?"#C9D3F3":P.p4 }}>{r.c.speaker?.name}{r.c.speaker?.voice!=="narrator" && <span className="font-semibold text-xs" style={{ color:P.muted }}> · {r.c.speaker?.role}</span>}:</span>}
                  {r.shown}{r.current && !audioOn && <span className="inline-block w-0.5 h-4 bg-cyan-300 ml-0.5 align-middle animate-pulse"/>}
                </p>
              </li>
            );
          })}
          {rows.length===0 && <li className="text-sm" style={{ color:P.muted }}>…</li>}
        </ul>
      </section>
    );

    const toolBtn = (on: boolean) => on
      ? { background:"rgba(34,211,238,.16)", color:"#E9FDFF", borderColor:P.c3 }
      : { background:"rgba(255,255,255,.05)", color:P.text, borderColor:P.border };

    const lspPanel = lspOpen && (() => {
      const f = lspFragment;
      const line = f?.lines[Math.min(lspLine, (f?.lines.length ?? 1) - 1)];
      const aspect = f?.asset ? `${f.asset.width} / ${f.asset.height}` : lspLarge ? "4 / 3" : "3 / 2";
      const ctl = "w-8 h-8 rounded-lg border inline-flex items-center justify-center";
      const ctlStyle = { color:P.text, borderColor:P.border, background:"rgba(255,255,255,.06)" };
      return (
        <section id="lx-lsp-panel" role="region" aria-labelledby="lx-lsp-title" data-testid="lsp-panel"
          className="absolute top-2 right-2 z-20 flex max-h-[calc(100%-1rem)] flex-col overflow-y-auto rounded-xl border shadow-2xl"
          style={{ width:lspLarge ? "min(360px, calc(100% - 1rem))" : "min(230px, 62vw)", background:"#0A1230", borderColor:"rgba(255,255,255,.45)" }}>
          <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor:P.border }}>
            <h3 id="lx-lsp-title" ref={lspHeadingRef} tabIndex={-1} className="min-w-0 flex-1 truncate text-[10px] font-black" style={{ color:P.text }}>
              LSP · <span data-testid="lsp-speaker">{line?.speaker ?? "Narración"}</span>
            </h3>
            <span className="shrink-0 rounded-full px-1.5 py-1 text-[9px] font-black" style={lspValidated ? { background:"rgba(16,185,129,.18)", color:P.g4 } : { background:"rgba(245,197,66,.14)", color:"#FDE58A" }}>
              {lspValidated ? "Validado" : f?.status === "en_revision" ? "En revisión" : "Pendiente"}
            </span>
            <button type="button" onClick={()=>setLspLarge(v=>!v)} aria-pressed={lspLarge}
              className={ctl} style={ctlStyle} aria-label={lspLarge ? "Reducir panel LSP" : "Ampliar panel LSP"}>
              {lspLarge ? <Minimize2 size={14} aria-hidden="true"/> : <Maximize2 size={14} aria-hidden="true"/>}
            </button>
            <button type="button" onClick={closeLsp} className={ctl} style={ctlStyle} aria-label="Cerrar panel LSP (Esc)">
              <X size={14} aria-hidden="true"/>
            </button>
          </div>
          <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ aspectRatio:aspect, background:f?.asset ? "#000" : "#09132F" }}>
            {f && lspValidated && f.asset ? (
              <video ref={lspVideoRef} key={f.asset.src} src={f.asset.src} poster={f.asset.poster} playsInline muted preload="metadata"
                className="absolute inset-0 w-full h-full" style={{ objectFit:"contain" }}
                aria-label={`Interpretación en LSP: ${f.phaseLabel} de la etapa ${f.stage}`}
                onPlay={()=>setLspPlaying(true)} onPause={()=>setLspPlaying(false)} onEnded={()=>setLspPlaying(false)}
                onTimeUpdate={e=>{ const i = lineAtTime(f, (e.target as HTMLVideoElement).currentTime); if (i >= 0) setLspVideoLine(i); }}/>
            ) : f && line ? (
              <LspSpellingPreview key={`${f.id}-${lspLine}`} text={line.text} compact={!lspLarge} autoPlay={scenePlayback === "playing"}/>
            ) : (
              <div data-testid="lsp-pending" className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-3 text-center" style={{ background:"repeating-linear-gradient(135deg,#0E1638 0 14px,#111B42 14px 28px)" }}>
                <Hand size={lspLarge ? 28 : 20} style={{ color:"#FDE58A" }} aria-hidden="true"/>
                <p className="text-xs font-black" style={{ color:"#FDE58A" }}>Aún no hay una línea</p>
                <p className="text-[10px] leading-snug" style={{ color:"#E3E8FA" }}>{f ? `Etapa ${f.stage} · ${f.phaseLabel}` : "Esta pantalla no tiene diálogo."}</p>
              </div>
            )}
          </div>
          {lspLarge && f && line && <p className="px-2 py-1 text-[10px] leading-snug" style={{ color:"#E3E8FA" }} aria-live="polite" data-testid="lsp-line">
            Línea {Math.min(lspLine, f.lines.length - 1) + 1}: {line.text}
          </p>}
          {lspValidated && <div className="flex items-center gap-1 px-2 py-1.5 border-t" style={{ borderColor:P.border }}>
            <button type="button" onClick={()=>{ const v=lspVideoRef.current; if(!v) return; if (v.paused) v.play().catch(()=>{}); else v.pause(); }} className={ctl} style={ctlStyle}
              aria-label={lspPlaying ? "Pausar interpretación LSP" : "Reproducir interpretación LSP"}>
              {lspPlaying ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}
            </button>
            <button type="button" onClick={()=>{ const v=lspVideoRef.current; if(!v||!f) return; v.currentTime = f.lines[lspLine]?.start ?? 0; v.play().catch(()=>{}); }} className={ctl} style={ctlStyle}
              aria-label="Repetir la línea en LSP"><Repeat size={14} aria-hidden="true"/></button>
          </div>}
        </section>
      );
    })();

    return (
      <div className={immersive ? "fixed inset-0 z-[150] overflow-y-auto" : ""} style={immersive ? { background:P.bg } : undefined}
        role={immersive ? "dialog" : undefined} aria-modal={immersive || undefined} aria-label={immersive ? `Modo inmersivo: ${runMission.title}` : undefined}>
      <div className={immersive ? "max-w-[1680px] mx-auto px-4 py-4 lg:px-6" : ""}>
        <p className="sr-only" aria-live="polite">{`Etapa ${stage.n} de ${stage.total}: ${stage.label}. ${PHASE_LABEL[phase]}.`}</p>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {!immersive && <BackArrow onClick={()=>setAppScreen("skill", run?.worldId)} label="Salir de la misión (tu avance se conserva)"/>}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:P.c4 }}>{runWorld.name}</p>
              <h1 className="text-xl font-black" style={{ color:P.text }}>{runMission.title}</h1>
              <p className="mt-1 text-sm" style={{ color:P.muted }}>{scene.location}</p>
              <ol className="flex items-center gap-1.5 mt-2 flex-wrap" aria-label="Etapas de la misión">
                {script.stages.map((st,i)=>{
                  const state = i<stage.n-1 ? "completada" : i===stage.n-1 ? "actual" : "pendiente";
                  return (
                    <li key={st} className="flex items-center gap-1.5" aria-current={state==="actual"?"step":undefined}>
                      <span className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black" aria-hidden="true"
                        style={state==="completada"?{ background:P.g2, color:"#fff" }:state==="actual"?{ background:P.c3, color:"#05202A", boxShadow:`0 0 0 2px ${P.c4}` }:{ border:`1.5px solid ${P.muted}`, color:P.muted }}>
                        {state==="completada"?<Check size={12}/>:i+1}
                      </span>
                      <span className="text-xs" style={{ color:state==="actual"?P.text:P.muted, fontWeight:state==="actual"?700:500 }}>{st}<span className="sr-only"> ({state})</span></span>
                      {i<script.stages.length-1&&<span aria-hidden="true" className="w-4 h-px" style={{ background:P.muted }}/>}
                    </li>
                  );
                })}
              </ol>
              <p className="text-xs mt-1.5" style={{ color:P.muted }}>Etapa {stage.n} de {stage.total} · {stage.label} · {PHASE_LABEL[phase]}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto [&>button]:min-w-0 [&>button]:px-2 sm:[&>button]:px-3 [&>button]:justify-center">
            {immersive ? (
              <button ref={immersiveExitRef} type="button" onClick={closeImmersive} aria-keyshortcuts="Escape" className="min-h-11 flex items-center gap-1.5 rounded-full px-3 text-xs font-bold border" style={toolBtn(true)}>
                <Minimize2 size={14} aria-hidden="true"/><span className="sm:hidden">Salir</span><span className="hidden sm:inline">Salir del modo inmersivo (Esc)</span>
              </button>
            ) : (
              <button ref={immersiveBtnRef} type="button" aria-pressed={false} onClick={()=>setImmersive(true)} className="min-h-11 flex items-center gap-1.5 rounded-full px-3 text-xs font-bold border" style={toolBtn(false)}>
                <Maximize2 size={14} aria-hidden="true"/><span className="sm:hidden">Inmersivo</span><span className="hidden sm:inline">Modo inmersivo</span>
              </button>
            )}
            <button ref={lspToggleRef} type="button" aria-expanded={lspOpen} aria-controls="lx-lsp-panel" onClick={()=>{ if (lspOpen) closeLsp(); else setLspOpen(true); }}
              className="min-h-11 flex items-center gap-1.5 rounded-full px-3 text-xs font-bold border" style={toolBtn(lspOpen)}>
              <Hand size={14} aria-hidden="true"/>LSP
              {lspCoverage(script).validated === 0 && <span className="sr-only">· video pendiente para este caso</span>}
            </button>
            <button type="button" aria-pressed={audioOn} onClick={()=>{ setAudioOn(v=>!v); if (audioOn) stopVoicePlayback(); }}
              className="min-h-11 flex items-center gap-1.5 rounded-full px-3 text-xs font-bold border" style={toolBtn(audioOn)}>
              {audioOn?<Volume2 size={14} aria-hidden="true"/>:<VolumeX size={14} aria-hidden="true"/>}<span className="sm:hidden">Audio</span><span className="hidden sm:inline">Audio: {audioOn?"sí":"no"}</span>
            </button>
            <details className="relative">
              <summary className="list-none min-h-11 flex items-center gap-1.5 rounded-full px-3 text-xs font-bold border cursor-pointer"
                style={toolBtn(prefs.timer || instantText)}><Settings size={14} aria-hidden="true"/>Opciones</summary>
              <div className="absolute right-0 top-12 z-30 w-[min(320px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-2xl border p-3 space-y-2"
                style={{ background:P.s1, borderColor:P.border, boxShadow:SHADOW.card }}>
                <Toggle checked={prefs.timer} onChange={v=>setPrefs(p=>({...p,timer:v}))}
                  label="Temporizador de bonus" desc={prefs.timer?`${BONUS_SECONDS} s para ganar +${BONUS_XP} XP`:"Desactivado por defecto"} icon={prefs.timer?<Timer size={16}/>:<TimerOff size={16}/>}/>
                <Toggle checked={instantText} onChange={v=>{ if(!reducedMotion) setPrefs(p=>({...p,instantText:v})); }}
                  label="Mostrar texto al instante" desc={reducedMotion?"Activado por movimiento reducido":"Sin animación de aparición"} icon={<Type size={16}/>}/>
                <details className="rounded-xl border px-3" style={{ borderColor:P.border }}>
                  <summary className="min-h-11 py-2 cursor-pointer text-xs font-bold" style={{ color:P.c4 }}>Voces y accesibilidad</summary>
                  <p className="pb-2 text-xs leading-relaxed" style={{ color:P.muted }}>Los subtítulos siempre permanecen visibles. Audio usa las voces en español disponibles en el dispositivo y la audiodescripción narra la información visual importante. La voz de estudiante se aproxima con tono juvenil; no es una voz infantil grabada.</p>
                  <ul className="pb-3 space-y-2 text-xs" style={{ color:P.muted }}>
                    {([["orion","Orion · mago sabio","Las estrellas guardan sus secretos. Ven, pensemos con calma antes de decidir."],["student","Tú · voz de estudiante","Voy a elegir esta opción y explicar mi idea con claridad."],["teacher","Docente · voz adulta","Tómate tu tiempo. Escuchemos las ideas del grupo."],["teen-m","Compañero joven","¿Qué opinas? Podemos probar tu idea juntos."],["teen-f","Compañera joven","Te escucho. ¿Qué te gustaría proponer?"],["narrator","Narración y audiodescripción","La escena comienza en el salón. Tus compañeros esperan tu primera idea."]] as const).map(([role,label,sample])=>(
                      <li key={role} className="flex items-start gap-2">
                        <span className="flex-1 min-w-0"><strong style={{ color:P.text }}>{label}</strong> · {voiceStyle(role)} · {describeVoice(role)}</span>
                        <button type="button" onClick={()=>speakAs(role,sample)} disabled={!ttsSupported()} aria-label={`Probar voz: ${label}`}
                          className="w-11 h-11 rounded-lg border shrink-0 inline-flex items-center justify-center disabled:opacity-40" style={{ borderColor:P.border, color:P.c4 }}>
                          <Volume2 size={15} aria-hidden="true"/>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {(() => { const cov = lspCoverage(script); return (
                    <p className="pb-3 text-xs leading-relaxed" data-testid="lsp-coverage" style={{ color:P.muted }}>
                      LSP con video validado: {cov.validated} de {cov.total} fragmentos. Los pendientes muestran un apoyo visual de deletreo y conservan los subtítulos.
                    </p>
                  ); })()}
                </details>
              </div>
            </details>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* Scene (on mobile: on top; decisions below) */}
          <div key={run.sceneId} className={`${immersive ? "" : "lg:col-span-1"} flex flex-col gap-3 lx-stage-in min-w-0`}>
            <div className="relative rounded-2xl overflow-hidden border w-full"
              style={{ aspectRatio:"16 / 9", maxHeight: immersive ? "calc(100vh - 330px)" : undefined, borderColor:P.border, background:"#2C3870", boxShadow:SHADOW.card }}>
              <div role="img" aria-label={sceneDesc} className="absolute inset-0">
                {setting
                  ? <MissionSetting setting={setting.setting} props={setting.props} avatar={avatar} speaker={settingSpeaker} crowd={crowd} orion={orionState !== "hidden"} speaking={settingSpeaking}/>
                  : <ClassroomScene mood={mood} board={scene.board} crowd={crowd} avatar={avatar} speaking={speakingInScene} orion={orionState}/>}
              </div>
              <div className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold" style={{ background:"rgba(5,9,28,.88)", color:"#E9FDFF", border:`1px solid ${P.c3}` }} aria-hidden="true">Etapa {stage.n} de {stage.total} · {stage.label}</div>
              {(phase === "intro" || phase === "narrate" || phase === "dialogue" || phase === "consequence" || phase === "chosen" || (phase === "choices" && !decisionDialogOpen)) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {phase === "choices" && !decisionDialogOpen && (
                    <button ref={decisionTriggerRef} type="button" onClick={()=>setDecisionDialogOpen(true)} aria-haspopup="dialog"
                      className="pointer-events-auto min-h-14 rounded-2xl px-7 py-4 text-lg font-black text-white inline-flex items-center gap-2"
                      style={{ background:g(P.v2,P.v1), boxShadow:"0 10px 34px rgba(42,22,130,.65)" }}>
                      <Play size={21} aria-hidden="true"/>Elegir respuesta
                    </button>
                  )}
                  {scenePlayback === "idle" && (
                    <button type="button" onClick={phase==="consequence" || phase==="chosen" ? startResponsePlayback : startScenePlayback} aria-label={phase==="consequence" || phase==="chosen" ? `Escuchar ${phase==="consequence" ? "la consecuencia" : "la reacción"}` : `Iniciar escena: ${stage.label}`}
                      className="pointer-events-auto min-h-14 rounded-2xl px-7 py-4 text-lg font-black text-white inline-flex items-center gap-2"
                      style={{ background:g(P.v2,P.v1), boxShadow:"0 10px 34px rgba(42,22,130,.65)" }}>
                      {phase==="consequence" || phase==="chosen" ? <Volume2 size={21} aria-hidden="true"/> : <Play size={21} aria-hidden="true"/>}
                      {phase==="consequence" ? "Escuchar consecuencia" : phase==="chosen" ? "Escuchar reacción" : "Iniciar escena"}
                    </button>
                  )}
                  {scenePlayback === "complete" && (phase === "consequence" || phase === "chosen") && (
                    <button type="button" onClick={startResponsePlayback} aria-label="Repetir respuesta"
                      className="pointer-events-auto min-h-12 rounded-xl px-6 py-3 font-black text-white inline-flex items-center gap-2"
                      style={{ background:g(P.g2,P.g1), boxShadow:"0 8px 24px rgba(5,150,105,.4)" }}>
                      <Repeat size={18} aria-hidden="true"/>Repetir respuesta
                    </button>
                  )}
                </div>
              )}
              {lspPanel}
            </div>

            {/* El panel LSP flota en una esquina de la escena; los subtítulos conservan su ancho completo. */}
            <div className="flex flex-col gap-3">
              <div className="flex-1 min-w-0 w-full">
                {(live || staticCues.length > 0) && captions(false)}
                {phase === "choices" && (scene.narration || scene.dialogue) && (
                  <details className="rounded-xl border px-4" style={{ background:P.s1, borderColor:P.border }}>
                    <summary className="min-h-11 py-2.5 cursor-pointer text-sm font-semibold" style={{ color:P.c4 }}>Recordar la escena</summary>
                    <div className="space-y-2 pb-4 text-sm leading-relaxed" style={{ color:P.text }}>
                      {scene.narration && <p>{scene.narration}</p>}
                      {scene.dialogue && <p><strong>{dlgSpeaker.name}:</strong> {scene.dialogue}</p>}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Voice controls */}
            <div className="flex flex-wrap items-center gap-2">
              {(scenePlayback === "playing" || scenePlayback === "paused") && (
                <button type="button" onClick={toggleScenePlayback} className={btnGhost} style={ghostStyle}
                  aria-label={scenePlayback === "playing" ? "Pausar audio de la escena" : "Reanudar audio de la escena"}>
                  {scenePlayback === "playing" ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}
                  {scenePlayback === "playing" ? "Pausar" : "Reanudar"}
                </button>
              )}
              <button type="button" onClick={()=>{ setCueIdx(0); setScenePlayback("playing"); if (!audioOn) setAudioOn(true); else setTtsNonce(n=>n+1); }} disabled={!live} className={btnGhost} style={ghostStyle}>
                <Repeat size={15} aria-hidden="true"/>Repetir audio
              </button>
              {live && !twDone && <button type="button" onClick={twSkip} className={btnGhost} style={ghostStyle}><Type size={14} aria-hidden="true"/>Mostrar texto completo</button>}
              <p className="text-xs ml-auto" style={{ color:P.muted }} aria-live="polite">
                {audioOn ? (audioPlaying && currentSpeaker ? `Habla: ${currentSpeaker.name} (${currentSpeaker.role})` : "Voz activada") : "Voz silenciada · subtítulos activos"}
              </p>
            </div>
          </div>

          {/* Decision dialog and follow-up feedback */}
          {((phase==="choices" && decisionDialogOpen) || phase==="consequence" || phase==="chosen" || phase==="result") && (
          <div ref={phase==="choices" ? decisionDialogRef : undefined}
            role={phase==="choices" ? "dialog" : undefined}
            aria-modal={phase==="choices" ? true : undefined}
            aria-label={phase==="choices" ? "Elige qué hacer en esta situación" : undefined}
            className={phase==="choices" ? "fixed inset-0 z-[180] flex items-center justify-center p-4 bg-[#05091c]/80 backdrop-blur-sm" : "w-full max-w-3xl mx-auto min-w-0"}>
          <div className={phase==="choices" ? "w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-4 sm:p-5 shadow-2xl" : "space-y-3"}
            style={phase==="choices" ? { background:"#0A1230", borderColor:"rgba(187,170,255,.45)" } : undefined}>
            <div key={`${run.sceneId}-${phase}`} className="lx-fade space-y-3">
              {phase==="choices" && (<>
                {card(<>
                  {heading("Tu decisión", <button type="button" onClick={closeDecisionDialog} aria-label="Cerrar opciones y volver a la escena"
                    className="w-11 h-11 rounded-lg border inline-flex items-center justify-center" style={{ color:P.text, borderColor:P.border }}><X size={17} aria-hidden="true"/></button>)}
                  <div className="rounded-xl p-3 border" style={{ background:"rgba(139,92,246,.08)", borderColor:"rgba(167,139,250,.35)" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#DDD6FE" }}>Consigna</p>
                    <p className="text-sm leading-relaxed" style={{ color:P.text }}>{scene.consigna}</p>
                  </div>
                  {!lspValidated && lspFragment?.lines[0] && (
                    <details className="rounded-xl border px-3" style={{ borderColor:"rgba(103,232,249,.35)" }}>
                      <summary className="min-h-11 py-2 cursor-pointer text-xs font-bold" style={{ color:P.c4 }}>Ver apoyo visual de deletreo</summary>
                      <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio:"16 / 9", maxHeight:240 }}>
                        <LspSpellingPreview key={`${lspFragment.id}-choice`} text={lspFragment.lines[0].text}/>
                      </div>
                      <p className="py-2 text-[11px] leading-relaxed" style={{ color:P.muted }}>Este prototipo muestra letras del subtítulo; no traduce la oración a LSP.</p>
                    </details>
                  )}
                  {prefs.timer ? (
                    <p className="text-sm flex items-center gap-2" style={{ color:"#FDE68A" }}>
                      <Timer size={15} aria-hidden="true"/>
                      {timerLeft>0
                        ? <span>Bonus disponible: <strong>{timerLeft} s</strong> para +{BONUS_XP} XP{run.orionOpen ? " · en pausa mientras Orion te da una pista" : ""}</span>
                        : <span>El bonus de esta etapa terminó. Tómate tu tiempo.</span>}
                    </p>
                  ) : (
                    <p className="text-xs flex items-center gap-2" style={{ color:P.muted }}><TimerOff size={14} aria-hidden="true"/>Sin temporizador · tómate el tiempo que necesites</p>
                  )}
                </>)}
                <div role="group" aria-labelledby="lx-choices-label">
                  <p id="lx-choices-label" className="text-xs font-bold uppercase tracking-widest px-1 mb-2" style={{ color:P.muted }}>¿Qué haces? <span className="normal-case tracking-normal font-medium">· también con las teclas 1 a {scene.choices.length}</span></p>
                  <div className="space-y-2">
                    {scene.choices.map((c, idx)=>{
                      const tried = triedNegative.has(c.id);
                      return (
                        <button key={c.id} type="button" onClick={()=>chooseOption(c)} aria-keyshortcuts={String(idx+1)}
                          className="lx-choice w-full min-h-11 rounded-xl p-3 flex items-start gap-3 border text-left transition-all"
                          style={{ background:P.s1, borderColor: tried?"rgba(252,165,165,.45)":P.border }}>
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background:"rgba(255,255,255,.1)", color:P.text }} aria-hidden="true">{idx+1}</span>
                          <span className="text-lg leading-7" aria-hidden="true">{c.emoji}</span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm leading-snug" style={{ color:P.text }}>{c.text}</span>
                            {tried && <span className="flex items-center gap-1 text-xs mt-1" style={{ color:P.r4 }}><RotateCcw size={11} aria-hidden="true"/>Ya probaste esta opción</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {hintButton}
              </>)}

              {phase==="consequence" && run.lastChoice && card(<>
                {heading(<><AlertTriangle size={18} style={{ color:P.r4 }} aria-hidden="true"/>Consecuencia de tu decisión</>)}
                <p className="text-xs" style={{ color:P.muted }}>Elegiste: «{run.lastChoice.text}»</p>
                <div className="flex gap-3 items-start rounded-xl p-3 border" style={{ background:"rgba(139,92,246,.08)", borderColor:"rgba(167,139,250,.35)" }}>
                  <OrionFace pulse={orionPulse}/>
                  <div className="flex-1">
                    <p className="text-xs font-bold mb-0.5" style={{ color:"#DDD6FE" }}>Orion tiene una pista para ti</p>
                    <p className="text-sm leading-relaxed" style={{ color:"rgba(240,246,255,.92)" }}>Puedo ayudarte a entender la consecuencia y reconsiderar tu decisión.</p>
                  </div>
                </div>
                {negHere.length>=2 && <p className="text-xs" style={{ color:"#FDE68A" }}>Llevas {negHere.length} intentos en esta etapa. Una pista o pedir apoyo puede ayudarte.</p>}
                <div className="grid gap-2">
                  <button type="button" onClick={()=>patchRun({ phase:"choices" })} className={`${btnPrimary} w-full`} style={primaryStyle}><RotateCcw size={15} aria-hidden="true"/>Reconsiderar mi decisión</button>
                  {hintButton}
                  <button type="button" onClick={() => patchRun({ phase:scene.narration ? "narrate" : scene.dialogue ? "dialogue" : "choices", orionOpen:false })} className={`${btnGhost} w-full`} style={ghostStyle}>Reintentar la etapa desde el inicio</button>
                </div>
              </>, "rgba(252,165,165,.45)")}

              {phase==="chosen" && run.lastChoice && card(<>
                {heading(<><CheckCircle size={18} style={{ color:P.g4 }} aria-hidden="true"/>{run.lastChoice.quality==="good"?"Buena decisión":"Decisión aceptable"}</>)}
                <p className="text-sm leading-relaxed" style={{ color:"rgba(240,246,255,.9)" }}>{run.lastChoice.quality==="good"?"Tu decisión ayuda a cumplir la consigna.":"Avanzas, aunque había una forma más efectiva de cumplir la consigna."}</p>
                <p className="text-xs" style={{ color:P.muted }}>Elegiste: «{run.lastChoice.text}»</p>
                {run.lastBonus>0 && <p className="text-xs font-bold inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background:"rgba(245,158,11,.16)", color:"#FDE68A" }}><Zap size={12} aria-hidden="true"/>+{run.lastBonus} XP de bonus por decidir en menos de {BONUS_SECONDS} s</p>}
                {scenePlayback === "complete" && run.lastChoice.next && <p role="status" className="text-xs text-center" style={{ color:P.muted }}>
                  {nextScene ? "Avanzando automáticamente a la siguiente etapa…" : "Preparando el resultado…"}
                </p>}
              </>, "rgba(52,211,153,.4)")}

              {phase==="result" && outcome && (<>
                {card(<>
                  {heading(<><span aria-hidden="true">{outcome.emoji}</span>{outcome.head}</>)}
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span style={{ color:P.muted }}>Puntuación</span><span className="font-black" style={{ color:P.g4 }}>{computeScore(outcome.score, run.decisions)}/100</span></div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.1)" }} aria-hidden="true"><div className="h-full rounded-full" style={{ width:`${computeScore(outcome.score, run.decisions)}%`, background:g(P.v3,P.g3,"90deg") }}/></div>
                    <p className="text-xs mt-1.5" style={{ color:P.muted }}>{run.decisions.filter(d=>d.quality==="negative").length} decisiones reconsideradas · {run.hints.length} pistas usadas</p>
                  </div>
                  <div className="rounded-lg p-2.5 border" style={{ background:"rgba(16,185,129,.08)",borderColor:"rgba(52,211,153,.3)" }}>
                    <p className="text-xs font-bold mb-0.5" style={{ color:P.g4 }}>💪 Fortaleza</p>
                    <p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.85)" }}>{outcome.strength}</p>
                  </div>
                  <div className="rounded-lg p-2.5 border" style={{ background:"rgba(245,158,11,.08)",borderColor:"rgba(252,211,77,.3)" }}>
                    <p className="text-xs font-bold mb-0.5" style={{ color:"#FDE68A" }}>🎯 A mejorar</p>
                    <p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.85)" }}>{outcome.improve}</p>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color:P.muted }}>Habilidades ganadas</p>
                  {Object.entries((outcome.gains||{}) as Record<string,number>).map(([s,gv])=>(
                    <Skill key={s} label={s} value={Math.min(gv*4.5,100)} gain={gv} color={P.v4}/>
                  ))}
                  <p className="text-xs" style={{ color:P.muted }}>Recompensa: +{preview.baseXP} XP de la misión{preview.bonusXP>0?` + ${preview.bonusXP} XP de bonus`:""} · +{preview.coins} monedas</p>
                </>)}
                <button type="button" onClick={completeMission} className={`${btnPrimary} w-full py-4 text-base`} style={{ background:g(P.g1,P.g2), boxShadow:`0 6px 20px rgba(16,185,129,.3)` }}>
                  <Check size={18} aria-hidden="true"/>Completar misión · +{preview.xp} XP
                </button>
              </>)}
            </div>

            {/* Orion contextual help */}
            {run.orionOpen && lastHint && (phase==="choices" || phase==="consequence") && (
              <section aria-labelledby="lx-orion-title" className="rounded-2xl p-4 border lx-fade" style={{ background:"linear-gradient(135deg,#0A1220,#151F48)", borderColor:"rgba(167,139,250,.5)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <OrionFace pulse={orionPulse}/>
                  <div className="flex-1 min-w-0">
                    <h3 id="lx-orion-title" className="text-sm font-bold" style={{ color:"#DDD6FE" }}>Orion</h3>
                    <p className="text-[11px]" style={{ color:P.muted }}>Pistas del prototipo · lógica contextual, sin IA</p>
                  </div>
                  <button type="button" aria-label="Cerrar la pista" onClick={() => { stopVoicePlayback(); patchRun({ orionOpen:false }); hintButtonRef.current?.focus(); }} className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color:P.text }}><X size={16}/></button>
                </div>
                <div aria-live="polite" data-testid="orion-hint">
                  {lastHint.kind!=="fallback" && <p className="text-xs font-bold mb-1" style={{ color:P.c4 }}>Pista {specificHints} de esta etapa · Enfoque: {lastHint.focusLabel}{lastHint.changedFocus?" (nuevo enfoque)":""}</p>}
                  <p className="text-sm font-semibold" style={{ color:P.text }}>{lastHint.intro}</p>
                  <p className="text-sm leading-relaxed mt-1" style={{ color:"rgba(240,246,255,.92)" }}>{lastHint.text}</p>
                </div>
                {(lastHint.kind==="fallback" || run.reread) && (
                  <div className="rounded-xl p-3 border mt-3" style={{ background:"rgba(139,92,246,.08)", borderColor:"rgba(167,139,250,.35)" }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#DDD6FE" }}>Consigna</p>
                    <p className="text-sm leading-relaxed" style={{ color:P.text }}>{scene.consigna}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {ttsSupported() && <button type="button" onClick={() => speakAs("orion", `${lastHint.intro} ${lastHint.text}`, SPEAKERS.orion)} className={btnGhost} style={ghostStyle}><Volume2 size={14} aria-hidden="true"/>Escuchar respuesta</button>}
                  {lastHint.kind!=="fallback" && <button type="button" onClick={() => requestHint()} className={btnGhost} style={ghostStyle}><Lightbulb size={14} aria-hidden="true"/>Otra pista</button>}
                  {!run.reread && lastHint.kind!=="fallback" && <button type="button" onClick={()=>patchRun({ reread:true })} className={btnGhost} style={ghostStyle}><BookOpen size={14} aria-hidden="true"/>Releer consigna</button>}
                  {(lastHint.kind==="fallback" || negHere.length>=2) && <button type="button" onClick={()=>patchRun({ supportRequested:true })} className={btnGhost} style={ghostStyle}><LifeBuoy size={14} aria-hidden="true"/>Pedir apoyo</button>}
                </div>
                {run.supportRequested && (
                  <div role="status" className="mt-3 rounded-xl p-3 border" style={{ background:"rgba(252,211,77,.08)", borderColor:"rgba(252,211,77,.45)" }}>
                    <p className="text-sm font-bold" style={{ color:"#FCD34D" }}>Demostración: este aviso no se envía</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color:"rgba(240,246,255,.88)" }}>En este prototipo, «Pedir apoyo» no notifica a tu docente ni guarda la solicitud. En clase, levanta la mano o pídele ayuda directamente.</p>
                  </div>
                )}
                {sceneHints.length>1 && (
                  <details className="mt-3">
                    <summary className="text-xs cursor-pointer py-1" style={{ color:P.muted }}>Pistas anteriores de esta etapa ({sceneHints.length-1})</summary>
                    <ul className="mt-2 space-y-1.5">
                      {sceneHints.slice(0,-1).map(h=>(
                        <li key={h.id} className="text-xs leading-relaxed" style={{ color:P.muted }}><strong style={{ color:P.text }}>{h.focusLabel ?? "Sin pista específica"}:</strong> {h.text}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}
          </div>
          </div>
          )}
        </div>
      </div>
      </div>
    );
  }

