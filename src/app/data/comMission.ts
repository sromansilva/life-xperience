import type { SceneHints } from "../lib/orion";
import type { Crowd } from "../art/ClassroomScene";
import type { SpeakerId } from "../art/characters";

// ─── Mission script types (shared by authored and legacy missions) ─────────────
export type ChoiceQuality = "good" | "ok" | "negative";
export type SceneMood = "nervous" | "confident" | "happy";

export interface SceneChoice {
  id: string;
  emoji: string;
  text: string;
  quality: ChoiceQuality;
  /** Scene id, or "end:<path>" to finish the mission. Negative choices have no `next`. */
  next?: string;
  /** What happens right after a good/ok choice. */
  reaction?: string;
  /** Concrete consequence of a negative choice. */
  consequence?: string;
  /** How the class reacts after this choice. */
  crowd?: Crowd;
  /** Relevant sounds, shown in the subtitles (e.g. "Risas"). */
  sounds?: string[];
}

export interface MissionScene {
  id: string;
  stage: number; // 1-based
  location: string;
  mood: SceneMood;
  narration: string;
  speaker: string;
  dialogue: string;
  /** The task the student has to solve in this scene. */
  consigna: string;
  board: { title: string; sub: string };
  choices: SceneChoice[];
  hints?: SceneHints;
  /** Who says the dialogue line (voice + on-screen identification). */
  speakerId?: SpeakerId;
  /** Class mood while the scene is presented. */
  crowd?: Crowd;
  sounds?: { narrate?: string[]; dialogue?: string[] };
}

export interface MissionOutcome {
  emoji: string;
  head: string;
  score: number;
  gains: Record<string, number>;
  strength: string;
  improve: string;
}

export interface MissionScript {
  id: string;
  stages: string[];
  start: string;
  scenes: Record<string, MissionScene>;
  outcomes?: Record<string, MissionOutcome>;
  /** True when the mission has authored hints and consequences. */
  authored: boolean;
}

// ─── com-1 · Presentación frente al salón ─────────────────────────────────────
// One topic (climate change) across board, narration and options.
const S2_CONSIGNA = "Lucas tiene una duda que otros también comparten. Respóndela con respeto y sin perder el hilo de tu exposición.";

const S2_CHOICES = [
  { id: "local", emoji: "🏙️", quality: "good" as const, next: "s3", crowd: "engaged" as const, sounds: ["Murmullos de acuerdo"],
    text: "Agradecer la pregunta y responder con un ejemplo de la ciudad: las olas de calor del último verano",
    reaction: "Lucas asiente: «Es cierto, en junio suspendieron el recreo por el calor». Otros compañeros se suman con sus propios ejemplos." },
  { id: "later", emoji: "📝", quality: "ok" as const, next: "s3", crowd: "attentive" as const,
    text: "Anotar la pregunta en la pizarra y decir que la responderás al cerrar",
    reaction: "Lucas acepta esperar. Mantienes el orden de tu exposición, aunque algunos compañeros se quedan con la duda por ahora." },
  { id: "obvio", emoji: "🙄", quality: "negative" as const, crowd: "tense" as const, sounds: ["Risas"],
    text: "Responder «Eso es obvio, presta atención»",
    consequence: "Lucas se cruza de brazos y algunos se ríen de él. El ambiente se tensa y, durante el resto de la exposición, nadie más se anima a preguntar." },
  { id: "cifra", emoji: "🎲", quality: "negative" as const, crowd: "doubtful" as const, sounds: ["Murmullos de duda"],
    text: "Inventar una cifra para sonar seguro: «El 90 % de las ciudades se inundará en cinco años»",
    consequence: "Daniela levanta la mano: «Eso no es lo que vimos en clase». La profesora te pide la fuente y no la tienes. El grupo empieza a dudar de lo que dices." },
];

const S2_HINTS: SceneHints = {
  clarify: [
    { focus: "consigna", text: "La consigna pide dos cosas a la vez: respeto hacia Lucas y no perder el hilo. Una buena respuesta cuida a la persona y al tema." },
    { focus: "publico",  text: "Si Lucas lo pregunta, probablemente otros también lo piensan. Responderle bien es responderle a medio salón." },
    { focus: "ejemplo",  text: "Cuando alguien te pregunta algo en una conversación, ¿qué te convence más: algo que viviste de cerca o un número que nadie puede comprobar?" },
  ],
  recover: {
    obvio: [
      { focus: "publico",  text: "Lucas preguntó lo que otros también pensaban. Cuando se responde con burla, todos aprenden que preguntar es arriesgado. ¿Qué respuesta haría que el grupo siga participando?" },
      { focus: "objetivo", text: "Tu objetivo es que el grupo entienda por qué el tema les afecta. La pregunta de Lucas es una oportunidad para lograrlo, no un ataque." },
      { focus: "ejemplo",  text: "Recuerda una vez que hiciste una pregunta en clase. ¿Qué tipo de respuesta te hizo querer seguir participando?" },
    ],
    cifra: [
      { focus: "objetivo", text: "Sonar seguro no sirve si el dato no es cierto. Busca una respuesta que puedas sostener si alguien te pide la fuente." },
      { focus: "consigna", text: "Relee la consigna: responder con respeto y sin perder el hilo. La confianza del grupo vale más que una cifra impactante." },
      { focus: "ejemplo",  text: "Algo que todos vivieron, como un hecho reciente de la ciudad, suele convencer más que un número que nadie puede comprobar." },
    ],
  },
};

