import type { SpeakerId } from "../art/characters";

// Character voices with the browser's speech synthesis (Web Speech API).
// The device decides which Spanish voices exist; we pick by name/gender and then
// shape each character with pitch and rate so they stay distinguishable.

export type VoiceRole = "narrator" | "orion" | "teacher" | "teen-m" | "teen-f" | "student" | "adult";

export interface Speaker { id: SpeakerId | "other"; name: string; role: string; voice: VoiceRole; portrait: SpeakerId | "other" }

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  narrator: { id: "narrator", name: "Narración", role: "Narrador", voice: "narrator", portrait: "narrator" },
  orion:    { id: "orion", name: "Orion", role: "Mago mentor", voice: "orion", portrait: "orion" },
  garcia:   { id: "garcia", name: "Prof. García", role: "Docente", voice: "teacher", portrait: "garcia" },
  lucas:    { id: "lucas", name: "Lucas", role: "Compañero", voice: "teen-m", portrait: "lucas" },
  daniela:  { id: "daniela", name: "Daniela", role: "Compañera", voice: "teen-f", portrait: "daniela" },
  sofia:    { id: "sofia", name: "Sofía", role: "Compañera", voice: "teen-f", portrait: "sofia" },
  student:  { id: "student", name: "Tú", role: "Estudiante", voice: "student", portrait: "student" },
};

/** Maps the free-text speaker labels of the original world scripts to a voice. */
export function speakerForLabel(label: string): Speaker {
  const l = label.toLowerCase();
  if (l.includes("garcía")) return SPEAKERS.garcia;
  if (l.includes("lucas")) return SPEAKERS.lucas;
  if (l.includes("daniela")) return SPEAKERS.daniela;
  const name = label.replace(/\s*\(.*\)\s*/, "").trim();
  if (/^prof|jueza|directora/.test(l)) return { id: "other", name, role: "Docente", voice: "teacher", portrait: "garcia" };
  if (/compañera/.test(l)) return { id: "other", name, role: "Compañera", voice: "teen-f", portrait: "sofia" };
  if (/compañero|amigo|rival/.test(l)) return { id: "other", name, role: l.includes("amigo") ? "Amigo" : "Compañero", voice: "teen-m", portrait: "lucas" };
  if (/conciencia/.test(l)) return { id: "other", name, role: "Voz interior", voice: "narrator", portrait: "narrator" };
  return { id: "other", name, role: "Adulto", voice: "adult", portrait: "other" };
}

export interface Cue { id: string; kind: "speech" | "sound"; text: string; speaker?: Speaker; audio?: string }

const PROFILE: Record<VoiceRole, { prefer: "male" | "female" | "any"; pitch: number; rate: number; fallbackPitch: number; label: string }> = {
  orion:    { prefer: "male",   pitch: 0.89, rate: 0.9,  fallbackPitch: 0.94, label: "Mago sabio · tono grave y pausado" },
  teacher:  { prefer: "female", pitch: 1.0,  rate: 0.98, fallbackPitch: 1.03, label: "Adulta, clara y tranquila" },
  "teen-m": { prefer: "male",   pitch: 1.07, rate: 1.01, fallbackPitch: 1.1,  label: "Voz juvenil aproximada · depende del dispositivo" },
  "teen-f": { prefer: "female", pitch: 1.07, rate: 1.01, fallbackPitch: 1.1,  label: "Voz juvenil aproximada · depende del dispositivo" },
  student:   { prefer: "any",    pitch: 1.08, rate: 1.02, fallbackPitch: 1.1,  label: "Estudiante · tono juvenil aproximado" },
  narrator: { prefer: "any",    pitch: 1.0,  rate: 0.98, fallbackPitch: 1.0,  label: "Narración clara" },
  adult:    { prefer: "male",   pitch: 1.0,  rate: 0.98, fallbackPitch: 1.0,  label: "Adulta, natural" },
};

const FEMALE_RE = /(helena|laura|elvira|dalia|paulina|m[oó]nica|sabina|paloma|pen[eé]lope|conchita|luc[ií]a|elena|ximena|camila|marisol|esperanza|francisca|catalina|isabel|ana\b|google español|female|mujer|femenin)/i;
const MALE_RE = /(jorge|diego|juan|carlos|pablo|ra[uú]l|[aá]lvaro|enrique|miguel|andr[eé]s|tom[aá]s|gonzalo|jos[eé]|alonso|gerardo|male\b|hombre|masculin)/i;

