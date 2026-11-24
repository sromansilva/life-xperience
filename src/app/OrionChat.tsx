import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Mic,
  MicOff,
  MessageCircle,
  Pause,
  Play,
  Repeat,
  Send,
  ShieldCheck,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { OrionFigure } from "./art/characters";
import { pickVoice, stopVoicePlayback, ttsSupported } from "./lib/voices";
import { P, g, SHADOW } from "./theme";

interface Recognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export interface OrionMissionContext {
  missionTitle: string;
  worldName: string;
  stage: string;
  instruction: string;
  lastDecision?: string;
  consequence?: string;
  attempts: number;
  hintsUsed: number;
}

export interface OrionChatMessage {
  id: number;
  role: "student" | "orion";
  text: string;
  usedMissionContext?: boolean;
}

interface Props {
  studentName: string;
  messages: OrionChatMessage[];
  onMessagesChange: (messages: OrionChatMessage[]) => void;
  missionContext: OrionMissionContext | null;
  compact?: boolean;
  onClose?: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "No se concedió permiso para usar el micrófono. Puedes continuar escribiendo tu mensaje.",
  "service-not-allowed": "El reconocimiento de voz no está disponible en esta vista. Puedes continuar escribiendo.",
  "audio-capture": "El navegador no pudo acceder a una entrada de micrófono. Abre LifeXperience en Chrome, Edge o Brave desde http://localhost:8443 y permite el acceso. Si persiste, revisa en Windows Configuración > Privacidad y seguridad > Micrófono que el acceso esté habilitado.",
  "no-speech": "No se reconoció ninguna voz. Intenta de nuevo o escribe tu mensaje.",
  aborted: "La grabación se canceló. El texto que ya tenías sigue disponible.",
  network: "El servicio de reconocimiento del navegador no respondió. Puedes continuar por texto.",
};

function answerGeneralQuestion(question: string, name: string, context: OrionMissionContext | null): string {
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const prefix = context
    ? `Tomando como referencia «${context.missionTitle}», en la etapa ${context.stage.toLowerCase()}: `
    : "";

  if (/(hacerme dano|suicid|no quiero vivir|lastimarme|matarme)/.test(q)) {
    return `${name}, esto es importante y no tienes que manejarlo solo. Busca ahora a una persona adulta de confianza, a tu docente, orientador o familiar. Si hay peligro inmediato, llama al servicio de emergencias de tu país. Yo puedo acompañarte con palabras, pero no reemplazo la ayuda de una persona.`;
  }
  if (/(respuesta correcta|cual opcion|dime que elijo|resuelveme|hazlo por mi)/.test(q) && context) {
    return `${prefix}no elegiré por ti. Relee el objetivo: ${context.instruction} Piensa qué alternativa cuida mejor a las personas involucradas y te acerca a ese objetivo.`;
  }
  if (/(nervios|ansiedad|miedo|me bloqueo|calmarme)/.test(q)) {
    return `${prefix}prueba una pausa breve: apoya los pies, inhala durante cuatro segundos y exhala durante seis. Luego decide cuál es la primera acción pequeña que sí puedes controlar.`;
  }
  if (/(comunicar|hablar|exponer|presentacion|decir una idea)/.test(q)) {
    return `${prefix}organiza tu mensaje en tres partes: una idea principal, un ejemplo cercano y una frase final que invite a pensar o actuar. Habla mirando a las personas, no a tus notas.`;
  }
  if (/(conflicto|pelea|discut|enojo|molesto)/.test(q)) {
    return `${prefix}antes de responder, describe lo ocurrido sin acusar, explica cómo te afecta y pregunta qué necesita la otra persona. Escuchar no significa estar de acuerdo; significa comprender antes de decidir.`;
  }
  if (/(dinero|ahorro|gasto|presupuesto)/.test(q)) {
    return `${prefix}separa primero necesidades, deseos y ahorro. Decide una cantidad pequeña para tu meta antes de gastar el resto y revisa qué gasto podrías reducir sin afectar una necesidad.`;
  }
  if (/(tiempo|organizar|tareas|procrastin)/.test(q)) {
    return `${prefix}elige una tarea importante y conviértela en un paso de diez minutos. Empieza por ese paso, elimina una distracción y revisa después qué sigue.`;
  }
  if (/(equipo|grupo|companero|colaborar)/.test(q)) {
    return `${prefix}aclaren primero la meta y luego asignen responsabilidades concretas según las fortalezas de cada persona. Acuerden cuándo compartirán avances para detectar problemas a tiempo.`;
  }
  if (/(que hago|por donde empiezo|ayudame|consejo|orienta)/.test(q)) {
    if (context) {
      const attempt = context.attempts > 0
        ? ` Ya hiciste ${context.attempts} ${context.attempts === 1 ? "intento" : "intentos"}; cambia de enfoque en vez de repetir exactamente lo mismo.`
        : "";
      return `${prefix}resume con tus palabras qué se pide: ${context.instruction}${attempt} Luego compara tus opciones por sus consecuencias, no solo por lo fáciles que parecen.`;
    }
    return "Cuéntame cuál es la situación, qué resultado quieres conseguir y qué opciones tienes. Con esos tres datos puedo ayudarte a ordenar el problema sin decidir por ti.";
  }
  if (/(hola|buenos dias|buenas tardes|como estas)/.test(q)) {
    return `Hola, ${name}. Estoy listo para conversar sobre comunicación, emociones, decisiones, dinero, trabajo en equipo u otra habilidad para la vida. ¿Qué te gustaría practicar?`;
  }
  return context
    ? `${prefix}piensa en el objetivo «${context.instruction}». ¿Qué consecuencia concreta tendría cada opción para ti y para las otras personas? Si me cuentas qué parte te cuesta, puedo orientarte mejor.`
    : "Puedo ayudarte a ordenar una situación de la vida diaria. Cuéntame qué ocurrió, qué quieres lograr y qué alternativas estás considerando.";
}