export const COM1_SCRIPT: MissionScript = {
  id: "com-1",
  authored: true,
  stages: ["Apertura", "Pregunta difícil", "Cierre"],
  start: "s1",
  scenes: {
    s1: {
      id: "s1", stage: 1, mood: "nervous", speakerId: "garcia", crowd: "neutral",
      sounds: { narrate: ["Murmullos en el salón", "Pasos hacia la pizarra"] },
      location: "Salón de Ciencias Sociales · Lunes 9:00 AM",
      narration: "La profesora García dice tu nombre. Caminas al frente con tus notas sobre el cambio climático. En la pizarra ya está el título de tu exposición y 28 compañeros esperan en silencio.",
      speaker: "Prof. García",
      dialogue: "«Tienes cinco minutos. Explícale al grupo por qué el cambio climático nos afecta aquí, en nuestra ciudad.»",
      consigna: "Abre tu exposición de forma que el grupo quiera escucharte y sepa de qué vas a hablar.",
      board: { title: "Cambio Climático Global", sub: "¿Por qué nos afecta aquí?" },
      choices: [
        { id: "plan", emoji: "🧭", quality: "good", next: "s2_plan", crowd: "attentive", sounds: ["Silencio atento"],
          text: "Respirar, mirar al grupo y anunciar los tres puntos que vas a tratar",
          reaction: "Tu voz sale firme. Escribes «Causas · Efectos · Qué hacer» en la pizarra y el grupo sabe qué esperar." },
        { id: "pregunta", emoji: "❓", quality: "good", next: "s2_pregunta", crowd: "engaged", sounds: ["Risas suaves y comentarios"],
          text: "Abrir con una pregunta: «¿Quién sintió más calor que nunca este verano?»",
          reaction: "Ocho manos se levantan y algunos comentan entre ellos. Tienes la atención del salón." },
        { id: "leer", emoji: "📄", quality: "negative", crowd: "distracted", sounds: ["Vibración de celulares", "Murmullos"],
          text: "Girarte hacia la pizarra y leer tus notas tal cual, en voz baja",
          consequence: "Le das la espalda al grupo y lees en voz baja. La fila de atrás deja de oírte, tres compañeros sacan el celular y la profesora te pide que hables más fuerte." },
        { id: "disculpa", emoji: "😓", quality: "negative", crowd: "bored", sounds: ["Suspiros"],
          text: "Empezar con una disculpa: «No me preparé mucho, perdón si sale mal»",
          consequence: "Antes de empezar, le dijiste al grupo que no esperara mucho. Varios se acomodan para no prestar atención y tú te sientes todavía más nervioso." },
      ],
      hints: {
        clarify: [
          { focus: "consigna", text: "La consigna tiene dos partes: que quieran escucharte y que sepan de qué vas a hablar. Busca una apertura que logre las dos." },
          { focus: "publico",  text: "Ponte en el lugar de tus compañeros: en los primeros segundos deciden si te prestan atención. ¿Qué haría que tú quisieras seguir escuchando?" },
          { focus: "ejemplo",  text: "Piensa en un video que te enganchó desde el inicio: la persona te miraba de frente y te hacía una pregunta o te decía de qué iba a tratar." },
        ],
        recover: {
          leer: [
            { focus: "publico",  text: "El problema no fue lo que dijiste, sino hacia dónde mirabas. ¿Qué apertura te mantiene de frente al grupo?" },
            { focus: "objetivo", text: "Tus notas son un apoyo, no el guion. El objetivo es que el grupo entienda, y para eso necesita verte y oírte." },
            { focus: "ejemplo",  text: "Imagina que alguien te explica algo de espaldas y en voz baja: ¿cuánto le entenderías? Busca una apertura en la que el grupo te vea y te escuche." },
          ],
          disculpa: [
            { focus: "objetivo", text: "Tu primera frase le dice al grupo qué esperar. ¿Qué apertura les da una razón para escucharte en lugar de una para desconectarse?" },
            { focus: "publico",  text: "Los nervios son normales y el grupo no los nota tanto como crees. Busca una apertura que te dé seguridad a ti y curiosidad a ellos." },
            { focus: "consigna", text: "Relee la consigna: que quieran escucharte y que sepan de qué vas a hablar. Una disculpa no cumple ninguna de las dos." },
          ],
        },
      },
    },
    s2_plan: {
      id: "s2_plan", stage: 2, mood: "confident", speakerId: "lucas", crowd: "attentive",
      sounds: { narrate: ["Lápices sobre el papel"], dialogue: ["Una silla se mueve"] },
      location: "Frente al salón · Minuto 2",
      narration: "Vas por tu segundo punto, los efectos. El grupo toma notas. De repente, Lucas levanta la mano sin esperar su turno.",
      speaker: "Lucas (compañero)",
      dialogue: "«¿Y eso qué tiene que ver con nosotros? Eso pasa en otros países, no aquí.»",
      consigna: S2_CONSIGNA,
      board: { title: "Causas · Efectos · Qué hacer", sub: "Punto 2: efectos" },
      choices: S2_CHOICES,
      hints: S2_HINTS,
    },
    s2_pregunta: {
      id: "s2_pregunta", stage: 2, mood: "confident", speakerId: "lucas", crowd: "attentive",
      sounds: { narrate: ["Comentarios del grupo"], dialogue: ["Una silla se mueve"] },
      location: "Frente al salón · Minuto 2",
      narration: "Usas las respuestas del grupo para explicar las causas del calor extremo. El salón está atento. Entonces Lucas interrumpe desde el fondo.",
      speaker: "Lucas (compañero)",
      dialogue: "«¿Y eso qué tiene que ver con nosotros? Eso pasa en otros países, no aquí.»",
      consigna: S2_CONSIGNA,
      board: { title: "¿Más calor que nunca?", sub: "Lo que respondió el grupo" },
      choices: S2_CHOICES,
      hints: S2_HINTS,
    },
    s3: {
      id: "s3", stage: 3, mood: "confident", speakerId: "garcia", crowd: "attentive",
      sounds: { narrate: ["Tictac del reloj"] },
      location: "Frente al salón · Último minuto",
      narration: "La profesora levanta un cartel: «1 minuto». Ya explicaste causas y efectos. El grupo te sigue, pero se acerca la hora del timbre.",
      speaker: "Prof. García",
      dialogue: "«Te queda un minuto. Ve cerrando, por favor.»",
      consigna: "Cierra en un minuto de forma que el grupo recuerde tu idea principal.",
      board: { title: "Cambio Climático Global", sub: "Cierre: qué podemos hacer" },
      choices: [
        { id: "accion", emoji: "🌱", quality: "good", next: "end:action", crowd: "applause", sounds: ["Aplausos"],
          text: "Resumir las tres ideas y proponer una acción sencilla para esta semana",
          reaction: "«Esta semana apaguemos las luces del salón durante el recreo.» Varios compañeros lo anotan y la profesora sonríe." },
        { id: "reflexion", emoji: "💭", quality: "good", next: "end:reflect", crowd: "attentive", sounds: ["Silencio pensativo"],
          text: "Cerrar con una pregunta para que cada quien la piense en casa",
          reaction: "«¿Qué cambiarías tú si supieras que tu barrio será el más afectado?» El salón se queda en silencio, pensando." },
        { id: "datos", emoji: "⏩", quality: "negative", crowd: "restless", sounds: ["Suena el timbre"],
          text: "Seguir agregando datos nuevos hasta que suene el timbre",
          consequence: "Sigues agregando datos cuando se acaba el tiempo. La profesora te detiene a mitad de una frase y, al salir, nadie recuerda cuál era tu idea principal." },
      ],
      hints: {
        clarify: [
          { focus: "consigna", text: "Fíjate en las dos condiciones: un minuto y que recuerden tu idea principal. Más información no siempre ayuda a recordar." },
          { focus: "publico",  text: "Al final de una exposición, el grupo recuerda sobre todo lo último que escuchó. ¿Qué te gustaría que se llevaran?" },
          { focus: "ejemplo",  text: "Piensa en el final de una película o una canción que recuerdas: suele ser corto y vuelve a la idea central." },
        ],
        recover: {
          datos: [
            { focus: "objetivo", text: "El objetivo del cierre es que recuerden una idea, no todas. ¿Qué opción ayuda a fijar lo principal en poco tiempo?" },
            { focus: "consigna", text: "Relee la consigna: tienes un minuto. Un buen cierre también respeta el tiempo de los demás." },
            { focus: "publico",  text: "Con el timbre cerca, el grupo ya está pensando en salir. Dales algo breve y fácil de recordar." },
          ],
        },
      },
    },
  },
  outcomes: {
    action: {
      emoji: "🌱", head: "Mensaje que mueve a la acción", score: 96,
      gains: { "Comunicación": 16, "Liderazgo": 8, "Pensamiento Crítico": 6, "Empatía": 6 },
      strength: "Estructura clara y un cierre con una acción concreta que el grupo puede aplicar.",
      improve: "Haz una pausa breve después de cada idea para que el grupo la asimile.",
    },
    reflect: {
      emoji: "💭", head: "Cierre que deja pensando", score: 93,
      gains: { "Comunicación": 14, "Pensamiento Crítico": 10, "Empatía": 9, "Autogestión": 5 },
      strength: "Una pregunta final que conecta el tema con la vida de cada compañero.",
      improve: "Acompaña la pregunta con un resumen breve de tus tres ideas.",
    },
  },
};