export const ttsSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

function spanishVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const all = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith("es"));
  // Prefer installed neural/online voices, then regional Spanish voices.
  // These are usually more fluid than the operating system's basic synthesizer.
  const qualityRank = (v: SpeechSynthesisVoice) => /(online|natural|neural|wavenet|enhanced|premium)/i.test(v.name) ? 0 : /google/i.test(v.name) ? 1 : 2;
  const regionRank = (v: SpeechSynthesisVoice) => (/es-(pe|419|mx|co|ar|cl|us)/i.test(v.lang) ? 0 : /es-ES/i.test(v.lang) ? 1 : 2);
  return all.sort((a, b) => qualityRank(a) - qualityRank(b) || regionRank(a) - regionRank(b));
}

export function pickVoice(role: VoiceRole): { voice?: SpeechSynthesisVoice; pitch: number; rate: number; genderMatched: boolean } {
  const p = PROFILE[role];
  const voices = spanishVoices();
  const byGender = p.prefer === "female" ? voices.filter(v => FEMALE_RE.test(v.name)) : p.prefer === "male" ? voices.filter(v => MALE_RE.test(v.name) && !FEMALE_RE.test(v.name)) : voices;
  if (role === "teen-m" || role === "teen-f" || role === "student") {
    // Some systems expose age in the voice name; otherwise use a Spanish voice
    // with the closest known gender and shape it lightly. A pitch shift is only
    // an approximation, never a claim that the voice is a child's recording.
    const youthful = voices.filter(v => /\b(teen|young|child|juvenil|joven|infantil)\b/i.test(v.name));
    const youthfulMatch = youthful.find(v => byGender.includes(v)) ?? youthful.find(v => role === "teen-m" ? !FEMALE_RE.test(v.name) : role === "teen-f" ? !MALE_RE.test(v.name) : true);
    if (youthfulMatch) return { voice: youthfulMatch, pitch: p.pitch, rate: p.rate, genderMatched: byGender.includes(youthfulMatch) };

    const candidates = role === "student" ? voices : byGender.length ? byGender : voices.filter(v => role === "teen-m" ? !FEMALE_RE.test(v.name) : !MALE_RE.test(v.name));
    const voice = candidates[0] ?? voices[0];
    return { voice, pitch: role === "student" || byGender.length ? p.pitch : p.fallbackPitch, rate: p.rate, genderMatched: role === "student" || byGender.length > 0 };
  }

  const list = byGender.length ? byGender : voices;
  const voice = role === "orion"
    ? list.find(v => /\b(senior|elder|mature|mayor|aged|old|sabio|anciano)\b/i.test(v.name)) ?? list[0]
    : list[0];
  const matched = byGender.length > 0;
  return { voice, pitch: matched ? p.pitch : p.fallbackPitch, rate: p.rate, genderMatched: matched || p.prefer === "any" };
}

export function describeVoice(role: VoiceRole): string {
  const { voice, genderMatched } = pickVoice(role);
  if (!voice) return "Sin voz en español en este dispositivo";
  return `${voice.name} (${voice.lang})${genderMatched ? "" : " · ajustada por tono"}`;
}
export const voiceStyle = (role: VoiceRole) => PROFILE[role].label;

function ensureVoices(): Promise<void> {
  return new Promise(resolve => {
    if (!ttsSupported() || window.speechSynthesis.getVoices().length) return resolve();
    const done = () => { window.speechSynthesis.removeEventListener("voiceschanged", done); resolve(); };
    window.speechSynthesis.addEventListener("voiceschanged", done);
    setTimeout(done, 1500);
  });
}