export function OrionChat({ studentName, messages, onMessagesChange, missionContext, compact = false, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [useMission, setUseMission] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [micState, setMicState] = useState<"idle" | "listening" | "stopping">("idle");
  const [transcriptionState, setTranscriptionState] = useState<"idle" | "recording" | "processing" | "ready" | "error">("idle");
  const [micStatus, setMicStatus] = useState("");
  const [interim, setInterim] = useState("");
  const [audioMessageId, setAudioMessageId] = useState<number | null>(null);
  const [audioPaused, setAudioPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEnd = useRef<HTMLDivElement>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const privacyContinueRef = useRef<HTMLButtonElement>(null);
  const privacyDialogRef = useRef<HTMLDivElement>(null);

  const browser = typeof window === "undefined" ? null : window as RecognitionWindow;
  const Recognizer = browser?.isSecureContext ? browser.SpeechRecognition ?? browser.webkitSpeechRecognition : undefined;
  const micSupported = !!Recognizer;
  const activeContext = useMission ? missionContext : null;

  useEffect(() => {
    historyEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  useEffect(() => () => {
    recognition.current?.abort();
    recognition.current = null;
    stopVoicePlayback();
    if (ttsSupported()) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (!missionContext && useMission) setUseMission(false);
  }, [missionContext, useMission]);

  useEffect(() => {
    if (!privacyOpen) return;
    const t = setTimeout(() => privacyContinueRef.current?.focus(), 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setPrivacyOpen(false);
        inputRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusable = [...(privacyDialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? [])];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [privacyOpen]);

  useEffect(() => {
    if (!compact) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || privacyOpen) return;
      event.preventDefault();
      onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [compact, privacyOpen, onClose]);

  function beginRecognition() {
    if (!Recognizer || recognition.current) return;
    stopResponseAudio();
    const input = new Recognizer();
    recognition.current = input;
    input.lang = "es-PE";
    input.interimResults = true;
    input.continuous = true;
    let finalText = "";
    input.onresult = event => {
      if (recognition.current !== input) return;
      const results = Array.from(event.results);
      finalText = results.filter(r => r.isFinal).map(r => r[0].transcript).join(" ").trim().slice(0, 800);
      const live = results.filter(r => !r.isFinal).map(r => r[0].transcript).join(" ").trim();
      setDraft(finalText);
      setInterim(live);
    };
    input.onerror = event => {
      if (recognition.current !== input) return;
      recognition.current = null;
      setMicState("idle");
      setTranscriptionState("error");
      setInterim("");
      setMicStatus(ERROR_MESSAGES[event.error] ?? "No se pudo reconocer la voz. Puedes intentar de nuevo o escribir.");
      inputRef.current?.focus();
    };
    input.onend = () => {
      if (recognition.current !== input) return;
      recognition.current = null;
      setMicState("idle");
      setInterim("");
      if (finalText) {
        setTranscriptionState("ready");
        setMicStatus("Transcripción lista. Revísala y corrígela antes de enviarla.");
      } else {
        setTranscriptionState("error");
        setMicStatus("No se reconoció voz. Puedes intentarlo de nuevo o escribir el mensaje.");
      }
      inputRef.current?.focus();
    };
    try {
      // Recognition starts only here, after the student's explicit action.
      input.start();
      setMicState("listening");
      setTranscriptionState("recording");
      setMicStatus("Micrófono activo. Habla ahora y pulsa Detener al terminar.");
      setInterim("");
    } catch {
      recognition.current = null;
      setMicState("idle");
      setTranscriptionState("error");
      setMicStatus("No se pudo iniciar el micrófono. Puedes continuar escribiendo.");
    }
  }

  function requestRecording() {
    if (!micSupported) {
      setMicStatus("El reconocimiento de voz no está disponible en este navegador o vista. Escribe tu mensaje y pulsa Enviar.");
      setTranscriptionState("error");
      inputRef.current?.focus();
      return;
    }
    if (!privacyAccepted) {
      setPrivacyOpen(true);
      return;
    }
    beginRecognition();
  }

  function stopRecording() {
    if (!recognition.current || micState !== "listening") return;
    setMicState("stopping");
    setTranscriptionState("processing");
    setMicStatus("Preparando la transcripción…");
    try { recognition.current.stop(); }
    catch { cancelRecording(false); }
  }

  function cancelRecording(clearTranscript: boolean) {
    const active = recognition.current;
    recognition.current = null;
    active?.abort();
    setMicState("idle");
    setTranscriptionState("idle");
    setInterim("");
    if (clearTranscript) setDraft("");
    setMicStatus("Grabación cancelada. No se guardó audio.");
    inputRef.current?.focus();
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || micState !== "idle") return;
    const id = Date.now();
    const student: OrionChatMessage = { id, role: "student", text, usedMissionContext: !!activeContext };
    const reply: OrionChatMessage = {
      id: id + 1,
      role: "orion",
      text: answerGeneralQuestion(text, studentName, activeContext),
      usedMissionContext: !!activeContext,
    };
    onMessagesChange([...messages, student, reply]);
    setDraft("");
    setInterim("");
    setMicStatus("");
    setTranscriptionState("idle");
  }

  function stopResponseAudio() {
    if (ttsSupported()) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }
    utterance.current = null;
    setAudioMessageId(null);
    setAudioPaused(false);
  }

  function listen(message: OrionChatMessage) {
    if (!ttsSupported()) return;
    stopResponseAudio();
    setMuted(false);
    const u = new SpeechSynthesisUtterance(message.text);
    const profile = pickVoice("orion");
    u.lang = profile.voice?.lang ?? "es-PE";
    if (profile.voice) u.voice = profile.voice;
    u.pitch = profile.pitch;
    u.rate = profile.rate;
    u.onend = () => {
      if (utterance.current === u) {
        utterance.current = null;
        setAudioMessageId(null);
        setAudioPaused(false);
      }
    };
    u.onerror = () => {
      if (utterance.current === u) {
        utterance.current = null;
        setAudioMessageId(null);
        setAudioPaused(false);
        setMicStatus("No se pudo reproducir la voz. La respuesta escrita sigue disponible.");
      }
    };
    utterance.current = u;
    setAudioMessageId(message.id);
    setAudioPaused(false);
    try { window.speechSynthesis.speak(u); }
    catch {
      stopResponseAudio();
      setMicStatus("No se pudo reproducir la voz. La respuesta escrita sigue disponible.");
    }
  }

  function pauseResponse() {
    if (!ttsSupported() || audioMessageId === null) return;
    if (audioPaused) {
      window.speechSynthesis.resume();
      setAudioPaused(false);
    } else {
      window.speechSynthesis.pause();
      setAudioPaused(true);
    }
  }

  const control = "min-h-11 rounded-xl border px-3 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed";
  const micBusy = micState !== "idle";
  const transcriptionLabel = {
    idle: "Listo para escribir o grabar",
    recording: "Grabando",
    processing: "Procesando",
    ready: "Listo para revisar",
    error: "Error de transcripción",
  }[transcriptionState];
  const transcriptionColor = transcriptionState === "recording" ? P.r4
    : transcriptionState === "processing" ? P.a4
    : transcriptionState === "ready" ? P.g4
    : transcriptionState === "error" ? P.r4 : P.muted;
  const initial = messages.length === 0;
  const contextSummary = useMemo(() => missionContext ? [
    `Misión: ${missionContext.missionTitle} (${missionContext.worldName})`,
    `Etapa: ${missionContext.stage}`,
    `Consigna: ${missionContext.instruction}`,
    missionContext.lastDecision ? `Última decisión: ${missionContext.lastDecision}` : null,
    missionContext.consequence ? `Consecuencia visible: ${missionContext.consequence}` : null,
    `Intentos: ${missionContext.attempts}; pistas usadas: ${missionContext.hintsUsed}`,
  ].filter(Boolean) : [], [missionContext]);

  return (
    <div className={compact ? "h-full min-h-0" : "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 min-h-[650px]"}>
      <section aria-labelledby="orion-chat-title" className={compact ? "rounded-2xl border flex flex-col h-full min-h-0 overflow-hidden" : "rounded-3xl border flex flex-col min-h-[620px] overflow-hidden"}
        style={{ background:P.s1, borderColor:P.border, boxShadow:SHADOW.card }}>
        <header className={`flex items-center gap-3 ${compact ? "px-3 py-2.5" : "px-4 sm:px-6 py-4"} border-b`} style={{ borderColor:P.border, background:"linear-gradient(90deg,#171E54,#111C42)" }}>
          <span className={`${compact ? "w-10 h-10" : "w-14 h-14"} rounded-2xl flex items-end justify-center overflow-hidden flex-shrink-0`} style={{ background:"linear-gradient(160deg,#2E2A7A,#17205A)" }}>
            <OrionFigure variant="bust" size={compact ? 42 : 56}/>
          </span>
          <div className="min-w-0">
            <h1 id="orion-chat-title" className={`${compact ? "text-base" : "text-xl"} font-black`} style={{ color:P.text }}>{compact ? "Orion" : "Conversar con Orion"}</h1>
            <p className="text-xs" style={{ color:P.muted }}>{compact ? "Asistente para conversar" : "Orientación general para habilidades de la vida · conversación local del prototipo"}</p>
          </div>
          {compact && onClose && <button type="button" onClick={onClose} aria-label="Cerrar asistente de Orion" className="ml-auto w-11 h-11 rounded-xl border inline-flex items-center justify-center" style={{ borderColor:P.border, color:P.text }}><X size={18} aria-hidden="true"/></button>}
        </header>

        {compact && missionContext && (
          <label htmlFor="orion-context-compact" className="flex items-start gap-2 px-3 py-2 border-b text-xs font-semibold" style={{ borderColor:P.border, background:"#0E1739", color:P.text }}>
            <input id="orion-context-compact" type="checkbox" checked={useMission} onChange={event => setUseMission(event.target.checked)} className="mt-0.5 w-4 h-4"/>
            <span>Permitir a Orion usar el caso actual <span className="font-normal" style={{ color:P.muted }}>· {missionContext.missionTitle} · {missionContext.stage}</span></span>
          </label>
        )}

        <div className={`flex-1 min-h-0 overflow-y-auto ${compact ? "px-3 py-3" : "px-4 sm:px-6 py-5"} space-y-4`} aria-live="polite" data-testid="orion-chat-history">
          {initial && (
            <div className="max-w-xl rounded-2xl p-4 border" style={{ background:"rgba(139,114,255,.08)", borderColor:"rgba(187,170,255,.3)" }}>
              <p className="font-bold" style={{ color:P.v4 }}>Hola, {studentName}</p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color:"#E3E8FA" }}>Podemos conversar sobre comunicación, emociones, decisiones, dinero, trabajo en equipo u otra habilidad para la vida. Puedes escribir o usar el micrófono si está disponible.</p>
            </div>
          )}
          {messages.map(message => (
            <article key={message.id} className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[88%] sm:max-w-[76%] rounded-2xl px-4 py-3 border"
                style={message.role === "student"
                  ? { background:g(P.v2,P.v1), borderColor:P.v3, color:"#fff" }
                  : { background:P.s2, borderColor:P.border, color:P.text }}>
                <p className="text-xs font-black mb-1" style={{ color:message.role === "student" ? "#EDE9FF" : P.v4 }}>{message.role === "student" ? "Tú" : "Orion"}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                {message.usedMissionContext && <p className="text-[11px] mt-2" style={{ color:message.role === "student" ? "#EDE9FF" : P.c4 }}>Usó el contexto de la misión que autorizaste.</p>}
                {message.role === "orion" && (
                  <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Controles de audio de la respuesta">
                    <button type="button" onClick={() => listen(message)} disabled={!ttsSupported()} className={control} style={{ borderColor:P.border, color:P.text }}>
                      <Volume2 size={14} aria-hidden="true"/>Escuchar
                    </button>
                    <button type="button" onClick={pauseResponse} disabled={audioMessageId !== message.id} className={control} style={{ borderColor:P.border, color:P.text }}>
                      {audioPaused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}{audioPaused ? "Continuar" : "Pausar"}
                    </button>
                    <button type="button" onClick={() => listen(message)} disabled={!ttsSupported()} className={control} style={{ borderColor:P.border, color:P.text }}>
                      <Repeat size={14} aria-hidden="true"/>Repetir
                    </button>
                    <button type="button" onClick={() => { stopResponseAudio(); setMuted(true); }} disabled={audioMessageId !== message.id && muted} className={control} style={{ borderColor:P.border, color:P.text }}>
                      <VolumeX size={14} aria-hidden="true"/>Silenciar
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
          <div ref={historyEnd}/>
        </div>

        <div className={`border-t ${compact ? "p-3 space-y-2" : "p-4 sm:p-5 space-y-3"} shrink-0`} style={{ borderColor:P.border, background:"#0E1739" }}>
          <label className="block text-sm font-bold" style={{ color:P.text }} htmlFor="orion-chat-input">Tu mensaje o transcripción</label>
          <textarea id="orion-chat-input" ref={inputRef} value={draft} readOnly={micBusy}
            onChange={event => setDraft(event.target.value.slice(0, 800))}
            onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
            rows={compact ? 2 : 3} maxLength={800} placeholder="Escribe o graba tu mensaje…"
            className="w-full rounded-xl border px-3 py-2.5 text-sm resize-y" style={{ background:P.s2, borderColor:P.border, color:P.text }}/>
          {interim && <p className="text-xs italic" style={{ color:P.c4 }}>Escuchando: {interim}</p>}

          <div className="flex flex-wrap gap-2" aria-label="Controles del micrófono">
            <button type="button" onClick={requestRecording} disabled={micBusy} className={control}
              style={{ borderColor:micState === "listening" ? P.r3 : P.c3, color:P.text, background:micState === "listening" ? "rgba(239,68,68,.12)" : "rgba(34,211,238,.08)" }}>
              <Mic size={16} aria-hidden="true"/>Grabar
            </button>
            <button type="button" onClick={stopRecording} disabled={micState !== "listening"} className={control} style={{ borderColor:P.border, color:P.text }}>
              <Square size={15} aria-hidden="true"/>Detener
            </button>
            <button type="button" onClick={() => cancelRecording(false)} disabled={!micBusy} className={control} style={{ borderColor:P.border, color:P.text }}>
              <X size={16} aria-hidden="true"/>Cancelar grabación
            </button>
            <span className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-bold" role="status" data-testid="transcription-state" style={{ color:transcriptionColor }}>
              <span className={`w-2.5 h-2.5 rounded-full ${transcriptionState === "recording" || transcriptionState === "processing" ? "animate-pulse" : ""}`}
                style={{ background:transcriptionState === "recording" ? P.r3 : transcriptionState === "processing" ? P.a3 : transcriptionState === "ready" ? P.g3 : transcriptionState === "error" ? P.r3 : P.muted }}/>
              {transcriptionLabel}
            </span>
          </div>
          {!micSupported && <p className="text-xs flex items-start gap-2" style={{ color:P.muted }}><AlertCircle size={15} className="mt-0.5 flex-shrink-0" aria-hidden="true"/>El reconocimiento de voz no está disponible en este navegador o vista. Puedes conversar escribiendo y pulsando Enviar.</p>}
          <p className="text-xs" role="status" style={{ color:P.muted }}>{micStatus}</p>

          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" onClick={() => { cancelRecording(true); setMicStatus(""); }} disabled={!draft && !micBusy} className={control} style={{ borderColor:P.border, color:P.text }}>Borrar</button>
            <button type="button" onClick={sendMessage} disabled={!draft.trim() || micBusy} className={control}
              style={{ background:g(P.v2,P.v1), borderColor:P.v3, color:"#fff" }}><Send size={16} aria-hidden="true"/>Enviar mensaje</button>
          </div>
        </div>
      </section>

      {!compact && <aside className="space-y-4">
        <section className="rounded-2xl border p-4" style={{ background:P.s1, borderColor:P.border }}>
          <h2 className="font-bold flex items-center gap-2" style={{ color:P.text }}><ShieldCheck size={18} style={{ color:P.c4 }} aria-hidden="true"/>Privacidad</h2>
          <p className="text-xs leading-relaxed mt-2" style={{ color:P.muted }}>LifeXperience no guarda grabaciones. El reconocimiento de voz, si lo activas, lo realiza el proveedor del navegador. La conversación de este prototipo permanece en esta sesión.</p>
          <p className="text-xs leading-relaxed mt-2" style={{ color:P.a4 }}><strong>Configuración actual:</strong> reconocimiento del navegador en español (`es-PE`). No hay un proveedor de transcripción del servidor configurado en este proyecto.</p>
        </section>

        <section className="rounded-2xl border p-4" style={{ background:P.s1, borderColor:missionContext ? "rgba(34,211,238,.35)" : P.border }}>
          <h2 className="font-bold" style={{ color:P.text }}>Contexto de misión</h2>
          {missionContext ? (
            <>
              <label className="flex items-start gap-2 mt-3 text-sm font-semibold" style={{ color:P.text }}>
                <input type="checkbox" checked={useMission} onChange={event => setUseMission(event.target.checked)} className="mt-0.5 w-4 h-4"/>
                <span>Usar esta misión como contexto</span>
              </label>
              <p className="text-xs mt-2 leading-relaxed" style={{ color:P.muted }}>Solo se comparte con la lógica local de Orion; no se envía a servicios externos.</p>
              <details className="mt-3">
                <summary className="min-h-11 py-2 cursor-pointer text-xs font-bold" style={{ color:P.c4 }}>Ver la información que se usará</summary>
                <ul className="space-y-1 text-xs" style={{ color:P.muted }}>
                  {contextSummary.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </details>
            </>
          ) : <p className="text-xs mt-2 leading-relaxed" style={{ color:P.muted }}>No hay una misión en curso. Puedes conversar con Orion sin contexto de misión.</p>}
        </section>
      </aside>}

      {privacyOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="mic-privacy-title" style={{ background:"rgba(4,7,24,.82)" }}>
          <div ref={privacyDialogRef} className="w-full max-w-md rounded-3xl border p-6" style={{ background:P.s1, borderColor:P.border, boxShadow:SHADOW.card }}>
            <h2 id="mic-privacy-title" className="text-xl font-black flex items-center gap-2" style={{ color:P.text }}><Mic size={20} style={{ color:P.c4 }} aria-hidden="true"/>Antes de usar el micrófono</h2>
            <p className="text-sm leading-relaxed mt-3" style={{ color:"#E3E8FA" }}>El navegador pedirá acceso al micrófono y su proveedor puede recibir el audio para convertirlo en texto. LifeXperience no guarda la grabación. Podrás revisar y editar la transcripción antes de enviarla.</p>
            <p className="text-sm mt-3 font-semibold" style={{ color:P.a4 }}>El micrófono es opcional; siempre puedes escribir.</p>
            <div className="flex flex-wrap justify-end gap-2 mt-5">
              <button type="button" onClick={() => setPrivacyOpen(false)} className={control} style={{ borderColor:P.border, color:P.text }}><X size={15} aria-hidden="true"/>Cancelar</button>
              <button ref={privacyContinueRef} type="button" onClick={() => { setPrivacyAccepted(true); setPrivacyOpen(false); beginRecognition(); }} className={control}
                style={{ background:g(P.v2,P.v1), borderColor:P.v3, color:"#fff" }}><Check size={15} aria-hidden="true"/>Entiendo, continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Persistent corner entry point; opens a compact chat without leaving the current case. */
export function OrionFloatingAssistant(props: Omit<Props, "compact" | "onClose">) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  return (
    <div className="fixed z-[180]" style={{ right:"calc(1rem + env(safe-area-inset-right))", bottom:"calc(1rem + env(safe-area-inset-bottom))" }}>
      {open && (
        <section id="orion-chat-panel" role="dialog" aria-modal="false" aria-labelledby="orion-chat-title"
          className="absolute right-0 bottom-[76px] overflow-hidden rounded-2xl border"
          style={{ width:"min(430px, calc(100vw - 2rem))", height:"min(760px, calc(100dvh - 6rem))", borderColor:"rgba(139,114,255,.45)", boxShadow:"0 18px 60px rgba(0,0,0,.55)" }}>
          <OrionChat {...props} compact onClose={close}/>
        </section>
      )}
      <button ref={triggerRef} type="button" aria-label={open ? "Cerrar Orion" : "Hablar con Orion"} aria-expanded={open} aria-controls={open ? "orion-chat-panel" : undefined}
        onClick={() => open ? close() : setOpen(true)}
        className="relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/60 motion-reduce:transition-none motion-reduce:hover:scale-100"
        style={{ background:"linear-gradient(145deg,#5635D4,#8A42DF)", borderColor:"#B9F7FF", boxShadow:"0 8px 28px rgba(62,40,170,.6)" }}>
        <OrionFigure variant="bust" size={48}/>
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2" aria-hidden="true" style={{ background:"#21C9E3", borderColor:P.bg }}><MessageCircle size={12} color="#07132F" strokeWidth={3}/></span>
        <span className="sr-only">{open ? "Cerrar asistente" : "Abrir asistente de Orion con texto y micrófono"}</span>
      </button>
    </div>
  );
}