const clean = (text: string) => text
  .replace(/[«»"“”]/g, "")
  .replace(/S\/\s*(\d+(?:[.,]\d+)?)/gi, (_match, amount: string) => `${amount} ${amount === "1" ? "sol" : "soles"}`);

/** Splits text into caption-sized sentences. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?…»])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«"“])/).map(s => s.trim()).filter(Boolean);
}

/**
 * Plays caption cues in order with each speaker's voice. `onCue` fires when a cue
 * starts, so subtitles stay in sync with the audio. Sound cues are shown, not spoken.
 */
let activePlayback: (() => void) | undefined;

export function stopVoicePlayback() {
  activePlayback?.();
}

const clips = import.meta.glob<string>("../audio/*.{wav,mp3,ogg}", { eager: true, query: "?url", import: "default" });

export function sceneVoiceClip(missionId: string, sceneId: string, cueId: string): string | undefined {
  const stem = `../audio/${missionId}_${sceneId}_${cueId}`;
  return clips[`${stem}.mp3`] ?? clips[`${stem}.wav`] ?? clips[`${stem}.ogg`];
}

export function playCues(cues: Cue[], h: { onCue: (i: number) => void; onDone?: () => void }): () => void {
  stopVoicePlayback();
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let clip: HTMLAudioElement | undefined;
  const synth = ttsSupported() ? window.speechSynthesis : null;

  const stop = () => {
    if (cancelled) return;
    cancelled = true;
    clearTimeout(timer);
    if (clip) { clip.onended = null; clip.onerror = null; clip.pause(); }
    if (activePlayback === stop) {
      activePlayback = undefined;
      synth?.cancel();
      h.onDone?.();
    }
  };
  activePlayback = stop;

  const run = (i: number) => {
    if (cancelled) return;
    if (i >= cues.length) { stop(); return; }
    const cue = cues[i];
    h.onCue(i);
    if (cue.kind === "sound" || !cue.speaker) {
      timer = setTimeout(() => run(i + 1), cue.kind === "sound" ? 1000 : 0);
      return;
    }

    // Keep a character's consecutive sentences in one utterance. Restarting
    // speech synthesis at every full stop makes even a good voice sound choppy.
    const speechLines = [{ index:i, text:clean(cue.text), start:0 }];
    let nextIndex = i + 1;
    if (!cue.audio) {
      let charOffset = speechLines[0].text.length + 1;
      while (nextIndex < cues.length) {
        const following = cues[nextIndex];
        if (following.kind !== "speech" || !following.speaker || following.audio ||
            following.speaker.name !== cue.speaker.name || following.speaker.voice !== cue.speaker.voice) break;
        const text = clean(following.text);
        speechLines.push({ index:nextIndex, text, start:charOffset });
        charOffset += text.length + 1;
        nextIndex++;
      }
    }
    const spokenText = speechLines.map(line => line.text).join(" ");

    let advanced = false;
    let fallbackStarted = false;
    const next = () => {
      if (advanced || cancelled) return;
      advanced = true;
      clearTimeout(timer);
      const following = cues[nextIndex];
      const changesSpeaker = following?.kind === "speech" && following.speaker?.name !== cue.speaker?.name;
      timer = setTimeout(() => run(nextIndex), following?.kind === "sound" ? 160 : changesSpeaker ? 420 : 220);
    };
    const speak = () => {
      if (cancelled || advanced || fallbackStarted) return;
      fallbackStarted = true;
      clearTimeout(timer);
      if (clip) { clip.onended = null; clip.onerror = null; clip.pause(); clip = undefined; }
      if (!synth) { next(); return; }
      const voice = pickVoice(cue.speaker!.voice);
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = voice.voice?.lang ?? "es-PE";
      if (voice.voice) utterance.voice = voice.voice;
      utterance.pitch = voice.pitch;
      utterance.rate = voice.rate;
      let lineAt = 1;
      utterance.onboundary = event => {
        while (lineAt < speechLines.length && event.charIndex >= speechLines[lineAt].start) {
          h.onCue(speechLines[lineAt].index);
          lineAt++;
        }
      };
      utterance.onend = () => {
        if (lineAt < speechLines.length) h.onCue(speechLines[speechLines.length - 1].index);
        next();
      };
      utterance.onerror = next;
      timer = setTimeout(() => {
        utterance.onend = null;
        utterance.onboundary = null;
        utterance.onerror = null;
        synth.cancel();
        next();
      }, 1500 + (spokenText.length * 100) / voice.rate);
      synth.speak(utterance);
    };

    if (cue.audio) {
      clip = new Audio(cue.audio);
      clip.onended = next;
      clip.onerror = speak;
      timer = setTimeout(speak, 5000);
      clip.play().then(() => {
        if (!fallbackStarted && !advanced && !cancelled) clearTimeout(timer);
      }).catch(speak);
    } else {
      speak();
    }
  };

  ensureVoices().then(() => { if (!cancelled) run(0); });
  return stop;
}

export function speakAs(role: VoiceRole, text: string, speaker?: Speaker): () => void {
  return playCues([{ id: "one", kind: "speech", text, speaker: speaker ?? { id: "other", name: "", role: "", voice: role, portrait: "other" } }], { onCue: () => {} });
}
