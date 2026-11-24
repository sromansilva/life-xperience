import { useState, useEffect, useMemo, useRef, useCallback } from "react";
// recharts only used for bar charts; radar replaced with custom SVG (no key collisions)
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ArrowLeft, Eye, EyeOff, LogOut, ChevronRight, CheckCircle, AlertTriangle, Volume2, VolumeX, Zap, Clock, Loader2, Lightbulb, RotateCcw, BookOpen, LifeBuoy, Timer, TimerOff, FlaskConical, Undo2, Check, X, Play, Type, AudioLines, Maximize2, Minimize2, Hand, Repeat, House, Map as MapIcon, BarChart3, UserRound, LayoutDashboard, Sparkles, ClipboardList, Users, Target, TriangleAlert, Coins, Flame, Trophy, Award, Pause, MessageCircle, Settings } from "lucide-react";
import { supabase, getProfile, upsertProfile, updateXP, setWritesBlocked, getWriteLog, onWrite } from "../lib/supabase";
import type { Profile } from "../lib/supabase";
import { getLevelInfo, reconcileProgress, computeReward, computeScore, type Reward } from "./lib/progress";
import { getOrionHint, type HintRecord } from "./lib/orion";
import { COM1_SCRIPT, type MissionScript, type MissionScene, type SceneChoice, type MissionOutcome, type ChoiceQuality } from "./data/comMission";
import { createMissionScript, MISSION_CASES } from "./data/missionCases";
import { MissionSetting } from "./art/MissionSetting";
import { LspSpellingPreview } from "./art/LspSpellingPreview";
import { OrionChat, OrionFloatingAssistant, type OrionChatMessage, type OrionMissionContext } from "./OrionChat";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { P, g, SHADOW } from "./theme";
import { CharSVG, OrionFigure, Portrait, TeacherFigure } from "./art/characters";
import { ClassroomScene, CROWD_LABEL, type Crowd } from "./art/ClassroomScene";
import { WelcomePortal, WorldEmblem, Medal, MissionArt } from "./art/illustrations";
import { SPEAKERS, speakerForLabel, playCues, speakAs, sentences, describeVoice, sceneVoiceClip, stopVoicePlayback, voiceStyle, ttsSupported, type Cue, type Speaker } from "./lib/voices";
import { lspFragmentFor, lineAtTime, lspCoverage } from "./data/lsp";

// ─── GenCase type ─────────────────────────────────────────────────────────────
interface GenCase {
  id:string; title:string; objective:string; scenario:string;
  questions:string[]; evaluation:string; tips:string;
  worldId:string; worldName:string; worldEmoji:string;
  difficulty:string; targetId:string; targetName:string;
  xp:number; duration:string; createdAt:string;
}

// ─── AI Case Generator Engine ─────────────────────────────────────────────────
const CASE_BANK: Record<string, Record<string, Omit<GenCase,"id"|"worldId"|"worldName"|"worldEmoji"|"difficulty"|"targetId"|"targetName"|"createdAt">[]>> = {
  com: {
    Básico:[
      { title:"El mensaje que no llegó",objective:"Desarrollar claridad y precisión al comunicar ideas por escrito.",scenario:"Daniela le pide a su compañero que traiga el proyecto grupal mañana. Él lo entiende diferente y el proyecto llega incompleto. En esta simulación el estudiante debe redactar el mensaje original de Daniela de forma clara y sin ambigüedad para que no haya malentendidos.",questions:["¿Qué información faltó en el mensaje original?","¿Cómo cambia el significado según el canal de comunicación?","¿Cuándo es mejor hablar en persona en lugar de escribir?","¿Qué palabras concretas evitan interpretaciones erróneas?"],evaluation:"El estudiante redacta dos versiones del mensaje (ambigua vs clara) y explica con 3 criterios cuál es más efectiva.",tips:"Pídele al estudiante que lea ambos mensajes en voz alta antes de elegir.",xp:80,duration:"10 min" },
    ],
    Intermedio:[
      { title:"El malentendido digital",objective:"Resolver un conflicto causado por comunicación digital sin contexto emocional.",scenario:"Valentina recibe este mensaje de su compañero de proyecto: 'Así no va a funcionar'. Sin tono, sin contexto. Se siente atacada. Antes de responder, debe analizar múltiples interpretaciones del mensaje y elegir la respuesta más asertiva.",questions:["¿Cuántas interpretaciones posibles tiene el mensaje original?","¿Qué información adicional necesitarías antes de responder?","¿Cómo redactarías el mensaje del compañero para que no fuera ambiguo?","¿Cuál es la diferencia entre reaccionar y responder?"],evaluation:"El estudiante escribe 3 posibles respuestas con diferente tono y justifica cuál usaría y por qué.",tips:"Invítalo a leer el mensaje como si viniera de alguien que lo aprecia vs alguien que lo critica.",xp:140,duration:"12 min" },
      { title:"Presentación sin preparación",objective:"Practicar la comunicación oral efectiva bajo presión de tiempo.",scenario:"Marcos tiene 5 minutos antes de presentar y su compañero le avisa que la mitad del material se perdió. Solo tiene sus notas incompletas y debe hablar durante 8 minutos ante el grupo. El estudiante debe decidir cómo estructurar el tiempo con lo que tiene.",questions:["¿Cuál es la información más importante a priorizar?","¿Cómo puedes usar preguntas al público para ganar tiempo y contenido?","¿Qué técnicas de apertura generan atención sin necesitar mucho material?","¿Cómo terminas de forma contundente aunque el contenido sea incompleto?"],evaluation:"El estudiante diseña el esquema de 8 minutos con los 3 puntos más importantes y una apertura y cierre creativos.",tips:"Cronometra cada sección con el estudiante en tiempo real para que sienta la presión.",xp:155,duration:"14 min" },
    ],
    Avanzado:[
      { title:"La audiencia hostil",objective:"Mantener la comunicación asertiva ante un público crítico y desafiante.",scenario:"Sofía presenta su propuesta de proyecto ante un comité que ya decidió rechazarla antes de escucharla. En la primera pregunta, un miembro la interrumpe y dice que su idea 'no tiene sentido en el mundo real'. El estudiante debe manejar la hostilidad sin perder la compostura ni el hilo argumentativo.",questions:["¿Cómo respondes a una crítica antes de que termines de hablar?","¿Qué diferencia hay entre defender tu idea y imponer tu idea?","¿Cuándo vale la pena cambiar de postura durante una presentación?","¿Cómo recuperas la atención del grupo después de una interrupción?"],evaluation:"El estudiante desarrolla 4 respuestas asertivas ante las 4 objeciones más comunes y las jerarquiza por efectividad.",tips:"Haz roleplay: tú actúas como el comité hostil y el estudiante practica las respuestas en tiempo real.",xp:260,duration:"18 min" },
    ],
  },
  fin: {
    Básico:[
      { title:"El dinero del recreo",objective:"Tomar decisiones básicas de presupuesto y distinguir necesidades de deseos.",scenario:"Carlos recibe 50 pesos para el recreo durante 5 días. El lunes gasta todo en dulces. El martes no tiene para almorzar. El estudiante debe ayudar a Carlos a diseñar un presupuesto semanal que cubra lo necesario y aún deje algo para lo que disfruta.",questions:["¿Cuál es la diferencia entre una necesidad y un capricho?","¿Cómo distribuirías los 50 pesos en los 5 días?","¿Qué pasaría si Carlos ahorra 5 pesos cada día durante un mes?","¿Conoces alguna técnica sencilla para no gastar más de lo que tienes?"],evaluation:"El estudiante crea una tabla de presupuesto semanal de 50 pesos con columnas de necesidades, deseos y ahorro.",tips:"Usa billetes de papel para que el ejercicio sea visual y concreto.",xp:90,duration:"8 min" },
    ],
    Intermedio:[
      { title:"El emprendimiento del kiosco",objective:"Aplicar conceptos de costos, ganancias e inversión en un caso real.",scenario:"Valentina quiere poner un kiosco de limonadas en el recreo. Tiene 200 pesos de inversión inicial. Calcula que cada limonada cuesta 12 pesos producirla y puede venderla a 20. Pero su compañera le ofrece hacerle publicidad a cambio del 10% de las ganancias. El estudiante debe decidir si acepta.",questions:["¿Cuántas limonadas necesita vender para recuperar la inversión?","¿Cuánto ganaría al día con y sin el acuerdo de publicidad?","¿Qué otros costos no visibles podría tener el negocio?","¿Cuándo conviene crecer rápido vs crecer sin deudas?"],evaluation:"El estudiante desarrolla un análisis de punto de equilibrio y proyección de ganancia a 2 semanas con y sin el acuerdo.",tips:"Añade una variable sorpresa: un día llueve y no puede vender. ¿Cómo afecta esto su plan?",xp:190,duration:"15 min" },
    ],
    Avanzado:[
      { title:"La crisis del presupuesto familiar",objective:"Analizar una situación financiera compleja y proponer soluciones con criterio.",scenario:"La familia de Andrés enfrenta una reducción del 30% en sus ingresos por 3 meses. Deben mantener: renta, alimentación, colegio y servicios. El estudiante recibe una tabla de gastos reales y debe proponer un plan de ajuste sin eliminar lo esencial, priorizando con criterio y negociando opciones.",questions:["¿Qué gastos son fijos y cuáles variables en esta tabla?","¿Cuáles cortarías primero y cuáles serían los últimos?","¿Qué opciones existen para reducir costos sin eliminar calidad de vida?","¿Cómo afecta esta crisis el bienestar emocional de la familia?"],evaluation:"El estudiante entrega un presupuesto ajustado con justificación de cada decisión y una estrategia de recuperación a 3 meses.",tips:"Conecta este caso con la situación económica real del país para darle contexto.",xp:275,duration:"20 min" },
    ],
  },
  tea: {
    Básico:[
      { title:"El trabajo de todos vs el trabajo de uno",objective:"Identificar y practicar la distribución equitativa de roles en un equipo.",scenario:"En un proyecto grupal de 4 personas, siempre es Valentina quien hace todo porque 'es más rápido hacerlo sola'. El grupo entregó bien pero Valentina está agotada y resentida. El estudiante debe rediseñar cómo funciona este equipo.",questions:["¿Qué les faltó acordar al principio del proyecto?","¿Qué tiene que hacer Valentina diferente la próxima vez?","¿Cómo establecerías roles claros para un equipo de 4?","¿Cuándo es válido hacer el trabajo de otro y cuándo no?"],evaluation:"El estudiante diseña un acta de equipo con roles, responsabilidades y criterio de calidad para el trabajo de cada miembro.",tips:"Pregúntale si alguna vez fue Valentina en un proyecto grupal.",xp:100,duration:"9 min" },
    ],
    Intermedio:[
      { title:"Dos líderes, un equipo",objective:"Gestionar el conflicto de liderazgo dentro de un equipo de trabajo.",scenario:"Lucas y Sofía ambos creen ser los líderes naturales del equipo. Proponen estrategias opuestas para el mismo proyecto. El equipo está paralizado porque nadie sabe a quién seguir. Quedan 2 días para la entrega.",questions:["¿Qué estrategia usarías para desbloquear al equipo?","¿Cómo decides entre dos propuestas igualmente válidas?","¿Qué diferencia hay entre tener razón y lograr que el equipo avance?","¿Cómo evitas que este conflicto afecte la relación después del proyecto?"],evaluation:"El estudiante propone un proceso de toma de decisión para el equipo (votación, criterios, mediación) y lo aplica al conflicto real.",tips:"Este caso es ideal para discutir en grupo después de la simulación individual.",xp:175,duration:"13 min" },
    ],
    Avanzado:[
      { title:"La entrega imposible",objective:"Liderar un equipo bajo presión extrema de tiempo con recursos limitados.",scenario:"El cliente cambió los requerimientos del proyecto 24 horas antes de la entrega. El equipo tiene 3 integrantes y uno está enfermo. El estudiante debe re-planificar, reasignar tareas y comunicar al cliente la nueva situación sin perder la relación.",questions:["¿Cuál es lo primero que haces en las próximas 2 horas?","¿Cómo priorizas qué se entrega y qué queda pendiente?","¿Cómo comunicas al cliente el cambio sin dañar la confianza?","¿Qué aprendes de esta situación para el próximo proyecto?"],evaluation:"El estudiante entrega un plan de acción de 24 horas con tareas, responsables y el borrador del mensaje al cliente.",tips:"Pon un cronómetro en la sesión para simular la presión real de tiempo.",xp:270,duration:"20 min" },
    ],
  },
  pen: {
    Básico:[
      { title:"¿Esto es verdad?",objective:"Desarrollar habilidades básicas de verificación de información.",scenario:"Carolina recibe por WhatsApp un video viral que dice que cierta fruta cura el cáncer. Sus padres ya la compraron. El estudiante debe guiar a Carolina para verificar si la información es confiable antes de compartirla.",questions:["¿Qué fuentes consultarías para verificar esta información?","¿Qué señales te indican que una fuente es confiable?","¿Por qué la gente comparte información sin verificarla?","¿Cómo le explicarías a un adulto que algo es falso sin ofenderlo?"],evaluation:"El estudiante crea un checklist de 5 preguntas para verificar cualquier información antes de creerla o compartirla.",tips:"Trae un ejemplo de noticia falsa real para que el proceso sea concreto.",xp:95,duration:"8 min" },
    ],
    Intermedio:[
      { title:"El debate de los dos lados",objective:"Construir argumentos para posiciones contrarias a la propia para comprender la complejidad.",scenario:"Mateo está convencido de que los teléfonos deberían prohibirse en las escuelas. El estudiante debe construir el argumento más fuerte posible A FAVOR del uso del teléfono en clase (aunque no esté de acuerdo) usando solo evidencia real.",questions:["¿Qué datos encontraste que no esperabas?","¿Cambió algo tu opinión después de hacer este ejercicio?","¿Cuál es la diferencia entre un hecho y una opinión?","¿Por qué es importante entender el argumento opuesto?"],evaluation:"El estudiante presenta 3 argumentos fundamentados a favor del uso del teléfono con fuentes reales citadas.",tips:"Haz que el estudiante defienda primero su posición original y luego la contraria. Luego compara.",xp:180,duration:"14 min" },
    ],
    Avanzado:[
      { title:"El dilema del whistleblower",objective:"Analizar dilemas éticos complejos donde los valores entran en conflicto.",scenario:"Isabela descubre que su mejor amiga está copiando en todos los exámenes. Si lo reporta, pierde la amistad y quizás se gana enemigos. Si no lo hace, es cómplice de algo que considera injusto. No hay respuesta correcta simple.",questions:["¿Qué valores están en conflicto en esta situación?","¿Qué harías y qué argumentos sostienen tu decisión?","¿Cambia tu respuesta si sabes que tu amiga lo necesita para no reprobar?","¿Qué consecuencias tiene cada opción a corto y largo plazo?"],evaluation:"El estudiante escribe un análisis ético de 3 párrafos: los valores en conflicto, su decisión justificada y las consecuencias previstas.",tips:"No hay respuesta correcta. Evalúa la calidad del razonamiento, no la decisión en sí.",xp:270,duration:"18 min" },
    ],
  },
  lid: {
    Básico:[
      { title:"El grupo sin dirección",objective:"Identificar las características básicas de un liderazgo efectivo.",scenario:"El equipo de Andrés tiene 5 personas, todos opinan al mismo tiempo y nadie escucha. Llevan 30 minutos y aún no empiezan. El estudiante debe identificar qué falta y proponer cómo tomará el liderazgo en la próxima reunión.",questions:["¿Qué está pasando en este equipo?","¿Qué haría un buen líder en los primeros 3 minutos?","¿Cuál es la diferencia entre mandar y liderar?","¿Qué harías tú si fueras el nuevo líder?"],evaluation:"El estudiante escribe el guión de los primeros 3 minutos de la reunión como nuevo líder.",tips:"Haz roleplay: tú juegas el rol del equipo desordenado y el estudiante practica el inicio.",xp:100,duration:"10 min" },
    ],
    Intermedio:[
      { title:"La decisión impopular",objective:"Tomar y comunicar decisiones difíciles que afectan al equipo.",scenario:"Camila es lidereza del grupo y debe asignar la tarea más difícil a su mejor amigo porque es el más competente. Sabe que él se molestará. Si no lo hace, el proyecto fallará. Debe comunicar la decisión de forma que preserve la relación y el compromiso.",questions:["¿Cómo justificas la decisión sin que parezca un castigo?","¿Cuándo es correcto hacer algo que sabes que va a molestar a alguien?","¿Cómo manejas la reacción negativa inicial?","¿Qué aprende el equipo cuando ven que el líder toma decisiones difíciles con integridad?"],evaluation:"El estudiante redacta el diálogo completo con su amigo: la comunicación de la decisión y el manejo de la reacción.",tips:"Evalúa el tono, no solo el contenido: ¿suena a imposición o a confianza?",xp:185,duration:"15 min" },
    ],
    Avanzado:[
      { title:"El líder que falló",objective:"Gestionar el fracaso como líder con responsabilidad y visión de recuperación.",scenario:"Sebastián lideró el proyecto más importante del año y falló. El equipo está desanimado, el cliente está molesto y la dirección del colegio quiere explicaciones. Él tiene 24 horas para revertir la percepción y presentar un plan de recuperación.",questions:["¿Cuál es lo primero que debe hacer un líder cuando falla?","¿Cómo asumir la responsabilidad sin destruir la confianza del equipo?","¿Qué diferencia hay entre una disculpa y un plan de acción?","¿Cómo conviertes un fracaso en un aprendizaje que te posiciona mejor?"],evaluation:"El estudiante produce: una disculpa auténtica, un diagnóstico de qué falló y un plan de recuperación de 5 días.",tips:"Pídele que lo presente como si fuera en tiempo real frente al cliente y al equipo.",xp:295,duration:"22 min" },
    ],
  },
  emo: {
    Básico:[
      { title:"La emoción en el semáforo",objective:"Identificar y nombrar emociones propias en situaciones cotidianas.",scenario:"Marcos se pone furioso porque le cambiaron el puesto en el salón sin avisarle. Golpea la silla y grita. El estudiante debe ayudar a Marcos a identificar qué emoción siente exactamente, de dónde viene y qué podría hacer diferente.",questions:["¿Qué emoción siente Marcos exactamente? ¿Es furia, miedo, sorpresa?","¿Dónde en el cuerpo siente esa emoción?","¿Qué provocó la reacción exagerada: el puesto o algo más?","¿Qué habría pasado si Marcos hiciera una pausa de 10 segundos?"],evaluation:"El estudiante crea un mapa emocional: situación → emoción real → reacción → alternativa efectiva.",tips:"Usa el ejercicio del semáforo: rojo (parar), amarillo (pensar), verde (actuar).",xp:110,duration:"9 min" },
    ],
    Intermedio:[
      { title:"El mensaje detrás del enojo",objective:"Desarrollar empatía identificando la emoción subyacente en comportamientos difíciles.",scenario:"Ana siempre llega tarde, interrumpe a los demás y parece no importarle nada. Sus compañeros están hartos. El estudiante debe investigar qué hay detrás de ese comportamiento antes de juzgarlo y proponer cómo acercarse a Ana de forma empática.",questions:["¿Qué podría estar pasando en la vida de Ana que no ves desde afuera?","¿Cuál es la diferencia entre empatía y excusar el comportamiento?","¿Cómo le hablarías a Ana para que se sintiera entendida, no atacada?","¿Qué necesitas de Ana para que el grupo funcione mejor?"],evaluation:"El estudiante escribe el diálogo de una conversación empática con Ana donde ambos expresan sus necesidades.",tips:"Pregunta si el estudiante ha sido Ana alguna vez. La reflexión personal hace el aprendizaje más profundo.",xp:185,duration:"14 min" },
    ],
    Avanzado:[
      { title:"La ruptura del equipo por tensión emocional",objective:"Gestionar conflictos interpersonales que amenazan el funcionamiento de un grupo.",scenario:"El equipo lleva 3 semanas trabajando bajo presión. Hoy estalló: dos miembros dejaron de hablarse, uno amenazó con irse y la tensión es insostenible. El estudiante debe actuar como mediador y restaurar las condiciones mínimas de colaboración.",questions:["¿Cuál es el error más común al mediar entre dos personas en conflicto?","¿Cómo creas un espacio donde ambas partes se sientan seguras?","¿Qué acuerdo mínimo necesitas lograr para que el equipo pueda continuar?","¿Cuándo un conflicto interpersonal es señal de un problema más profundo del equipo?"],evaluation:"El estudiante diseña un protocolo de mediación de 3 pasos y lo aplica al caso, justificando cada decisión.",tips:"Haz roleplay de mediación con tres estudiantes: mediador + dos partes en conflicto.",xp:285,duration:"22 min" },
    ],
  },
  dig: {
    Básico:[
      { title:"Mi identidad en internet",objective:"Reconocer qué información personal es segura compartir en línea.",scenario:"Valentina crea su primer perfil en una red social y quiere llenarlo todo: nombre completo, colegio, dirección, foto, número de teléfono. El estudiante debe ayudarla a decidir qué compartir de forma segura.",questions:["¿Qué información NUNCA deberías poner en un perfil público?","¿Por qué alguien que no conoces querría saber dónde estudias?","¿Cómo configurarías la privacidad de este perfil?","¿Qué información es útil para conectar vs cuál te hace vulnerable?"],evaluation:"El estudiante crea un perfil ejemplo con la información segura y justifica qué excluyó y por qué.",tips:"Muéstrale un perfil real de red social con configuración pública para que vea cuánta información hay.",xp:90,duration:"8 min" },
    ],
    Intermedio:[
      { title:"El ciberacoso silencioso",objective:"Identificar, documentar y responder efectivamente ante el ciberacoso.",scenario:"Camila nota que un grupo de WhatsApp excluye sistemáticamente a su compañera Ana, la ignoran en los mensajes, le envían memes burlándose de ella y cuando Ana se queja la llaman 'exagerada'. Camila quiere hacer algo pero no sabe cómo.",questions:["¿Por qué el acoso digital es más difícil de detectar que el físico?","¿Qué puede hacer Camila sin convertirse en objetivo también?","¿Cuándo y cómo se involucran los adultos?","¿Qué le dirías a Ana para que no se sienta sola?"],evaluation:"El estudiante diseña un plan de acción para Camila con 3 pasos concretos y predice las consecuencias de cada uno.",tips:"Este tema requiere crear un espacio de confianza antes de la sesión. Pregunta si ha visto esto en su entorno.",xp:175,duration:"14 min" },
    ],
    Avanzado:[
      { title:"La huella digital que no puedes borrar",objective:"Comprender las consecuencias a largo plazo de la identidad digital.",scenario:"Sebastián publicó hace 2 años un video burlándose de un maestro. Ahora está aplicando a una beca universitaria y el comité encontró el video. Le piden que explique. El estudiante debe ayudarlo a gestionar esta situación y reflexionar sobre la permanencia digital.",questions:["¿Qué haría Sebastián si tuviera la máquina del tiempo?","¿Cómo te preparas hoy para que tu huella digital de mañana sea un activo?","¿Qué diferencia hay entre privacidad y anonimato en internet?","¿Cuáles son tus 3 principales 'huellas digitales' actuales?"],evaluation:"El estudiante escribe una declaración personal (como la que escribiría Sebastián) y un plan de curación de su propia identidad digital.",tips:"Busca junto al estudiante su propio nombre en Google como ejercicio de apertura.",xp:270,duration:"18 min" },
    ],
  },
  tie: {
    Básico:[
      { title:"El domingo por la noche",objective:"Aprender a planificar la semana con anticipación para reducir el estrés.",scenario:"Es domingo 8 PM. Carlos tiene 3 entregas esta semana, un examen el jueves y entrenamiento el martes y jueves. No sabe por dónde empezar y está viendo Netflix. El estudiante debe ayudarlo a crear un plan semanal realista.",questions:["¿Qué pasa si Carlos sigue viendo Netflix 2 horas más?","¿Cuál entrega tiene que empezar hoy mismo?","¿Cómo distribuirías las tareas en los días disponibles?","¿Cuánto tiempo necesita reservar para descanso sin culpa?"],evaluation:"El estudiante crea el horario semanal de Carlos con bloques de estudio, descanso y actividades comprometidas.",tips:"Usa papel y lápiz para el horario físico: la escritura manual mejora la planificación.",xp:85,duration:"8 min" },
    ],
    Intermedio:[
      { title:"La trampa de la urgencia",objective:"Distinguir entre tareas urgentes e importantes para tomar mejores decisiones.",scenario:"Valentina tiene 4 tareas pendientes: responder mensajes de amigos (urgente), estudiar para el examen de mañana (importante), hacer el proyecto que entrega en 2 semanas (importante), y organizarse el cuarto que su mamá le pidió (urgente para su mamá). Solo tiene 3 horas.",questions:["¿Cuál es la diferencia entre urgente e importante?","¿En qué orden harías estas 4 tareas y por qué?","¿Cómo negocias con tu mamá sobre el cuarto sin crear conflicto?","¿Qué tarea de las 4 podrías eliminar o delegar?"],evaluation:"El estudiante aplica la Matriz de Eisenhower a las 4 tareas y justifica el orden de ejecución.",tips:"Lleva la matriz de Eisenhower impresa para que sea una herramienta que el estudiante se lleve.",xp:170,duration:"13 min" },
    ],
    Avanzado:[
      { title:"La semana imposible",objective:"Diseñar sistemas de productividad personal ante sobrecarga real.",scenario:"Isabela tiene simultáneamente: proyecto grupal que lidera, examen parcial en 3 asignaturas, compromiso familiar inevitable el viernes, entrenamiento lunes y miércoles, y acaba de aceptar otra responsabilidad sin darse cuenta de que no le cabe. Tiene 5 horas libres en toda la semana.",questions:["¿Cuál es el primer error que cometió Isabela antes de llegar a este punto?","¿Qué aprende un sistema de productividad que una lista de tareas no enseña?","¿Cuándo y cómo decir 'no' es la mejor decisión de productividad?","¿Qué compromisos eliminarías y cómo se lo comunicarías a los involucrados?"],evaluation:"El estudiante diseña el sistema de gestión semanal de Isabela y redacta el mensaje para declinar el compromiso extra.",tips:"Conecta esto con la vida real del estudiante: ¿Cuándo fue su propia 'semana imposible'?",xp:195,duration:"17 min" },
    ],
  },
  pro: {
    Básico:[
      { title:"¿Por qué se rompe siempre lo mismo?",objective:"Aplicar pensamiento causal básico para identificar la raíz de un problema.",scenario:"En el salón, cada semana se rompe el sacapuntas. Ya van tres en un mes. El director quiere comprar el cuarto. El estudiante debe investigar por qué se rompen antes de simplemente reemplazarlos.",questions:["¿Cuál es la diferencia entre el síntoma y la causa del problema?","¿Qué preguntas harías para descubrir por qué se rompen?","¿Cuál sería la solución que evita que el problema vuelva a ocurrir?","¿Cómo sabes que encontraste la causa real?"],evaluation:"El estudiante crea un diagrama de los 5 porqués para el problema del sacapuntas y propone la solución a la causa raíz.",tips:"El ejercicio de los '5 porqués' es una herramienta que el estudiante puede aplicar en cualquier área de su vida.",xp:100,duration:"9 min" },
    ],
    Intermedio:[
      { title:"El proyecto que todos odian",objective:"Diagnosticar y resolver problemas sistémicos en grupos de trabajo.",scenario:"El equipo entregó el proyecto a tiempo pero todos están agotados y molesto. El docente pregunta: '¿Saldrían con el mismo equipo otra vez?' Solo 2 de 5 dicen que sí. El estudiante debe diagnosticar qué falló sistémicamente y proponer mejoras.",questions:["¿Qué es más importante: entregar a tiempo o que el equipo esté bien?","¿Qué 3 cosas harías diferente desde el principio del próximo proyecto?","¿Cómo mides si un proceso fue exitoso más allá del resultado final?","¿Qué herramientas o acuerdos previos hubieran evitado el agotamiento?"],evaluation:"El estudiante diseña un 'manual de equipo' de una página con los acuerdos mínimos para el próximo proyecto.",tips:"Haz que el estudiante reflexione sobre un proyecto real suyo usando las mismas preguntas.",xp:185,duration:"14 min" },
    ],
    Avanzado:[
      { title:"La solución que creó un nuevo problema",objective:"Analizar efectos secundarios e implicaciones sistémicas de las soluciones.",scenario:"La escuela instaló cámaras para reducir el bullying. El bullying bajó un 40% en los pasillos, pero subió un 80% por redes sociales. El director dice que las cámaras funcionaron. El estudiante debe argumentar por qué es una solución incompleta y proponer un enfoque sistémico.",questions:["¿Por qué una solución que funciona en un área puede fallar en el sistema completo?","¿Cómo evaluarías si una intervención realmente resuelve el problema?","¿Qué otros efectos secundarios podría tener la solución actual?","¿Cuál sería un enfoque que ataque la causa del bullying, no solo sus manifestaciones?"],evaluation:"El estudiante entrega un análisis sistémico con efectos primarios y secundarios, y una propuesta de solución integral con 3 componentes.",tips:"Este caso conecta perfectamente con pensamiento de sistemas. Puedes introducir diagramas de retroalimentación.",xp:290,duration:"22 min" },
    ],
  },
};

function generateAICase(worldId:string, diff:"Básico"|"Intermedio"|"Avanzado", targetId:string, context:string):GenCase {
  const world = WORLDS.find(w=>w.id===worldId) ?? WORLDS[0];
  const bank  = CASE_BANK[worldId]?.[diff] ?? CASE_BANK.com.Intermedio;
  const base  = bank[Math.floor(Math.random()*bank.length)];
  const targetName = targetId==="all" ? "Todo el grupo (3°A · 3°B)" : TEACHER_DATA.find(s=>s.name.split(" ")[0].toLowerCase()===targetId)?.name ?? targetId;

  // If teacher provided context, personalise the scenario
  const scenario = context.trim()
    ? `${base.scenario}\n\nContexto adicional del docente: ${context.trim()}`
    : base.scenario;

  return {
    ...base,
    id:`case-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    scenario,
    worldId, worldName:world.name, worldEmoji:world.emoji,
    difficulty:diff, targetId, targetName,
    createdAt: new Date().toLocaleDateString("es-CO",{ day:"2-digit",month:"short",year:"numeric" }),
  };
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18, instant = false) {
  const [chars, setChars]   = useState("");
  const [done,  setDone]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const skip = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); setChars(text); setDone(true); }, [text]);

  useEffect(() => {
    if (instant) { setChars(text); setDone(true); return; }
    setChars(""); setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    timerRef.current = setInterval(() => {
      i++; setChars(text.slice(0, i));
      if (i >= text.length) { if(timerRef.current) clearInterval(timerRef.current); setDone(true); }
    }, speed);
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [text, speed, instant]);

  return { chars, done, skip };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AuthStep = "splash"|"role"|"login-s"|"login-t"|"reg-role"|"reg-s"|"reg-t";
type AppScreen = "home"|"map"|"skill"|"sim"|"results"|"dash"|"avatar"|"orion"|"teacher";

interface User {
  id:string; name:string; last:string; email:string; grade:string;
  hairColor:string; hairStyle:string; skinTone:string; shirtColor:string; pet:string;
  level:number; xp:number; coins:number; streak:number; role:"student"|"teacher";
  subject?:string; group?:string;
}

// ─── Datos semilla ────────────────────────────────────────────────────────────
const SEED_USERS: User[] = [
  // XP matches the level under the single rule level = floor(xp/500)+1 (see lib/progress.ts)
  { id:"s1", name:"Alejandro", last:"Torres",  email:"alejandro@demo.com",  grade:"1°A", hairColor:"#2C1810", hairStyle:"A", skinTone:"#FDBCB4", shirtColor:"#6D28D9", pet:"🐶", level:7,  xp:3250, coins:340, streak:5,  role:"student" },
  { id:"s2", name:"Valentina", last:"Ruiz",    email:"valentina@demo.com",  grade:"1°A", hairColor:"#1A1A2E", hairStyle:"B", skinTone:"#D08B5B", shirtColor:"#DC2626", pet:"🐱", level:9,  xp:4200, coins:620, streak:12, role:"student" },
  { id:"s3", name:"Mateo",     last:"González",email:"mateo@demo.com",      grade:"1°B", hairColor:"#8B4513", hairStyle:"C", skinTone:"#AE8B6A", shirtColor:"#059669", pet:"🐸", level:5,  xp:2300, coins:210, streak:2,  role:"student" },
  { id:"s4", name:"Isabela",   last:"Moreno",  email:"isabela@demo.com",    grade:"1°A", hairColor:"#1A1A2E", hairStyle:"D", skinTone:"#614335", shirtColor:"#0284C7", pet:"🦄", level:11, xp:5250, coins:880, streak:21, role:"student" },
  { id:"s5", name:"Sebastián", last:"Vargas",  email:"sebastian@demo.com",  grade:"1°B", hairColor:"#FFD700", hairStyle:"A", skinTone:"#EDB98A", shirtColor:"#D97706", pet:"🦊", level:4,  xp:1700, coins:130, streak:1,  role:"student" },
  { id:"s6", name:"Camila",    last:"Jiménez", email:"camila@demo.com",     grade:"1°B", hairColor:"#DC143C", hairStyle:"B", skinTone:"#FDBCB4", shirtColor:"#BE185D", pet:"🐼", level:8,  xp:3600, coins:490, streak:9,  role:"student" },
  { id:"t1", name:"Ana",       last:"García",  email:"docente@demo.com",    grade:"",    hairColor:"#1A1A2E", hairStyle:"B", skinTone:"#EDB98A", shirtColor:"#0284C7", pet:"",   level:1,  xp:0,    coins:0,   streak:0,  role:"teacher", subject:"Ciencias Sociales", group:"1°A · 1°B" },
];

const HAIR_COLORS  = ["#2C1810","#8B4513","#FFD700","#DC143C","#1A1A2E","#4169E1","#6A0DAD","#F5F5F5"];
const HAIR_STYLES  = ["A","B","C","D"];
const SKIN_TONES   = ["#FDBCB4","#EDB98A","#D08B5B","#AE8B6A","#614335","#3D1A00"];
const SHIRT_COLORS = ["#6D28D9","#DC2626","#059669","#0284C7","#D97706","#BE185D","#374151","#0E7490"];
const PETS = ["🐶","🐱","🐸","🦊","🐼","🦄","🐉","🦋","🐧","🦁","✨","⛔"];

const GRADES = ["1°A","1°B","2°A","2°B","3°A","3°B","4°A","4°B","5°A","5°B"];

const WORLDS = [
  { id:"com", emoji:"🗣️", name:"Comunicación",           from:P.v2, to:P.v1 },
  { id:"fin", emoji:"💰", name:"Ed. Financiera",          from:P.a2, to:P.a1 },
  { id:"tea", emoji:"🤝", name:"Trabajo en Equipo",       from:P.g2, to:P.g1 },
  { id:"emo", emoji:"❤️", name:"Int. Emocional",          from:P.p2, to:P.p1 },
  { id:"lid", emoji:"👑", name:"Liderazgo",               from:P.a3, to:P.a1 },
  { id:"pen", emoji:"💡", name:"Pensamiento Crítico",     from:P.c2, to:P.c1 },
  { id:"cre", emoji:"🎨", name:"Creatividad",             from:P.p3, to:P.p1 },
  { id:"inn", emoji:"🚀", name:"Innovación",              from:"#4F46E5", to:"#312E81" },
  { id:"dig", emoji:"💻", name:"Comp. Digitales",         from:P.c3, to:P.c1 },
  { id:"emp", emoji:"🌱", name:"Emprendimiento",          from:P.g3, to:P.g1 },
  { id:"tie", emoji:"📚", name:"Gestión del Tiempo",      from:"#EA580C", to:"#7C2D12" },
  { id:"pro", emoji:"🧠", name:"Resolución de Problemas", from:"#9333EA", to:"#581C87" },
];

const WORLD_DESC: Record<string,string> = {
  com:"Expresa tus ideas, escucha y resuelve conflictos.", fin:"Administra tu dinero y enfrenta imprevistos.",
  tea:"Coordina, reparte roles y logra metas en grupo.", emo:"Reconoce y regula tus emociones.",
  lid:"Inspira y guía a otros en momentos clave.", pen:"Analiza información y separa hechos de opiniones.",
  cre:"Convierte ideas en propuestas originales.", inn:"Crea soluciones para problemas reales.",
  dig:"Protege tu información y comunícate en línea.", emp:"Diseña y presenta tu primer proyecto.",
  tie:"Organiza tus tareas y prioridades.", pro:"Resuelve casos con método, paso a paso.",
};

// ─── Image pool ───────────────────────────────────────────────────────────────
const I = {
  class : "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=360&fit=crop&auto=format",
  pres  : "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=360&fit=crop&auto=format",
  write : "https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=600&h=360&fit=crop&auto=format",
  office: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=360&fit=crop&auto=format",
  team  : "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=360&fit=crop&auto=format",
  coins : "https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=600&h=360&fit=crop&auto=format",
  money : "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=600&h=360&fit=crop&auto=format",
  brain : "https://images.unsplash.com/photo-1586936893354-362ad6ae47ba?w=600&h=360&fit=crop&auto=format",
  group : "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=600&h=360&fit=crop&auto=format",
  study : "https://images.unsplash.com/photo-1581726690015-c9861fa5057f?w=600&h=360&fit=crop&auto=format",
  note  : "https://images.unsplash.com/photo-1576595580361-90a855b84b20?w=600&h=360&fit=crop&auto=format",
  sticky: "https://images.unsplash.com/photo-1623652554515-91c833e3080e?w=600&h=360&fit=crop&auto=format",
  debate: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=360&fit=crop&auto=format",
  hand  : "https://images.unsplash.com/photo-1581726707445-75cbe4efc586?w=600&h=360&fit=crop&auto=format",
};

// ─── Missions per world ───────────────────────────────────────────────────────
type MissionDiff = "Básico" | "Intermedio" | "Avanzado";
interface MissionItem { id:string; emoji:string; title:string; desc:string; dur:string; diff:MissionDiff; xp:number; img:string; }

const WORLD_MISSIONS: Record<string, MissionItem[]> = {
  com: [
    { id:"com-1", emoji:"🎤", title:"Presentación frente al salón",   desc:"Explica una idea ante tus compañeros y convéncelos con claridad y seguridad.",     dur:"8 min",  diff:"Intermedio", xp:150, img:I.class  },
    { id:"com-2", emoji:"🎙️", title:"Mi primer podcast",               desc:"Elige cómo empezar un audio para contarle a tu salón sobre el huerto del colegio.",       dur:"10 min", diff:"Básico",     xp:90,  img:I.write  },
    { id:"com-3", emoji:"⚡",  title:"Debate de actualidad",            desc:"Defiende tu posición con argumentos sólidos en un debate acalorado.",              dur:"12 min", diff:"Avanzado",   xp:250, img:I.pres   },
    { id:"com-4", emoji:"🤝", title:"Negociación efectiva",            desc:"Llega a un acuerdo con alguien que tiene una postura completamente diferente.",     dur:"9 min",  diff:"Intermedio", xp:180, img:I.office },
  ],
  fin: [
    { id:"fin-1", emoji:"💳", title:"Mi presupuesto mensual",          desc:"Planifica tus gastos e ingresos para el mes con metas reales y concretas.",         dur:"7 min",  diff:"Básico",     xp:100, img:I.coins  },
    { id:"fin-2", emoji:"📈", title:"Inversión inteligente",           desc:"Compara inversiones simuladas y protege el dinero que vas a necesitar pronto.",          dur:"12 min", diff:"Avanzado",   xp:280, img:I.money  },
    { id:"fin-3", emoji:"🏦", title:"Plan de ahorro con metas",        desc:"Define objetivos de ahorro reales y diseña estrategias para alcanzarlos.",           dur:"6 min",  diff:"Básico",     xp:85,  img:I.note   },
    { id:"fin-4", emoji:"🛒", title:"Mi primer emprendimiento",        desc:"Calcula costos y ajusta cuánta limonada prepararás para la feria.",             dur:"14 min", diff:"Intermedio", xp:210, img:I.group  },
  ],
  tea: [
    { id:"tea-1", emoji:"👥", title:"Proyecto colaborativo",           desc:"Trabaja con tu equipo para entregar un proyecto desafiante en tiempo récord.",       dur:"10 min", diff:"Intermedio", xp:160, img:I.team   },
    { id:"tea-2", emoji:"🚨", title:"Crisis en el equipo",             desc:"Un miembro abandona el grupo a mitad del proyecto. ¿Cómo reorganizas a todos?",     dur:"8 min",  diff:"Avanzado",   xp:260, img:I.group  },
    { id:"tea-3", emoji:"📋", title:"Distribución de roles",           desc:"Asigna el rol ideal a cada miembro del equipo según sus fortalezas únicas.",         dur:"5 min",  diff:"Básico",     xp:90,  img:I.sticky },
    { id:"tea-4", emoji:"🏆", title:"Competencia interescolar",        desc:"Lidera a tu equipo para ganar la competencia regional más reñida del año.",          dur:"12 min", diff:"Intermedio", xp:200, img:I.pres   },
  ],
  emo: [
    { id:"emo-1", emoji:"🧘", title:"Gestión del estrés",              desc:"Aplica técnicas probadas para manejar momentos de alta presión emocional.",          dur:"7 min",  diff:"Básico",     xp:110, img:I.study  },
    { id:"emo-2", emoji:"💔", title:"Resolución de conflictos",        desc:"Transforma un conflicto real en una oportunidad de crecimiento personal.",           dur:"10 min", diff:"Intermedio", xp:175, img:I.office },
    { id:"emo-3", emoji:"🫂", title:"Empatía en acción",               desc:"Comprende y valida los sentimientos de alguien que está pasando un momento difícil.", dur:"8 min",  diff:"Intermedio", xp:190, img:I.team   },
    { id:"emo-4", emoji:"😤", title:"Control emocional extremo",       desc:"Mantén la calma en una situación de máxima presión grupal sin perder el hilo.",      dur:"10 min", diff:"Avanzado",   xp:270, img:I.class  },
  ],
  lid: [
    { id:"lid-1", emoji:"🎯", title:"Decisión bajo presión",           desc:"Coordina al grupo ante un cambio en el embarque de una excursión.",      dur:"8 min",  diff:"Intermedio", xp:185, img:I.office },
    { id:"lid-2", emoji:"🗺️", title:"Visión estratégica",              desc:"Diseña el plan a largo plazo para alcanzar una meta ambiciosa con tu equipo.",       dur:"12 min", diff:"Avanzado",   xp:295, img:I.brain  },
    { id:"lid-3", emoji:"📢", title:"Motivar al equipo",               desc:"Tu equipo está desanimado justo antes del momento más importante. Inspíralos.",       dur:"7 min",  diff:"Intermedio", xp:200, img:I.team   },
    { id:"lid-4", emoji:"🔥", title:"Liderazgo en crisis",             desc:"Un proyecto falla y tú eres el responsable. ¿Cómo asumes la situación?",             dur:"14 min", diff:"Avanzado",   xp:310, img:I.pres   },
  ],
  pen: [
    { id:"pen-1", emoji:"🔍", title:"Análisis de noticias falsas",     desc:"Verifica la fuente y la fecha de un aviso antes de compartirlo.",     dur:"7 min",  diff:"Básico",     xp:95,  img:I.note   },
    { id:"pen-2", emoji:"⚖️", title:"Dilema ético",                    desc:"Toma una decisión difícil cuando no existe una respuesta correcta ni fácil.",         dur:"9 min",  diff:"Intermedio", xp:175, img:I.debate },
    { id:"pen-3", emoji:"🧩", title:"Resolución de paradojas",         desc:"Encuentra la lógica oculta en situaciones aparentemente imposibles de resolver.",     dur:"11 min", diff:"Avanzado",   xp:265, img:I.brain  },
    { id:"pen-4", emoji:"📊", title:"Datos vs opinión",                desc:"Aprende a separar hechos de juicios en un debate cargado de emociones.",              dur:"8 min",  diff:"Intermedio", xp:190, img:I.pres   },
  ],
  cre: [
    { id:"cre-1", emoji:"✏️", title:"Diseña tu idea en 5 minutos",     desc:"Convierte un problema cotidiano en un producto o servicio innovador.",               dur:"5 min",  diff:"Básico",     xp:100, img:I.sticky },
    { id:"cre-2", emoji:"🎭", title:"Teatro improvisado",              desc:"Crea una escena dramática en tiempo real sin guión y sin ensayos previos.",           dur:"8 min",  diff:"Intermedio", xp:180, img:I.class  },
    { id:"cre-3", emoji:"🎵", title:"Escribe una canción",             desc:"Expresa una emoción compleja a través de letra, ritmo y melodía propios.",            dur:"12 min", diff:"Intermedio", xp:195, img:I.write  },
    { id:"cre-4", emoji:"🖼️", title:"Pitch creativo",                  desc:"Presenta tu idea en 90 segundos de la manera más memorable e impactante posible.",   dur:"10 min", diff:"Avanzado",   xp:275, img:I.pres   },
  ],
  inn: [
    { id:"inn-1", emoji:"💡", title:"Hackathon escolar",               desc:"Crea una solución tecnológica a un problema real de tu comunidad en tiempo récord.",  dur:"14 min", diff:"Avanzado",   xp:290, img:I.brain  },
    { id:"inn-2", emoji:"🤖", title:"Diseña una app útil",             desc:"Prototipa una aplicación que resuelva una necesidad que nadie ha atendido aún.",      dur:"12 min", diff:"Avanzado",   xp:285, img:I.office },
    { id:"inn-3", emoji:"🌱", title:"Startup en 5 minutos",            desc:"Crea el modelo mínimo de tu empresa en tiempo récord ante inversores reales.",        dur:"5 min",  diff:"Intermedio", xp:200, img:I.sticky },
    { id:"inn-4", emoji:"🔧", title:"Solución inesperada",             desc:"Resuelve un problema cotidiano de la forma más creativa e ingeniosa posible.",        dur:"7 min",  diff:"Básico",     xp:105, img:I.group  },
  ],
  dig: [
    { id:"dig-1", emoji:"🔐", title:"Seguridad en internet",           desc:"Identifica amenazas digitales reales y aprende a proteger tu información.",           dur:"7 min",  diff:"Básico",     xp:90,  img:I.study  },
    { id:"dig-2", emoji:"📱", title:"Tu huella digital",               desc:"Descubre qué información tuya está disponible en internet y cómo gestionarla.",       dur:"9 min",  diff:"Intermedio", xp:170, img:I.note   },
    { id:"dig-3", emoji:"💻", title:"Crea una página web",             desc:"Diseña y publica tu primer sitio web con un propósito real y concreto.",              dur:"15 min", diff:"Avanzado",   xp:275, img:I.office },
    { id:"dig-4", emoji:"📧", title:"Comunicación digital pro",        desc:"Redacta un correo claro para pedir información sobre un taller de robótica.",     dur:"6 min",  diff:"Básico",     xp:95,  img:I.write  },
  ],
  emp: [
    { id:"emp-1", emoji:"🛒", title:"Mi primer negocio",               desc:"Define tu producto, cliente ideal y precio de venta con una propuesta de valor.",      dur:"8 min",  diff:"Básico",     xp:105, img:I.coins  },
    { id:"emp-2", emoji:"📊", title:"Plan de negocios express",        desc:"Crea el esqueleto completo de tu empresa en una sola hoja estratégica.",              dur:"12 min", diff:"Intermedio", xp:200, img:I.office },
    { id:"emp-3", emoji:"🎯", title:"Conoce a tu cliente ideal",       desc:"Entrevista a tu cliente potencial y descubre sus necesidades más profundas.",          dur:"9 min",  diff:"Básico",     xp:110, img:I.team   },
    { id:"emp-4", emoji:"🚀", title:"Pitch de inversión",              desc:"Convence a un panel de inversores reales de apostar por tu idea en 3 minutos.",       dur:"14 min", diff:"Avanzado",   xp:305, img:I.pres   },
  ],
  tie: [
    { id:"tie-1", emoji:"⏰", title:"Las prioridades del día",         desc:"Ordena tus pendientes según su importancia y la fecha de entrega.",         dur:"5 min",  diff:"Básico",     xp:85,  img:I.note   },
    { id:"tie-2", emoji:"📅", title:"Planificación semanal",           desc:"Diseña tu semana perfecta equilibrando estudio, descanso y actividades.",             dur:"8 min",  diff:"Básico",     xp:95,  img:I.study  },
    { id:"tie-3", emoji:"⚡",  title:"Productividad máxima",            desc:"Prueba bloques de enfoque y ajústalos según las distracciones que observes.",         dur:"10 min", diff:"Intermedio", xp:175, img:I.write  },
    { id:"tie-4", emoji:"🎯", title:"Hábitos de alto rendimiento",     desc:"Diseña una rutina mañanera de élite que transforme tu vida académica.",               dur:"9 min",  diff:"Intermedio", xp:185, img:I.office },
  ],
  pro: [
    { id:"pro-1", emoji:"🔍", title:"El caso del salón",               desc:"Sigue el registro de materiales para localizar un cronómetro perdido.",          dur:"7 min",  diff:"Básico",     xp:100, img:I.class  },
    { id:"pro-2", emoji:"🧩", title:"Puzzle grupal de lógica",         desc:"Resuelve un acertijo complejo colaborando estratégicamente con tu equipo.",           dur:"10 min", diff:"Intermedio", xp:190, img:I.brain  },
    { id:"pro-3", emoji:"🌊", title:"Crisis y plan de acción",         desc:"Tu comunidad enfrenta una emergencia. Lidera la respuesta inmediata.",                dur:"12 min", diff:"Avanzado",   xp:275, img:I.group  },
    { id:"pro-4", emoji:"💡", title:"Innovar para resolver",           desc:"Diseña una solución original para un problema que parece no tener salida.",           dur:"11 min", diff:"Avanzado",   xp:290, img:I.sticky },
  ],
};

const MISSION_SCRIPTS = new Map(WORLDS.flatMap(world =>
  (WORLD_MISSIONS[world.id] ?? []).map(mission => [
    mission.id,
    mission.id === COM1_SCRIPT.id ? COM1_SCRIPT : createMissionScript(mission.id, mission.title, world.name),
  ] as const),
));

function getScript(missionId: string): MissionScript {
  const script = MISSION_SCRIPTS.get(missionId);
  if (!script) throw new Error(`No se encontró el guion de ${missionId}`);
  return script;
}

// Two separate array references — recharts keys SVG children by array identity;
// sharing one array causes duplicate key collisions between PolarGrid and PolarAngleAxis.
const mkRadar = () => [
  { skill:"Comunicación", value:72 },{ skill:"Finanzas", value:45 },
  { skill:"Trabajo Eq.",  value:88 },{ skill:"Empatía",  value:60 },
  { skill:"Pensamiento",  value:55 },{ skill:"Creatividad", value:40 },
];
const RADAR_DATA         = mkRadar(); // student dashboard
const RADAR_DATA_TEACHER = mkRadar(); // teacher panel

const TEACHER_DATA = [
  { name:"Alejandro T.", avatar:"s1", alert:false, com:72, lid:58, emp:64, pen:55, missions:14, streak:5,  level:7 },
  { name:"Valentina R.", avatar:"s2", alert:false, com:88, lid:74, emp:90, pen:70, missions:22, streak:12, level:9 },
  { name:"Mateo G.",     avatar:"s3", alert:true,  com:42, lid:30, emp:50, pen:38, missions:9,  streak:2,  level:5 },
  { name:"Isabela M.",   avatar:"s4", alert:false, com:95, lid:89, emp:82, pen:91, missions:31, streak:21, level:11 },
  { name:"Sebastián V.", avatar:"s5", alert:true,  com:35, lid:25, emp:42, pen:30, missions:6,  streak:1,  level:4 },
  { name:"Camila J.",    avatar:"s6", alert:false, com:78, lid:65, emp:80, pen:60, missions:19, streak:9,  level:8 },
];

const BADGES = [
  { emoji:"🌟", icon:"star",   name:"Primera misión" },{ emoji:"🔥", icon:"flame", name:"Racha 5 días" },
  { emoji:"🏆", icon:"trophy", name:"Top 10 ranking" },{ emoji:"💡", icon:"bulb",  name:"Pensador crítico" },
  { emoji:"🎯", icon:"target", name:"Sin errores"    },{ emoji:"⚡", icon:"zap",   name:"Velocista"       },
];

const CONFETTI_COLORS = [P.v3,P.a3,P.g3,P.r3,P.c3,P.p3];
const CONFETTI = Array.from({ length:60 }, (_,i) => ({
  left:`${((i*7+3)*13)%100}%`, delay:`${(i*.042)%2}s`,
  dur:`${1.1+(i*.031)%1.4}s`, color:CONFETTI_COLORS[i%6],
  size:5+(i%7), rot:(i*37)%360,
}));
const STARS = Array.from({ length:50 }, (_,i) => ({
  top:`${((i*11+7)*19)%100}%`, left:`${((i*13+3)*17)%100}%`,
  sz:1+(i%3), op:.05+((i*7)%20)/100, d:`${(i*.3)%4}s`, dur:`${2+(i*.18)%3}s`,
}));

// ─── Minimal UI helpers ───────────────────────────────────────────────────────
const card = { background: P.s1, borderColor: P.border } as const;

function LXLogo({ size=32 }:{ size?:number }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="LifeXperience" role="img">
      <span className="font-black leading-none" aria-hidden="true" style={{ fontSize:size*.95, letterSpacing:"-3px", background:`linear-gradient(135deg,${P.v4},${P.v2} 55%,${P.c3})`, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>LX</span>
      <span className="font-black tracking-wide uppercase" aria-hidden="true" style={{ fontSize:size*.36, color:P.text }}>Life<span style={{ color:P.v4 }}>xperience</span></span>
    </div>
  );
}

// Level, XP-in-level and bar width all come from getLevelInfo(xp) — one rule everywhere.
function XPBar({ xp, size="sm" }:{ xp:number; size?:"sm"|"lg" }) {
  const li = getLevelInfo(xp);
  return (
    <div>
      <div className={`flex justify-between mb-1.5 ${size==="lg"?"text-sm":"text-xs"}`}><span className="font-semibold" style={{ color:P.text }}>Nivel {li.level}</span><span style={{ color:P.a4 }}>{li.xpInLevel}/{li.xpForLevel} XP</span></div>
      <div role="progressbar" aria-label={`Progreso hacia el nivel ${li.level+1}`} aria-valuemin={0} aria-valuemax={li.xpForLevel} aria-valuenow={li.xpInLevel} aria-valuetext={`Nivel ${li.level}: ${li.xpInLevel} de ${li.xpForLevel} XP. Faltan ${li.xpToNext} XP para el nivel ${li.level+1}.`}
        className={`w-full ${size==="lg"?"h-3":"h-2"} rounded-full overflow-hidden`} style={{ background:"rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full" style={{ width:`${li.pct}%`, background:g(P.a2,P.a4,"90deg"), transition:"width 1s ease" }}/>
      </div>
      {size==="lg"&&<p className="text-xs mt-1.5" style={{ color:P.muted }}>Te faltan {li.xpToNext} XP para el nivel {li.level+1}</p>}
    </div>
  );
}

function DemoChip({ label="Datos demo" }:{ label?:string }) {
  return <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border align-middle" style={{ color:"#FCD34D", borderColor:"rgba(252,211,77,.45)", background:"rgba(252,211,77,.08)" }}>{label}</span>;
}

function Toggle({ checked, onChange, label, desc, icon }:{ checked:boolean; onChange:(v:boolean)=>void; label:string; desc?:string; icon?:React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={()=>onChange(!checked)}
      className="w-full min-h-11 flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-colors"
      style={{ background:checked?"rgba(139,92,246,.14)":P.s2, borderColor:checked?P.v3:P.border }}>
      {icon&&<span aria-hidden="true" style={{ color:checked?P.v4:P.muted }}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color:P.text }}>{label}</span>
        {desc&&<span className="block text-xs mt-0.5" style={{ color:P.muted }}>{desc}</span>}
      </span>
      <span className="text-xs font-bold w-20 text-right" style={{ color:checked?P.v4:P.muted }}>{checked?"Activado":"Desactivado"}</span>
      <span aria-hidden="true" className="relative w-10 h-6 rounded-full flex-shrink-0" style={{ background:checked?P.v3:"rgba(255,255,255,.18)" }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left:checked?"20px":"4px" }}/>
      </span>
    </button>
  );
}

function Skill({ label, value, gain, color=P.v3 }:{ label:string; value:number; gain?:number; color?:string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color:"rgba(240,246,255,.75)" }}>{label}</span>
        <div className="flex gap-2">{gain!==undefined&&<span className="font-black" style={{ color:P.g3 }}>+{gain}</span>}<span className="font-bold" style={{ color }}>{value}%</span></div>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${value}%`, background:`linear-gradient(90deg,${color}99,${color})`, boxShadow:`0 0 5px ${color}55` }}/>
      </div>
    </div>
  );
}

function StatPill({ icon, val, label, color }:{ icon:React.ReactNode; val:string; label:string; color:string }) {
  return (
    <div className="rounded-2xl p-4 text-center border" style={card}>
      <div className="mb-1 flex justify-center" style={{ color }}>{icon}</div>
      <div className="font-black text-lg" style={{ color }}>{val}</div>
      <div className="text-xs mt-0.5" style={{ color:P.muted }}>{label}</div>
    </div>
  );
}

function DiffBadge({ level }:{ level:"Básico"|"Intermedio"|"Avanzado" }) {
  const m = { Básico:[P.g3,"rgba(16,185,129,.18)"], Intermedio:[P.a3,"rgba(245,158,11,.18)"], Avanzado:[P.r3,"rgba(239,68,68,.18)"] };
  const [c, bg] = m[level];
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color:c, background:bg, borderColor:`${c}44` }}>{level}</span>;
}

function BackArrow({ onClick, label="Volver" }:{ onClick:()=>void; label?:string }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border hover:bg-white/5 transition-colors" style={{ background:P.s2, borderColor:P.border, color:P.text }}><ArrowLeft size={18}/></button>;
}

function InputField({ label, type="text", value, onChange, placeholder, error, hint, right, onKeyDown }:any) {
  return (
    <div className="mb-4">
      {label&&<label className="block text-xs font-bold mb-1.5" style={{ color:P.muted }}>{label}</label>}
      <div className="relative">
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} aria-label={label} aria-invalid={!!error}
          className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none transition-all"
          style={{ background:P.s2, borderColor:error?"#EF4444":P.border, color:P.text }}
          onFocus={e=>{(e.target as HTMLElement).style.borderColor=P.v3}}
          onBlur={e=>{(e.target as HTMLElement).style.borderColor=error?"#EF4444":P.border}}
        />
        {right&&<div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error&&<p className="text-xs mt-1" style={{ color:P.r3 }}>{error}</p>}
      {hint&&!error&&<p className="text-xs mt-1" style={{ color:P.muted }}>{hint}</p>}
    </div>
  );
}

function PrimaryBtn({ children, onClick, full=false, variant="violet", disabled=false, size="md" }:any) {
  const bgs:Record<string,string> = { violet:g(P.v2,P.v1), cyan:g(P.v2,P.v1), green:g(P.g2,P.g1), ghost:"rgba(255,255,255,0.06)" };
  const shads:Record<string,string> = { violet:SHADOW.action, cyan:SHADOW.action, green:"0 6px 16px rgba(5,150,105,.3)", ghost:"none" };
  const pad = size==="lg"?"py-4 px-8 text-base font-black":size==="sm"?"py-1.5 px-4 text-xs font-bold":"py-3 px-6 text-sm font-bold";
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${full?"w-full":""} ${pad} ${disabled?"opacity-50 cursor-not-allowed":""} text-white`}
      style={{ background:bgs[variant], boxShadow:shads[variant], border:variant==="ghost"?`1px solid ${P.border}`:"none" }}>
      {children}
    </button>
  );
}


// ─── Mission engine (shared by student and teacher practice) ──────────────────
type SimPhase = "intro"|"narrate"|"dialogue"|"choices"|"consequence"|"chosen"|"result";
type ScenePlayback = "idle"|"playing"|"paused"|"complete";
const PHASE_LABEL: Record<SimPhase,string> = {
  intro:"Antes de empezar", narrate:"Situación", dialogue:"Diálogo",
  choices:"Tu decisión", consequence:"Consecuencia", chosen:"Reacción", result:"Resultado",
};
const BONUS_SECONDS = 10;
const BONUS_XP = 15;

interface Decision { sceneId:string; choiceId:string; quality:ChoiceQuality; text:string; at:number }
/** Everything needed to resume a mission exactly where it was left (session only). */
interface MissionRun {
  worldId:string; missionId:string;
  sceneId:string; phase:SimPhase; path:string|null;
  decisions:Decision[]; hints:HintRecord[];
  lastChoice:SceneChoice|null;
  bonusXP:number; lastBonus:number;
  orionOpen:boolean; reread:boolean; supportRequested:boolean;
}
type DoneMap = Record<string,{ score:number; xp:number; path:string }>;
interface MissionResult extends Reward {
  missionId:string; missionTitle:string; missionEmoji:string; worldId:string;
  outcome:MissionOutcome; score:number; negatives:number; hintsUsed:number;
  coinsTotal:number; practice:boolean;
}

function findMission(worldId:string, missionId:string): MissionItem|null {
  return (WORLD_MISSIONS[worldId] ?? []).find(m=>m.id===missionId) ?? null;
}

/** Applies the single XP→level rule to a stored user (see lib/progress.ts). */
function reconcileUser(user: User): User {
  if (user.role !== "student") return user;
  const r = reconcileProgress(user.xp, user.level);
  return { ...user, xp:r.xp, level:r.level };
}

function makePracticeUser(): User {
  return { id:"practice", name:"Estudiante", last:"de práctica", email:"practica@local", grade:"Vista docente",
    hairColor:"#1A1A2E", hairStyle:"C", skinTone:"#EDB98A", shirtColor:"#0E7490", pet:"🦉",
    level:1, xp:0, coins:0, streak:0, role:"student" };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [authStep, setAuthStep]       = useState<AuthStep>("splash");
  const [currentUser, setCurrentUser] = useState<User|null>(null);
  const [authLoading, setAuthLoading] = useState(true); // checking session on mount

  const [lEmail, setLEmail]   = useState("");
  const [lPw, setLPw]         = useState("");
  const [lError, setLError]   = useState("");
  const [lLoading, setLLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const [rName, setRName]     = useState("");
  const [rLast, setRLast]     = useState("");
  const [rEmail, setREmail]   = useState("");
  const [rPw, setRPw]         = useState("");
  const [rPw2, setRPw2]       = useState("");
  const [rGrade, setRGrade]   = useState("3°A");
  const [rHair, setRHair]     = useState(HAIR_COLORS[0]);
  const [rHairSt, setRHairSt] = useState("A");
  const [rSkin, setRSkin]     = useState(SKIN_TONES[0]);
  const [rShirt, setRShirt]   = useState(SHIRT_COLORS[0]);
  const [rPet, setRPet]       = useState("🐶");
  const [rSubj, setRSubj]     = useState("");
  const [rGrp, setRGrp]       = useState("3°A · 3°B");
  const [rErrors, setRErrors] = useState<Record<string,string>>({});
  const [rStep, setRStep]     = useState(1);

  const [appScreen, setAppScreen]         = useState<AppScreen>("home");
  const [selectedWorld, setSelectedWorld] = useState<typeof WORLDS[0]|null>(null);
  const [confetti, setConfetti]           = useState(false);
  const [expandedS, setExpandedS]         = useState<string|null>(null);
  // Teacher AI case generator state
  type TeacherTab = "dashboard"|"ai"|"plans";
  const [teacherTab, setTeacherTab]       = useState<TeacherTab>("dashboard");
  const [caseWorldId, setCaseWorldId]     = useState("com");
  const [caseDiff, setCaseDiff]           = useState<"Básico"|"Intermedio"|"Avanzado">("Intermedio");
  const [caseTarget, setCaseTarget]       = useState("all");
  const [caseContext, setCaseContext]     = useState("");
  const [generatedCase, setGeneratedCase] = useState<GenCase|null>(null);
  const [caseGenerating, setCaseGenerating] = useState(false);
  const [studentPlans, setStudentPlans]   = useState<Record<string,GenCase[]>>({});

  // General Orion conversation: session-only and independent from mission progress.
  const [orionChat, setOrionChat]         = useState<OrionChatMessage[]>([]);


  const [avTab, setAvTab]       = useState<"char"|"pet">("char");

  // Demo accounts live in memory for the whole browser session, so progress
  // survives logout/login and can be compared before/after a teacher practice.
  const [demoProfiles, setDemoProfiles] = useState<Record<string,User>>(() =>
    Object.fromEntries(SEED_USERS.map(su => [su.id, reconcileUser(su)])));
  const [sessionSource, setSessionSource] = useState<"supabase"|"demo">("demo");

  // Real student progress
  const [studentRun, setStudentRun]       = useState<MissionRun|null>(null);
  const [doneMissions, setDoneMissions]   = useState<DoneMap>({});
  // Teacher practice ("Probar como estudiante") — fully separate state
  const [practiceUser, setPracticeUser]   = useState<User|null>(null);
  const [practiceRun, setPracticeRun]     = useState<MissionRun|null>(null);
  const [practiceDone, setPracticeDone]   = useState<DoneMap>({});
  const [practiceStartedAt, setPracticeStartedAt] = useState(0);
  const [, setWriteTick]                  = useState(0);

  const [prefs, setPrefs]             = useState({ timer:false, instantText:false });
  const [audioOn, setAudioOn]         = useState(false);
  const [orientSpeaking, setOrientSpeaking] = useState(false);
  const orientStop = useRef<(() => void) | null>(null);
  const [ttsNonce, setTtsNonce]       = useState(0);
  const [timerLeft, setTimerLeft]     = useState(BONUS_SECONDS);
  const [orionPulse, setOrionPulse]   = useState(0);
  const [lastReward, setLastReward]   = useState<MissionResult|null>(null);
  const [particles, setParticles]     = useState<{id:number;emoji:string;x:number;delay:number}[]>([]);
  const [levelUpShow, setLevelUpShow] = useState(false);
  const [animXP, setAnimXP]           = useState(0);
  const phaseHeadingRef   = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const chooseRef         = useRef<(c:SceneChoice)=>void>(()=>{});
  const reducedMotion = useReducedMotion();
  const instantText = prefs.instantText || reducedMotion;

  // Typewriter for splash
  const [tText, setTText] = useState("");
  const TAGLINE = "Practica la vida antes de vivirla.";
  useEffect(() => {
    if (authStep !== "splash") return;
    if (reducedMotion) { setTText(TAGLINE); return; }
    let i=0; setTText("");
    const t = setInterval(()=>{ i++; setTText(TAGLINE.slice(0,i)); if(i>=TAGLINE.length) clearInterval(t); }, 50);
    return ()=>clearInterval(t);
  }, [authStep, reducedMotion]);

  const u = currentUser!;

  // ── Active student profile: the real student, or the isolated practice profile ──
  const isPractice = currentUser?.role === "teacher" && practiceUser !== null;
  const su: User|null = isPractice ? practiceUser : currentUser;
  const run     = isPractice ? practiceRun : studentRun;
  const setRun  = isPractice ? setPracticeRun : setStudentRun;
  const doneMap = isPractice ? practiceDone : doneMissions;
  const setDone = isPractice ? setPracticeDone : setDoneMissions;

  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const script = useMemo(() => run ? getScript(run.missionId) : null, [run?.worldId, run?.missionId]);
  const scene: MissionScene|null = script && run ? (script.scenes[run.sceneId] ?? null) : null;
  const runMission = run ? findMission(run.worldId, run.missionId) : null;
  const runWorld   = run ? (WORLDS.find(w=>w.id===run.worldId) ?? null) : null;
  const outcome    = script && run?.path ? script.outcomes?.[run.path] ?? null : null;
  const confettiList = useMemo(()=>CONFETTI,[]);

  function patchRun(patch: Partial<MissionRun> | ((r:MissionRun)=>Partial<MissionRun>)) {
    setRun(r => r ? { ...r, ...(typeof patch === "function" ? patch(r) : patch) } : r);
  }

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
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
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
  useEffect(() => { document.documentElement.lang = "es"; }, []);

  // Re-render when Supabase write log changes (used by the practice band)
  useEffect(() => onWrite(() => setWriteTick(t => t + 1)), []);

  // ── helpers ────────────────────────────────────────────────────────────────
  function spawnParticles(emoji: string) {
    if (reducedMotion) return;
    const ps = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i, emoji, x: 5 + Math.random() * 90, delay: i * 0.06,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 1600);
  }

  /** Updates the profile currently playing: practice changes never reach a real account. */
  function updateActiveProfile(patch: Partial<User>) {
    if (isPractice) { setPracticeUser(p => p ? { ...p, ...patch } : p); return; }
    setCurrentUser(p => p ? { ...p, ...patch } : p);
    const id = currentUser?.id;
    if (sessionSource==="demo" && id && demoProfiles[id]) setDemoProfiles(m => ({ ...m, [id]: { ...m[id], ...patch } }));
  }

  function startMission(world: typeof WORLDS[0], m: MissionItem) {
    const sc = getScript(m.id);
    setSelectedWorld(world);
    setRun({ worldId:world.id, missionId:m.id, sceneId:sc.start, phase:"intro", path:null, decisions:[], hints:[],
      lastChoice:null, bonusXP:0, lastBonus:0, orionOpen:false, reread:false, supportRequested:false });
    setParticles([]);
    setScenePlayback("idle"); setCueIdx(-1); setForceAllCaptions(false);
    setAppScreen("sim");
  }

  function continueMission() {
    if (!run) return;
    setSelectedWorld(runWorld);
    setAppScreen("sim");
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
    if (!run || !script || !run.path || !su || !runMission || !outcome) return;
    const reward = computeReward(su.xp, runMission.xp, run.bonusXP);
    const coinsTotal = su.coins + reward.coins;
    const score = computeScore(outcome.score, run.decisions);
    updateActiveProfile({ xp: reward.newXP, coins: coinsTotal, level: reward.newLevel });
    // Only real Supabase student accounts are persisted; practice and demo sessions never write.
    if (!isPractice && sessionSource === "supabase") updateXP(su.id, reward.newXP, coinsTotal, reward.newLevel);
    setDone(prev => ({ ...prev, [runMission.id]: { score, xp: reward.xp, path: run.path ?? "" } }));
    setLastReward({ ...reward, missionId:runMission.id, missionTitle:runMission.title, missionEmoji:runMission.emoji,
      worldId:run.worldId, outcome, score, negatives: run.decisions.filter(d=>d.quality==="negative").length,
      hintsUsed: run.hints.length, coinsTotal, practice: isPractice });
    setRun(null);
    setParticles([]);
    setAppScreen("results");
    if (!reducedMotion) {
      setConfetti(true); setTimeout(() => setConfetti(false), 1500);
      if (reward.leveledUp) { setTimeout(() => { setLevelUpShow(true); setTimeout(() => setLevelUpShow(false), 1800); }, 400); }
    }
  }

  // ── Teacher practice ("Probar como estudiante") ─────────────────────────────
  function startPractice() {
    setWritesBlocked(true);
    setPracticeStartedAt(Date.now());
    const pu = makePracticeUser();
    setPracticeUser(pu); setPracticeRun(null); setPracticeDone({});
    setOrionChat([]);
    setLastReward(null); setSelectedWorld(null); setAnimXP(pu.xp);
    setAppScreen("home");
  }
  function exitPractice() {
    stopVoicePlayback();
    setPracticeUser(null); setPracticeRun(null); setPracticeDone({});
    setOrionChat([]);
    setLastReward(null); setSelectedWorld(null); setConfetti(false); setLevelUpShow(false); setParticles([]);
    setAppScreen("home"); setTeacherTab("dashboard");
    setWritesBlocked(false);
  }
  const practiceWrites = isPractice ? getWriteLog().filter(w => w.at >= practiceStartedAt) : [];

  // ─── Auth helpers ──────────────────────────────────────────────────────────
  // ─── Supabase: restore session on mount ────────────────────────────────────
  async function resolveProfile(userId: string, email: string, meta: Record<string,any>): Promise<void> {
    let profile = await getProfile(userId);
    if (!profile) {
      // Profile table missing or trigger didn't fire — create a minimal one so login always works
      const fallback: Profile = {
        id: userId, email,
        role: (meta?.role ?? "student") as "student" | "teacher",
        name: meta?.name ?? email.split("@")[0],
        last: meta?.last ?? "",
        grade: meta?.grade ?? "3°A",
        hair_color: "#2C1810", hair_style: "A", skin_tone: "#FDBCB4",
        shirt_color: "#6D28D9", pet: "🐶",
        level: 1, xp: 0, coins: 50, streak: 0,
        subject: null, group_name: null,
      };
      await upsertProfile(fallback);
      profile = fallback;
    } else if (profile.role === "student") {
      // Existing profiles whose stored level disagrees with their XP are reconciled once
      // (XP raised to the stored level's minimum, level re-derived) and saved back.
      const rec = reconcileProgress(profile.xp ?? 0, profile.level ?? 1);
      if (rec.changed) {
        profile = { ...profile, xp: rec.xp, level: rec.level };
        await updateXP(profile.id, rec.xp, profile.coins ?? 0, rec.level);
      }
    }
    applyProfile(profile);
  }

  useEffect(() => {
    // Safety timeout — if Supabase never responds, unblock the UI after 3s
    const timeout = setTimeout(() => setAuthLoading(false), 3000);

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        await resolveProfile(session.user.id, session.user.email ?? "", session.user.user_metadata ?? {});
      }
      setAuthLoading(false);
    }).catch(() => { clearTimeout(timeout); setAuthLoading(false); });

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          await resolveProfile(session.user.id, session.user.email ?? "", session.user.user_metadata ?? {});
          setLLoading(false);
          setAuthLoading(false);
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          setAuthStep("splash");
          setAuthLoading(false);
          setLLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  function applyProfile(profile: Profile) {
    // Map DB profile → local User shape
    const user: User = {
      id: profile.id, name: profile.name, last: profile.last,
      email: profile.email, grade: profile.grade,
      hairColor: profile.hair_color, hairStyle: profile.hair_style,
      skinTone: profile.skin_tone, shirtColor: profile.shirt_color,
      pet: profile.pet, level: profile.level, xp: profile.xp,
      coins: profile.coins, streak: profile.streak, role: profile.role,
      subject: profile.subject ?? undefined,
      group: profile.group_name ?? undefined,
    };
    setCurrentUser(user);
    setOrionChat([]);
    setSessionSource("supabase");
    setLEmail(""); setLPw(""); setLError("");
    setAnimXP(user.xp);
  }

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos";
    if (msg.includes("Email not confirmed")) return "Debes confirmar tu correo antes de ingresar";
    if (msg.includes("Too many requests")) return "Demasiados intentos. Espera un momento";
    if (msg.includes("User not found")) return "No existe una cuenta con ese correo";
    return msg;
  }

  // ─── Demo accounts: always local, never dependent on Supabase ───────────────
  const DEMO_PW = "demo1234";
  function enterDemo(user: User) {
    setCurrentUser({ ...user });
    setOrionChat([]);
    setSessionSource("demo");
    setLEmail(""); setLPw(""); setLError(""); setLLoading(false);
    setAnimXP(user.xp);
    setAppScreen("home");
  }
  function tryDemoLogin(email: string, password: string, role: "student"|"teacher"): "ok"|"bad-password"|"not-demo" {
    const found = Object.values(demoProfiles).find(d => d.email.toLowerCase() === email.toLowerCase() && d.role === role);
    if (!found) return "not-demo";
    if (password !== DEMO_PW) return "bad-password";
    enterDemo(found);
    return "ok";
  }

  async function login(role: "student"|"teacher", emailOverride?: string, pwOverride?: string) {
    const email = (emailOverride ?? lEmail).trim();
    const pw    = pwOverride ?? lPw;
    const demoHint = role === "student" ? "alejandro@demo.com" : "docente@demo.com";
    setLError("");
    if (!email.includes("@")) { setLError("Ingresa un correo válido"); return; }
    if (pw.length < 6) { setLError("Mínimo 6 caracteres en la contraseña"); return; }
    const demo = tryDemoLogin(email, pw, role);
    if (demo === "ok") return;
    if (demo === "bad-password") { setLError("Contraseña incorrecta para la cuenta demo. Usa demo1234"); return; }
    setLLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        const offline = error.message.includes("fetch") || error.message.includes("network") || error.message.includes("Failed");
        setLError(offline ? `Sin conexión con el servidor. Usa la cuenta demo ${demoHint} (contraseña demo1234).` : translateAuthError(error.message));
        setLLoading(false);
      }
    } catch {
      setLError(`Sin conexión con el servidor. Usa la cuenta demo ${demoHint} (contraseña demo1234).`);
      setLLoading(false);
    }
  }
  const loginS = (e?: string, p?: string) => login("student", e, p);
  const loginT = (e?: string, p?: string) => login("teacher", e, p);

  // ─── Validate student reg step 1 ───────────────────────────────────────────
  function validateS1() {
    const e:Record<string,string>={};
    if(!rName.trim()) e.name="Nombre requerido";
    if(!rLast.trim()) e.last="Apellido requerido";
    if(!rEmail.includes("@")) e.email="Correo inválido";
    if(rPw.length<6) e.pw="Mínimo 6 caracteres";
    if(rPw!==rPw2) e.pw2="Las contraseñas no coinciden";
    setRErrors(e); return Object.keys(e).length===0;
  }

  // ─── Register student ───────────────────────────────────────────────────────
  async function submitStudent() {
    setLLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: rEmail.trim(),
      password: rPw,
      options: { data: { role: "student", name: rName, last: rLast } },
    });
    if (error) { setLLoading(false); setRErrors({ email: translateAuthError(error.message) }); return; }
    if (data.user) {
      const profile: Profile = {
        id: data.user.id, email: rEmail.trim(), role: "student",
        name: rName, last: rLast, grade: rGrade,
        hair_color: rHair, hair_style: rHairSt, skin_tone: rSkin,
        shirt_color: rShirt, pet: rPet,
        level: 1, xp: 0, coins: 50, streak: 0,
        subject: null, group_name: null,
      };
      await upsertProfile(profile);
      // If session exists (email confirmation off), onAuthStateChange will fire → resolveProfile
      // If confirmation required, sign them in immediately for seamless UX
      if (data.session) {
        applyProfile(profile);
      } else {
        // Try signing in right away
        const { error: siErr } = await supabase.auth.signInWithPassword({ email: rEmail.trim(), password: rPw });
        if (siErr) {
          // Show confirmation message
          setRErrors({ email: "✅ Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión." });
        }
        // If no error, onAuthStateChange SIGNED_IN fires and resolveProfile handles it
      }
    }
    setLLoading(false);
  }

  // ─── Validate teacher reg ───────────────────────────────────────────────────
  function validateT() {
    const e:Record<string,string>={};
    if(!rName.trim()) e.name="Nombre requerido";
    if(!rSubj.trim()) e.subj="Materia requerida";
    if(!rEmail.includes("@")) e.email="Correo inválido";
    if(rPw.length<6) e.pw="Mínimo 6 caracteres";
    setRErrors(e); return Object.keys(e).length===0;
  }

  // ─── Register teacher ───────────────────────────────────────────────────────
  async function submitTeacher() {
    setLLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: rEmail.trim(),
      password: rPw,
      options: { data: { role: "teacher", name: rName, last: rLast } },
    });
    if (error) { setLLoading(false); setRErrors({ email: translateAuthError(error.message) }); return; }
    if (data.user) {
      const profile: Profile = {
        id: data.user.id, email: rEmail.trim(), role: "teacher",
        name: rName, last: rLast, grade: "",
        hair_color: "#1A1A2E", hair_style: "B", skin_tone: "#D08B5B",
        shirt_color: "#0E7490", pet: "🦉",
        level: 1, xp: 0, coins: 0, streak: 0,
        subject: rSubj, group_name: rGrp,
      };
      await upsertProfile(profile);
      if (data.session) {
        applyProfile(profile);
      } else {
        const { error: siErr } = await supabase.auth.signInWithPassword({ email: rEmail.trim(), password: rPw });
        if (siErr) {
          setRErrors({ email: "✅ Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión." });
        }
      }
    }
    setLLoading(false);
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────
  async function logout() {
    stopVoicePlayback();
    setWritesBlocked(false);
    if (sessionSource === "supabase") { try { await supabase.auth.signOut(); } catch { /* offline */ } }
    setCurrentUser(null); setAuthStep("splash");
    setOrionChat([]);
    setStudentRun(null); setDoneMissions({});
    setPracticeUser(null); setPracticeRun(null); setPracticeDone({});
    setLastReward(null); setSelectedWorld(null); setAppScreen("home");
    setLEmail(""); setLPw(""); setLError("");
    setRName(""); setRLast(""); setREmail(""); setRPw(""); setRPw2("");
    setRErrors({}); setRStep(1);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Loading screen while checking Supabase session ──────────────────────────
  if (authLoading) return (
    <Shell>
      <div className="min-h-screen flex items-center justify-center" style={{ background:P.bg }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-4xl mx-auto mb-5" style={{ background:`linear-gradient(135deg,${P.v2},${P.c2})`, boxShadow:`0 0 40px rgba(124,58,237,.5)` }}>LX</div>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color:P.v4 }}/>
          <p className="text-sm" style={{ color:P.muted }}>Cargando tu aventura…</p>
        </div>
      </div>
    </Shell>
  );

  // AUTH — shown only when currentUser is null
  // ══════════════════════════════════════════════════════════════════════════════
  if (!currentUser) {

    // ── SPLASH ────────────────────────────────────────────────────────────────
    if (authStep==="splash") return (
      <Shell>
        <div className="lx-welcome min-h-screen relative flex flex-col overflow-hidden">
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-9">
            <LXLogo size={44}/>
            <main className="flex flex-1 items-center py-5 sm:py-8 lg:py-0">
            <div className="grid w-full lg:grid-cols-[1.12fr_.88fr] gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 text-center">
                <div className="mx-auto max-w-[510px] aspect-[620/410]"><WelcomePortal/></div>
                <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color:P.c4 }}>Simulaciones para la vida</p>
                <h1 className="mt-2 text-3xl sm:text-5xl font-black leading-tight" style={{ color:P.text }}>
                  Practica la vida<br/><span className="lx-welcome-accent">antes de vivirla.</span>
                </h1>
                <p className="max-w-md mx-auto mt-3 text-sm sm:text-base leading-relaxed" style={{ color:"#D3DBF5" }}>
                  Vive historias, toma decisiones y practica habilidades para el colegio y para tu vida.
                </p>
              </div>
              <section aria-labelledby="lx-welcome-title" className="lx-welcome-panel order-1 lg:order-2 p-5 sm:p-8 rounded-3xl">
                <h2 id="lx-welcome-title" className="text-3xl sm:text-4xl font-black" style={{ color:P.text }}>¡Bienvenido!</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color:"#D3DBF5" }}>Inicia sesión o crea tu cuenta para comenzar.</p>
                <div className="grid gap-3 mt-6">
                  <button type="button" onClick={() => setAuthStep("role")} className="lx-neon-action min-h-14 px-5 py-3 rounded-full font-bold text-white text-base flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3"><Play size={18} aria-hidden="true"/>Iniciar sesión</span><ChevronRight size={20} aria-hidden="true"/>
                  </button>
                  <button type="button" onClick={() => { setRStep(1); setAuthStep("reg-role"); }} className="min-h-14 px-5 py-3 rounded-full font-bold text-base border flex items-center justify-between gap-3"
                    style={{ color:P.text, borderColor:"#9F92F0", background:"rgba(113,105,230,.13)" }}>
                    <span className="flex items-center gap-3"><Sparkles size={18} aria-hidden="true"/>Crear cuenta</span><ChevronRight size={20} aria-hidden="true"/>
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl p-3 border" style={{ background:"rgba(102,102,205,.14)", borderColor:"rgba(161,169,255,.35)" }}>
                  <span className="w-14 h-14 rounded-2xl overflow-hidden flex items-end justify-center shrink-0" style={{ background:"linear-gradient(160deg,#2E2A7A,#17205A)" }}><OrionFigure variant="bust" size={56}/></span>
                  <div className="text-sm leading-relaxed" style={{ color:"#E3E8FA" }}>
                    <p className="font-bold" style={{ color:P.v4 }}>Orion, tu mentor</p>
                    <p>Cuando tengas dudas en una misión, puedes pedirme una pista.</p>
                  </div>
                </div>
                <p className="mt-4 text-xs" style={{ color:P.muted }}>Hay cuentas demo para estudiantes y docentes.</p>
              </section>
            </div>
            </main>
          </div>
        </div>
      </Shell>
    );

    // ── ROLE ──────────────────────────────────────────────────────────────────
    if (authStep==="role") return (
      <Shell>
        <AuthWrap title="¿Cómo quieres entrar?" sub="Elige tu rol para continuar" onBack={()=>setAuthStep("splash")} wide>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title:"Soy Estudiante", desc:"Misiones, simulaciones y tu progreso", action:()=>{ setLEmail(""); setLPw(""); setLError(""); setAuthStep("login-s"); }, accent:P.v3,
                art:<CharSVG hair="#2C1810" hairStyle="A" skin="#EDB98A" shirt="#6A4CFF" mood="happy" size={120}/> },
              { title:"Soy Docente", desc:"Seguimiento del grupo y casos didácticos", action:()=>{ setLEmail(""); setLPw(""); setLError(""); setAuthStep("login-t"); }, accent:P.c3,
                art:<TeacherFigure size={120} look="front"/> },
            ].map(r=>(
              <button key={r.title} type="button" onClick={r.action} className="lx-choice rounded-2xl p-5 flex flex-col items-center text-center border transition-all" style={{ background:P.s2, borderColor:P.border }}>
                <span className="w-32 h-32 rounded-full flex items-end justify-center overflow-hidden mb-3" style={{ background:`radial-gradient(circle at 50% 35%, ${r.accent}55, ${P.s3})` }}>{r.art}</span>
                <span className="font-bold text-lg" style={{ color:P.text }}>{r.title}</span>
                <span className="text-sm mt-1" style={{ color:P.muted }}>{r.desc}</span>
              </button>
            ))}
          </div>
        </AuthWrap>
      </Shell>
    );

    // ── LOGIN STUDENT ──────────────────────────────────────────────────────────
    if (authStep==="login-s") return (
      <Shell>
        <AuthWrap title="Bienvenido de nuevo" sub="Ingresa con tu correo y contraseña" onBack={()=>setAuthStep("role")}>
          <InputField label="Correo electrónico" type="email" value={lEmail} onChange={(e:any)=>setLEmail(e.target.value)} placeholder="tu@correo.com"/>
          <InputField label="Contraseña" type={showPw?"text":"password"} value={lPw} onChange={(e:any)=>setLPw(e.target.value)} placeholder="Tu contraseña" error={lError}
            onKeyDown={(e:any)=>e.key==="Enter"&&loginS()}
            right={<button type="button" onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Ocultar contraseña":"Mostrar contraseña"} aria-pressed={showPw} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color:P.muted }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>}
          />
          <PrimaryBtn full size="lg" onClick={()=>loginS()} variant="violet" disabled={lLoading}>
            {lLoading ? <span className="flex items-center gap-2 justify-center"><Loader2 size={16} className="animate-spin"/>Ingresando…</span> : "Ingresar →"}
          </PrimaryBtn>
          <div className="mt-4 text-center">
            <span className="text-sm" style={{ color:P.muted }}>¿No tienes cuenta? </span>
            <button onClick={()=>{ setRStep(1); setAuthStep("reg-s"); }} className="text-sm font-bold hover:underline" style={{ color:P.v4 }}>Regístrate gratis</button>
          </div>
          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor:P.border }}>
            <p className="text-xs font-bold mb-1" style={{ color:P.muted }}>⚡ Acceso rápido demo</p>
            <p className="text-xs mb-2" style={{ color:P.muted }}>Cuentas locales del prototipo · contraseña demo1234</p>
            <div className="space-y-2">
              {SEED_USERS.filter(u=>u.role==="student").slice(0,3).map(demo=>(
                <button key={demo.id} onClick={()=>{ setLEmail(demo.email); setLPw("demo1234"); loginS(demo.email,"demo1234"); }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 border text-left transition-all hover:scale-[1.01]"
                  style={{ background:P.s2, borderColor:P.border }}>
                  <CharSVG hair={demo.hairColor} hairStyle={demo.hairStyle} skin={demo.skinTone} shirt={demo.shirtColor} mood="happy" size={32}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color:P.text }}>{demo.name} {demo.last}</p>
                    <p className="text-xs truncate" style={{ color:P.muted }}>{demo.email}</p>
                  </div>
                  <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background:g(P.v2,P.v1), color:"#fff" }}>Nivel {getLevelInfo(demoProfiles[demo.id]?.xp ?? demo.xp).level}</div>
                </button>
              ))}
            </div>
          </div>
        </AuthWrap>
      </Shell>
    );

    // ── LOGIN TEACHER ──────────────────────────────────────────────────────────
    if (authStep==="login-t") return (
      <Shell>
        <AuthWrap title="Acceso Docente" sub="Panel de monitoreo y seguimiento" onBack={()=>setAuthStep("role")}>
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3 border" style={{ background:"rgba(14,165,233,.08)", borderColor:"rgba(14,165,233,.25)" }}>
            <Portrait who="garcia" size={48}/>
            <div><p className="font-bold" style={{ color:P.text }}>Prof. Ana García</p><p className="text-xs" style={{ color:P.c4 }}>Ciencias Sociales · Grupo 1°A · 1°B</p></div>
          </div>
          <InputField label="Correo" type="email" value={lEmail} onChange={(e:any)=>setLEmail(e.target.value)} placeholder="docente@demo.com"/>
          <InputField label="Contraseña" type={showPw?"text":"password"} value={lPw} onChange={(e:any)=>setLPw(e.target.value)} placeholder="Tu contraseña" error={lError}
            onKeyDown={(e:any)=>e.key==="Enter"&&loginT()}
            right={<button type="button" onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Ocultar contraseña":"Mostrar contraseña"} aria-pressed={showPw} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color:P.muted }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>}
          />
          <PrimaryBtn full size="lg" onClick={()=>loginT()} variant="cyan" disabled={lLoading}>
            {lLoading ? <span className="flex items-center gap-2 justify-center"><Loader2 size={16} className="animate-spin"/>Ingresando…</span> : "Ingresar al panel →"}
          </PrimaryBtn>
          <div className="mt-4 text-center">
            <button onClick={()=>{ setRStep(1); setAuthStep("reg-t"); }} className="text-sm font-bold hover:underline" style={{ color:P.c4 }}>Registrar cuenta docente</button>
          </div>
          {/* Demo docente */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor:P.border }}>
            <p className="text-xs font-bold mb-1" style={{ color:P.muted }}>⚡ Acceso rápido demo</p>
            <p className="text-xs mb-2" style={{ color:P.muted }}>Cuentas locales del prototipo · contraseña demo1234</p>
            <button onClick={()=>{ setLEmail("docente@demo.com"); setLPw("demo1234"); loginT("docente@demo.com","demo1234"); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all hover:scale-[1.01]"
              style={{ background:P.s2, borderColor:P.border }}>
              <Portrait who="garcia" size={36}/>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold" style={{ color:P.text }}>Prof. Ana García</p>
                <p className="text-xs" style={{ color:P.muted }}>docente@demo.com</p>
              </div>
              <div className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background:g(P.c2,P.c1), color:"#fff" }}>Docente</div>
            </button>
          </div>
        </AuthWrap>
      </Shell>
    );

    // ── REGISTER ROLE ──────────────────────────────────────────────────────────
    if (authStep==="reg-role") return (
      <Shell>
        <AuthWrap title="Crear cuenta" sub="¿Cómo participarás en LifeXperience?" onBack={()=>setAuthStep("splash")}>
          <div className="space-y-4">
            {[
              { icon:"🎒", title:"Cuenta Estudiante", desc:"Accede a misiones y simulaciones de habilidades para la vida", action:()=>setAuthStep("reg-s"), col:P.v3 },
              { icon:"👩‍🏫", title:"Cuenta Docente",   desc:"Gestiona grupos y monitorea el progreso de tus estudiantes",  action:()=>setAuthStep("reg-t"), col:P.c3 },
            ].map(r=>(
              <button key={r.title} onClick={r.action} className="w-full rounded-2xl p-5 flex items-center gap-4 border transition-all hover:scale-[1.01] text-left" style={{ background:P.s1, borderColor:P.border }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=r.col}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=P.border}}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background:r.col===P.v3?g(P.v2,P.v1):g(P.c2,P.c1) }}>{r.icon}</div>
                <div><p className="font-bold" style={{ color:P.text }}>{r.title}</p><p className="text-sm mt-0.5" style={{ color:P.muted }}>{r.desc}</p></div>
                <ChevronRight size={20} className="ml-auto" style={{ color:P.muted }}/>
              </button>
            ))}
          </div>
          <div className="mt-5 text-center">
            <span className="text-sm" style={{ color:P.muted }}>¿Ya tienes cuenta? </span>
            <button onClick={()=>setAuthStep("role")} className="text-sm font-bold hover:underline" style={{ color:P.v4 }}>Iniciar sesión</button>
          </div>
        </AuthWrap>
      </Shell>
    );

    // ── REGISTER STUDENT ──────────────────────────────────────────────────────
    if (authStep==="reg-s") return (
      <Shell>
        <div className="min-h-screen flex">
          {/* Left - Form */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-10" style={{ background:P.bg }}>
            <div className="w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <BackArrow onClick={()=>rStep>1?setRStep(p=>p-1):setAuthStep("reg-role")}/>
                <div>
                  <h2 className="text-xl font-black" style={{ color:P.text }}>Crea tu cuenta</h2>
                  <p className="text-xs" style={{ color:P.muted }}>Paso {rStep} de 3 — {rStep===1?"Datos personales":rStep===2?"Personaliza tu avatar":"Confirma y listo"}</p>
                </div>
              </div>
              {/* Step indicator */}
              <div className="flex gap-2 mb-6">
                {[1,2,3].map(s=><div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ background:s<=rStep?g(P.v2,P.v3):"rgba(255,255,255,0.1)" }}/>)}
              </div>

              {rStep===1&&(
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Nombre *" value={rName} onChange={(e:any)=>setRName(e.target.value)} placeholder="Ana" error={rErrors.name}/>
                    <InputField label="Apellido *" value={rLast} onChange={(e:any)=>setRLast(e.target.value)} placeholder="García" error={rErrors.last}/>
                  </div>
                  <InputField label="Correo electrónico *" type="email" value={rEmail} onChange={(e:any)=>setREmail(e.target.value)} placeholder="tu@correo.com" error={rErrors.email}/>
                  <div className="mb-4">
                    <label className="block text-xs font-bold mb-1.5" style={{ color:P.muted }}>Grado</label>
                    <select value={rGrade} onChange={e=>setRGrade(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none" style={{ background:P.s2, borderColor:P.border, color:P.text }}>
                      {GRADES.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <InputField label="Contraseña *" type={showPw?"text":"password"} value={rPw} onChange={(e:any)=>setRPw(e.target.value)} placeholder="Mínimo 6 caracteres" error={rErrors.pw} hint="Al menos 6 caracteres"
                    right={<button type="button" onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Ocultar contraseña":"Mostrar contraseña"} aria-pressed={showPw} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color:P.muted }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>}
                  />
                  <InputField label="Confirmar contraseña *" type="password" value={rPw2} onChange={(e:any)=>setRPw2(e.target.value)} placeholder="Repite la contraseña" error={rErrors.pw2}/>
                  <PrimaryBtn full size="lg" onClick={()=>{if(validateS1())setRStep(2)}} variant="violet">Continuar →</PrimaryBtn>
                </div>
              )}

              {rStep===2&&(
                <div>
                  <p className="text-xs font-bold mb-3" style={{ color:P.muted }}>Tono de piel</p>
                  <div className="flex gap-2 mb-4">
                    {SKIN_TONES.map(s=><button key={s} onClick={()=>setRSkin(s)} className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110" style={{ background:s, borderColor:rSkin===s?P.v4:"transparent" }}/>)}
                  </div>
                  <p className="text-xs font-bold mb-3" style={{ color:P.muted }}>Color de cabello</p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {HAIR_COLORS.map(h=><button key={h} onClick={()=>setRHair(h)} className="w-9 h-9 rounded-full border-2 transition-all hover:scale-110" style={{ background:h==="#F5F5F5"?"#d0d0d0":h, borderColor:rHair===h?P.v4:"transparent" }}/>)}
                  </div>
                  <p className="text-xs font-bold mb-3" style={{ color:P.muted }}>Estilo de cabello</p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {HAIR_STYLES.map(s=>(
                      <button key={s} onClick={()=>setRHairSt(s)} className="rounded-xl p-2 border transition-all hover:scale-105" style={{ background:rHairSt===s?g(P.v2,P.v3):P.s2, borderColor:rHairSt===s?P.v3:P.border }}>
                        <CharSVG hair={rHair} hairStyle={s} skin={rSkin} shirt={rShirt} mood="happy" size={55}/>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold mb-3" style={{ color:P.muted }}>Color de ropa</p>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {SHIRT_COLORS.map(c=><button key={c} onClick={()=>setRShirt(c)} className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110" style={{ background:c, borderColor:rShirt===c?P.text:"transparent" }}/>)}
                  </div>
                  <div className="flex gap-3">
                    <PrimaryBtn onClick={()=>setRStep(1)} variant="ghost">← Atrás</PrimaryBtn>
                    <PrimaryBtn full onClick={()=>setRStep(3)} variant="violet">Continuar →</PrimaryBtn>
                  </div>
                </div>
              )}

              {rStep===3&&(
                <div>
                  <p className="text-xs font-bold mb-3" style={{ color:P.muted }}>Elige tu mascota</p>
                  <div className="grid grid-cols-6 gap-2 mb-5">
                    {PETS.map(p=>(
                      <button key={p} onClick={()=>setRPet(p)} className="h-12 rounded-xl flex items-center justify-center text-xl border transition-all hover:scale-110" style={{ background:rPet===p?g(P.g2,P.g1):P.s2, borderColor:rPet===p?P.g3:P.border }}>
                        {p==="⛔"?<span className="text-xs" style={{ color:P.muted }}>Sin</span>:p}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl p-5 border mb-5" style={{ background:P.s2, borderColor:P.border }}>
                    {[{ label:"Nombre", val:`${rName} ${rLast}` },{ label:"Correo", val:rEmail },{ label:"Grado", val:rGrade }].map(r=>(
                      <div key={r.label} className="flex justify-between text-sm py-2 border-b last:border-0" style={{ borderColor:P.border }}>
                        <span style={{ color:P.muted }}>{r.label}</span>
                        <span style={{ color:P.text }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <PrimaryBtn onClick={()=>setRStep(2)} variant="ghost">← Atrás</PrimaryBtn>
                    <PrimaryBtn full onClick={submitStudent} variant="violet">✅ Crear mi cuenta</PrimaryBtn>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Avatar preview */}
          <div className="hidden lg:flex w-80 flex-col items-center justify-center border-l" style={{ background:"linear-gradient(145deg,#0A1420,#0D1F38)", borderColor:P.border }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color:P.muted }}>Tu personaje</p>
            <div className="relative mb-6">
              <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{ background:"radial-gradient(circle,rgba(109,40,217,0.2) 0%,transparent 70%)" }}>
                <CharSVG hair={rHair} hairStyle={rHairSt} skin={rSkin} shirt={rShirt} mood="happy" size={160}/>
              </div>
              {rPet&&rPet!=="⛔"&&<div className="absolute bottom-2 right-2 text-3xl">{rPet}</div>}
            </div>
            {rName&&<p className="font-black text-lg" style={{ color:P.text }}>{rName} {rLast}</p>}
            <p className="text-sm" style={{ color:P.muted }}>{rGrade} · Nivel 1</p>
            {/* XP preview */}
            <div className="mt-6 w-48">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full w-0" style={{ background:g(P.v2,P.v4,"90deg") }}/>
              </div>
              <p className="text-xs text-center mt-1.5" style={{ color:P.muted }}>0 / 500 XP · Nivel 1</p>
            </div>
          </div>
        </div>
      </Shell>
    );

    // ── REGISTER TEACHER ──────────────────────────────────────────────────────
    if (authStep==="reg-t") return (
      <Shell>
        <AuthWrap title="Registro Docente" sub="Crea tu cuenta para gestionar tu grupo" onBack={()=>setAuthStep("reg-role")}>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Nombre *" value={rName} onChange={(e:any)=>setRName(e.target.value)} placeholder="Ana" error={rErrors.name}/>
            <InputField label="Apellido" value={rLast} onChange={(e:any)=>setRLast(e.target.value)} placeholder="García"/>
          </div>
          <InputField label="Correo *" type="email" value={rEmail} onChange={(e:any)=>setREmail(e.target.value)} placeholder="docente@colegio.edu" error={rErrors.email}/>
          <InputField label="Materia *" value={rSubj} onChange={(e:any)=>setRSubj(e.target.value)} placeholder="Ciencias Sociales, Matemáticas…" error={rErrors.subj}/>
          <div className="mb-4">
            <label className="block text-xs font-bold mb-1.5" style={{ color:P.muted }}>Grupo(s)</label>
            <select value={rGrp} onChange={e=>setRGrp(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none" style={{ background:P.s2, borderColor:P.border, color:P.text }}>
              {["3°A","3°B","3°A · 3°B","2°A · 2°B","Todo el grado"].map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          <InputField label="Contraseña *" type={showPw?"text":"password"} value={rPw} onChange={(e:any)=>setRPw(e.target.value)} placeholder="Mínimo 6 caracteres" error={rErrors.pw}
            right={<button type="button" onClick={()=>setShowPw(p=>!p)} aria-label={showPw?"Ocultar contraseña":"Mostrar contraseña"} aria-pressed={showPw} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color:P.muted }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>}
          />
          <PrimaryBtn full size="lg" onClick={()=>{if(validateT())submitTeacher()}} variant="cyan">✅ Crear cuenta docente</PrimaryBtn>
        </AuthWrap>
      </Shell>
    );
  } // end !currentUser

  // ══════════════════════════════════════════════════════════════════════════════
  // TEACHER PANEL
  // ══════════════════════════════════════════════════════════════════════════════
  const tNavItems: { id:TeacherTab; icon:typeof House; lbl:string }[] = [
    { id:"dashboard", icon:LayoutDashboard, lbl:"Panel general"   },
    { id:"ai",        icon:Sparkles,        lbl:"Asistente IA"    },
    { id:"plans",     icon:ClipboardList,   lbl:"Planes asignados"},
  ];
  const ORIENTATION = "Al probar como estudiante verás las mismas pantallas, decisiones y pistas de Orion que usa tu grupo. Nada de lo que hagas en la práctica cambia el progreso de tus estudiantes. Después, vuelve al panel para asignar un caso.";
  const totalPlans = Object.values(studentPlans).reduce((s,p)=>s+p.length, 0);

  if (u.role==="teacher" && !isPractice) return (
    <Shell>
      <div className="flex h-screen" style={{ background:P.bg }}>
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-r py-6 px-4" style={{ background:P.s1, borderColor:P.border }}>
          <div className="mb-8 px-2"><LXLogo size={32}/></div>
          <nav className="space-y-1 flex-1">
            {tNavItems.map(n=>(
              <button key={n.id} type="button" onClick={()=>setTeacherTab(n.id)} aria-current={teacherTab===n.id?"page":undefined} className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all" style={teacherTab===n.id?{ background:"rgba(34,211,238,.14)", color:"#E9FDFF", boxShadow:`inset 3px 0 0 ${P.c3}` }:{ color:P.muted }}>
                <n.icon size={18} aria-hidden="true"/>
                <span className="text-sm font-semibold">{n.lbl}</span>
                {n.id==="plans"&&totalPlans>0&&<span className="ml-auto text-xs font-black px-1.5 py-0.5 rounded-full" style={{ background:P.v3, color:"#fff" }}>{totalPlans}</span>}
                {n.id==="ai"&&<span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background:"rgba(14,165,233,.2)", color:P.c4 }}>NEW</span>}
              </button>
            ))}
          </nav>
          <button type="button" onClick={startPractice} className="w-full min-h-11 flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl text-sm font-bold border transition-colors hover:bg-white/5" style={{ color:P.c4, borderColor:"rgba(56,189,248,.45)", background:"rgba(14,165,233,.08)" }}>
            <Play size={15} aria-hidden="true"/>Probar como estudiante
          </button>
          <div className="border-t pt-4" style={{ borderColor:P.border }}>
            <div className="flex items-center gap-3 mb-3 px-2">
              <Portrait who="garcia" size={40}/>
              <div className="min-w-0"><p className="text-sm font-bold truncate" style={{ color:P.text }}>{u.name} {u.last}</p><p className="text-xs truncate" style={{ color:P.muted }}>{u.subject}</p></div>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5" style={{ color:P.muted, borderColor:P.border }}>
              <LogOut size={14}/>Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">

            {/* ── DASHBOARD TAB ── */}
            {teacherTab==="dashboard"&&(<>
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-2xl font-black mb-0.5" style={{ color:P.text }}>Panel Docente</h1>
                  <p className="text-sm" style={{ color:P.muted }}>{u.subject} · Grupo {u.group} · Lunes 30 Jun, 2026</p>
                </div>
              </div>
              {/* Practice entry */}
              <div className="rounded-2xl p-5 mb-3 border flex flex-wrap items-center gap-5" style={{ background:P.s1, borderColor:"rgba(34,211,238,.4)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(34,211,238,.14)" }}><FlaskConical size={22} style={{ color:P.c4 }} aria-hidden="true"/></div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold" style={{ color:P.text }}>Prueba la experiencia del estudiante</h2>
                  <p className="text-sm mt-0.5" style={{ color:P.muted }}>Usa las mismas pantallas, misiones, decisiones y ayudas de Orion. La práctica no cambia el XP, las monedas, el avatar ni el progreso de ningún estudiante.</p>
                </div>
                <button type="button" onClick={startPractice} className="min-h-11 px-5 py-3 rounded-xl font-bold text-white text-sm flex items-center gap-2 flex-shrink-0" style={{ background:g(P.v2,P.v1), boxShadow:SHADOW.action }}>
                  <Play size={16} aria-hidden="true"/>Probar como estudiante
                </button>
              </div>
              {/* Teacher-role guidance, with an adult female voice */}
              <div className="rounded-2xl px-5 py-4 mb-6 border flex flex-wrap items-start gap-4" style={{ background:P.s1, borderColor:P.border }}>
                <Portrait who="garcia" size={36}/>
                <div className="flex-1 min-w-[240px]">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color:P.c4 }}>Orientación docente · voz femenina adulta</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color:"#E3E8FA" }}>{ORIENTATION}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>{ if (orientStop.current) { orientStop.current(); orientStop.current=null; setOrientSpeaking(false); } else { setOrientSpeaking(true); orientStop.current = playCues([{ id:"o", kind:"speech", text:ORIENTATION, speaker:{ id:"other", name:"Orientación docente", role:"Docente", voice:"teacher", portrait:"garcia" } }], { onCue:()=>{}, onDone:()=>{ orientStop.current=null; setOrientSpeaking(false); } }); } }}
                    disabled={!ttsSupported()} className="min-h-11 px-4 rounded-xl text-sm font-semibold border inline-flex items-center gap-2" style={{ color:P.text, borderColor:P.border }}>
                    {orientSpeaking ? <><VolumeX size={15} aria-hidden="true"/>Silenciar</> : <><Volume2 size={15} aria-hidden="true"/>Escuchar orientación</>}
                  </button>
                  <button type="button" disabled={!ttsSupported()} onClick={()=>{ orientStop.current?.(); setOrientSpeaking(true); orientStop.current = playCues([{ id:"o", kind:"speech", text:ORIENTATION, speaker:{ id:"other", name:"Orientación docente", role:"Docente", voice:"teacher", portrait:"garcia" } }], { onCue:()=>{}, onDone:()=>{ orientStop.current=null; setOrientSpeaking(false); } }); }}
                    className="min-h-11 px-4 rounded-xl text-sm font-semibold border inline-flex items-center gap-2" style={{ color:P.text, borderColor:P.border }}><Repeat size={15} aria-hidden="true"/>Repetir audio</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-bold text-sm" style={{ color:P.text }}>Resumen del grupo</h2>
                <DemoChip/>
                <span className="text-xs" style={{ color:P.muted }}>Participación, misiones de hoy, gráficas y habilidades son ejemplos del prototipo.</span>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatPill icon={<Users size={22} aria-hidden="true"/>} val={String(TEACHER_DATA.length)} label="Estudiantes demo" color={P.c4}/>
                <StatPill icon={<Target size={22} aria-hidden="true"/>} val="87%" label="Participación (demo)" color={P.v4}/>
                <StatPill icon={<Zap size={22} aria-hidden="true"/>} val="142" label="Misiones hoy (demo)"  color={P.a3}/>
                <StatPill icon={<TriangleAlert size={22} aria-hidden="true"/>} val={String(TEACHER_DATA.filter(s=>s.alert).length)} label="Alertas (demo)" color={P.r4}/>
              </div>
              {TEACHER_DATA.some(s=>s.alert)&&(
                <div className="rounded-2xl p-4 mb-6 border flex gap-3" style={{ background:"rgba(239,68,68,.07)", borderColor:"rgba(239,68,68,.25)" }}>
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color:P.r3 }}/>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color:P.r4 }}>Estudiantes que requieren atención inmediata <DemoChip/></p>
                    {TEACHER_DATA.filter(s=>s.alert).map(s=>(
                      <p key={s.name} className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.7)" }}>• <strong>{s.name}</strong> — racha de {s.streak} día(s), habilidades bajo el promedio.</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:P.text }}>Habilidades promedio del grupo <DemoChip/></h3>
                  <RadarSVG data={RADAR_DATA_TEACHER} color={P.c3} size={230}/>
                </div>
                <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:P.text }}>Actividad semanal del grupo <DemoChip/></h3>
                  <div className="flex items-end gap-2 h-40">
                    {[42,67,31,88,55,76,20].map((v,i)=>(
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full rounded-t-lg" style={{ height:`${(v/88)*130}px`, background:i===5?g(P.c2,P.c3,"180deg"):"rgba(255,255,255,0.08)" }}/>
                        <span className="text-xs" style={{ color:P.muted }}>{"LMXJVSD"[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color:P.text }}>Progreso individual</h3>
              <p className="text-xs mb-3" style={{ color:P.muted }}>Nivel, XP y monedas muestran las cuentas demo en esta sesión. Misiones, racha y habilidades son <strong style={{ color:"#FCD34D" }}>datos demo</strong>.</p>
              <div className="space-y-3">
                {TEACHER_DATA.map((s,i)=>{
                  const stuKey=s.name.split(" ")[0].toLowerCase();
                  const stuPlans=studentPlans[stuKey]??[];
                  const live=demoProfiles[SEED_USERS[i]?.id];
                  return (
                    <div key={i} className="rounded-2xl border overflow-hidden transition-all" style={{ background:expandedS===s.name?"rgba(139,92,246,.07)":P.s1, borderColor:expandedS===s.name?P.v3:P.border }}>
                      <button type="button" aria-expanded={expandedS===s.name} className="w-full px-5 py-4 flex items-center gap-4" onClick={()=>setExpandedS(expandedS===s.name?null:s.name)}>
                        <div className="flex-shrink-0"><CharSVG hair={SEED_USERS[i]?.hairColor||"#2C1810"} hairStyle={SEED_USERS[i]?.hairStyle||"A"} skin={SEED_USERS[i]?.skinTone||"#FDBCB4"} shirt={SEED_USERS[i]?.shirtColor||P.v2} mood="happy" size={50}/></div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold" style={{ color:P.text }}>{s.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={s.alert?{ background:"rgba(239,68,68,.15)",color:P.r3,border:"1px solid rgba(239,68,68,.3)" }:{ background:"rgba(16,185,129,.15)",color:P.g3 }}>{s.alert?"⚠ Alerta":"✓ Progreso"}</span>
                            {stuPlans.length>0&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:"rgba(139,92,246,.15)",color:P.v4 }}>📋 {stuPlans.length} caso{stuPlans.length>1?"s":""}</span>}
                          </div>
                          <div className="flex gap-3 text-xs mt-0.5 flex-wrap" style={{ color:P.muted }}>
                            <span data-testid={`teacher-xp-${SEED_USERS[i]?.id}`} style={{ color:P.text }}>Nivel {getLevelInfo(live?.xp??0).level} · {(live?.xp??0).toLocaleString()} XP · {live?.coins??0} monedas</span>
                            <span>{s.missions} misiones (demo)</span><span>🔥 {s.streak} días (demo)</span>
                          </div>
                        </div>
                        <span aria-hidden="true" style={{ color:P.muted }}>{expandedS===s.name?"▲":"▼"}</span>
                      </button>
                      {expandedS===s.name&&(
                        <div className="px-5 pb-5 pt-2 border-t" style={{ borderColor:P.border }}>
                          <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                              <Skill label="Comunicación" value={s.com} color={P.v3}/>
                              <Skill label="Liderazgo"    value={s.lid} color={P.a3}/>
                              <Skill label="Empatía"      value={s.emp} color={P.g3}/>
                              <Skill label="Pensamiento"  value={s.pen} color={P.c3}/>
                            </div>
                            <div className="rounded-xl p-4 border" style={s.alert?{ background:"rgba(239,68,68,.06)",borderColor:"rgba(239,68,68,.2)" }:{ background:"rgba(16,185,129,.06)",borderColor:"rgba(16,185,129,.2)" }}>
                              <p className="text-xs font-bold mb-2" style={{ color:s.alert?P.r3:P.g3 }}>{s.alert?"📌 Recomendación IA":"✅ Sugerencia IA"}</p>
                              <p className="text-xs leading-relaxed mb-3" style={{ color:"rgba(240,246,255,.7)" }}>
                                {s.alert?`Generar un caso Básico personalizado para ${s.name.split(" ")[0]} con el Asistente IA para retomar el ritmo.`:`${s.name.split(" ")[0]} está listo para casos Avanzados. El Asistente IA puede generar uno de Liderazgo.`}
                              </p>
                              <button onClick={()=>{ setCaseTarget(stuKey); setCaseDiff(s.alert?"Básico":"Avanzado"); setTeacherTab("ai"); }}
                                className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80" style={{ background:g(P.v2,P.c2) }}>
                                🤖 Generar caso con IA
                              </button>
                            </div>
                          </div>
                          {stuPlans.length>0&&(
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:P.muted }}>Casos asignados ({stuPlans.length})</p>
                              <div className="space-y-2">
                                {stuPlans.map(c=>(
                                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ background:P.s2, borderColor:P.border }}>
                                    <span className="text-lg">{c.worldEmoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold truncate" style={{ color:P.text }}>{c.title}</p>
                                      <p className="text-xs" style={{ color:P.muted }}>{c.worldName} · {c.difficulty} · {c.duration} · {c.xp} XP</p>
                                    </div>
                                    <button onClick={()=>setStudentPlans(prev=>{ const p={...prev}; p[stuKey]=(p[stuKey]??[]).filter(x=>x.id!==c.id); return p; })} className="text-xs px-2 py-1 rounded-lg hover:bg-red-500/10" style={{ color:P.r3 }}>✕</button>
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
            </>)}

            {/* ── AI CASE GENERATOR TAB ── */}
            {teacherTab==="ai"&&(<>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black" style={{ color:P.text }}>🤖 Asistente IA · Generador de Casos</h1>
                  <p className="text-sm mt-0.5" style={{ color:P.muted }}>Crea casos didácticos personalizados para tus estudiantes en segundos</p>
                </div>
                {totalPlans>0&&<button onClick={()=>setTeacherTab("plans")} className="text-sm font-bold px-4 py-2 rounded-xl border" style={{ borderColor:P.v3, color:P.v4, background:"rgba(139,92,246,.08)" }}>📋 Ver planes ({totalPlans})</button>}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                  {/* Target */}
                  <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:P.muted }}>¿Para quién es el caso?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={()=>setCaseTarget("all")} className="rounded-xl p-3 text-left border transition-all" style={caseTarget==="all"?{ background:"rgba(14,165,233,.15)",borderColor:P.c3 }:{ background:P.s2,borderColor:P.border }}>
                        <p className="text-lg mb-0.5">👥</p>
                        <p className="text-xs font-bold" style={{ color:caseTarget==="all"?P.text:P.muted }}>Todo el grupo</p>
                        <p className="text-xs" style={{ color:P.muted }}>{u.group}</p>
                      </button>
                      {TEACHER_DATA.map((s,i)=>{
                        const key=s.name.split(" ")[0].toLowerCase();
                        return (
                          <button key={i} onClick={()=>setCaseTarget(key)} className="rounded-xl p-2.5 flex items-center gap-2 border transition-all" style={caseTarget===key?{ background:"rgba(139,92,246,.15)",borderColor:P.v3 }:{ background:P.s2,borderColor:P.border }}>
                            <CharSVG hair={SEED_USERS[i]?.hairColor||"#2C1810"} hairStyle={SEED_USERS[i]?.hairStyle||"A"} skin={SEED_USERS[i]?.skinTone||"#FDBCB4"} shirt={SEED_USERS[i]?.shirtColor||P.v2} mood="happy" size={38}/>
                            <div><p className="text-xs font-semibold" style={{ color:P.text }}>{s.name.split(" ")[0]}</p><p className="text-xs" style={{ color:P.muted }}>Nivel {getLevelInfo(demoProfiles[SEED_USERS[i]?.id]?.xp??0).level}</p></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* World */}
                  <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:P.muted }}>Habilidad a trabajar</p>
                    <div className="grid grid-cols-3 gap-2">
                      {WORLDS.filter(w => CASE_BANK[w.id]).map(w=>(
                        <button key={w.id} onClick={()=>setCaseWorldId(w.id)} className="rounded-xl p-3 text-center border transition-all" style={caseWorldId===w.id?{ background:`linear-gradient(135deg,${w.from}33,${w.to}22)`,borderColor:w.from }:{ background:P.s2,borderColor:P.border }}>
                          <p className="text-2xl mb-1">{w.emoji}</p>
                          <p className="text-xs font-semibold leading-tight" style={{ color:caseWorldId===w.id?P.text:P.muted }}>{w.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Difficulty */}
                  <div className="rounded-2xl p-4 border" style={{ background:P.s1, borderColor:P.border }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:P.muted }}>Nivel de dificultad</p>
                    <div className="flex gap-2">
                      {(["Básico","Intermedio","Avanzado"] as const).map(d=>(
                        <button key={d} onClick={()=>setCaseDiff(d)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all" style={caseDiff===d?{ background:d==="Básico"?g(P.g2,P.g1):d==="Intermedio"?g(P.a2,P.a1):g(P.r2,P.r1), color:"#fff", border:"none" }:{ background:P.s2,borderColor:P.border,color:P.muted }}>
                          {d==="Básico"?"🟢":d==="Intermedio"?"🟡":"🔴"} {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Context */}
                  <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:P.muted }}>Contexto <span style={{ color:"rgba(124,143,172,.5)" }}>(opcional)</span></p>
                    <p className="text-xs mb-3" style={{ color:P.muted }}>Describe el contexto del estudiante, situación del salón o enfoque específico.</p>
                    <textarea value={caseContext} onChange={e=>setCaseContext(e.target.value)} rows={3} placeholder="Ej: El grupo tuvo un conflicto esta semana y quiero que reflexionen sobre comunicación asertiva..."
                      className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none resize-none" style={{ background:P.s2, borderColor:P.border, color:P.text, fontFamily:"'Poppins',sans-serif" }}
                      onFocus={e=>{(e.target as HTMLElement).style.borderColor=P.v3}} onBlur={e=>{(e.target as HTMLElement).style.borderColor=P.border}}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {["Conflicto grupal","Bajo rendimiento","Situación real del salón","Evaluación oral próxima"].map(hint=>(
                        <button key={hint} onClick={()=>setCaseContext(p=>p?p+". "+hint:hint)} className="text-xs px-2.5 py-1 rounded-full border hover:opacity-80 transition-all" style={{ background:"rgba(139,92,246,.1)", borderColor:"rgba(139,92,246,.25)", color:P.v4 }}>{hint}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>{ if(caseGenerating) return; setCaseGenerating(true); setGeneratedCase(null); setTimeout(()=>{ setGeneratedCase(generateAICase(caseWorldId,caseDiff,caseTarget,caseContext)); setCaseGenerating(false); },1800); }}
                    className="w-full py-4 rounded-2xl font-black text-white text-base hover:scale-[1.02] active:scale-[.98] transition-all" style={{ background:g(P.v2,P.c2), boxShadow:`0 6px 20px rgba(109,40,217,.35)` }}>
                    {caseGenerating?"🤖 Generando caso didáctico…":"✨ Generar caso con IA"}
                  </button>
                  {caseGenerating&&(
                    <div className="rounded-2xl p-4 border text-center" style={{ background:P.s1, borderColor:P.border }}>
                      <div className="flex justify-center gap-1.5 mb-2">{[0,1,2].map(i=><div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background:P.v4, animation:`pulse 1s ${i*.2}s infinite` }}/>)}</div>
                      <p className="text-sm" style={{ color:P.muted }}>Analizando perfil y generando caso personalizado…</p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div>
                  {!generatedCase&&!caseGenerating&&(
                    <div className="rounded-2xl p-8 border text-center flex flex-col items-center justify-center" style={{ background:P.s1, borderColor:P.border, minHeight:"400px" }}>
                      <div className="text-6xl mb-4">🤖</div>
                      <p className="font-bold text-lg mb-2" style={{ color:P.text }}>Asistente IA listo</p>
                      <p className="text-sm leading-relaxed max-w-xs" style={{ color:P.muted }}>Configura el caso a la izquierda y pulsa "Generar". En segundos tendrás un caso didáctico completo y listo para asignar a tu(s) estudiante(s).</p>
                    </div>
                  )}
                  {generatedCase&&!caseGenerating&&(
                    <div className="space-y-4">
                      <div className="rounded-2xl overflow-hidden border" style={{ background:P.s1, borderColor:P.border }}>
                        {/* Header */}
                        <div className="p-5 border-b" style={{ background:`linear-gradient(135deg,${WORLDS.find(w=>w.id===generatedCase.worldId)?.from??P.v2}22,transparent)`, borderColor:P.border }}>
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-3xl">{generatedCase.worldEmoji}</span>
                            <div>
                              <p className="font-black text-base" style={{ color:P.text }}>{generatedCase.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color:P.text, borderColor:`${WORLDS.find(w=>w.id===generatedCase.worldId)?.from??P.v2}66` }}>{generatedCase.worldName}</span>
                                <DiffBadge level={generatedCase.difficulty as any}/>
                                <span className="text-xs" style={{ color:P.muted }}>⏱ {generatedCase.duration}</span>
                                <span className="text-xs font-bold" style={{ color:P.v4 }}>⚡ {generatedCase.xp} XP</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded-xl border" style={{ background:"rgba(255,255,255,.04)", borderColor:P.border }}>
                            <span>👤</span><span style={{ color:P.muted }}>Para:</span>
                            <span className="font-bold" style={{ color:P.text }}>{generatedCase.targetName}</span>
                            <span className="ml-auto" style={{ color:P.muted }}>{generatedCase.createdAt}</span>
                          </div>
                        </div>
                        {/* Body */}
                        <div className="p-5 space-y-4">
                          <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:P.c4 }}>🎯 Objetivo de aprendizaje</p><p className="text-sm leading-relaxed" style={{ color:"rgba(240,246,255,.85)" }}>{generatedCase.objective}</p></div>
                          <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:P.v4 }}>📖 Escenario</p><p className="text-sm leading-relaxed" style={{ color:"rgba(240,246,255,.8)" }}>{generatedCase.scenario}</p></div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:P.a3 }}>💬 Preguntas de reflexión</p>
                            <div className="space-y-1.5">
                              {generatedCase.questions.map((q,i)=>(
                                <div key={i} className="flex gap-2.5 text-sm" style={{ color:"rgba(240,246,255,.78)" }}>
                                  <span className="font-black flex-shrink-0" style={{ color:P.a3 }}>{i+1}.</span><p>{q}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-xl p-3.5 border" style={{ background:"rgba(16,185,129,.06)", borderColor:"rgba(16,185,129,.2)" }}>
                            <p className="text-xs font-bold mb-1" style={{ color:P.g3 }}>✅ Criterio de evaluación</p>
                            <p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.7)" }}>{generatedCase.evaluation}</p>
                          </div>
                          {generatedCase.tips&&(
                            <div className="rounded-xl p-3.5 border" style={{ background:"rgba(14,165,233,.06)", borderColor:"rgba(14,165,233,.2)" }}>
                              <p className="text-xs font-bold mb-1" style={{ color:P.c3 }}>💡 Tips para el docente</p>
                              <p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.7)" }}>{generatedCase.tips}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={()=>{
                          const key=generatedCase.targetId==="all"?"all":generatedCase.targetId;
                          setStudentPlans(prev=>({...prev,[key]:[...(prev[key]??[]),generatedCase]}));
                          setGeneratedCase(null); setCaseContext("");
                          setTimeout(()=>setTeacherTab("plans"),300);
                        }} className="flex-1 py-3.5 rounded-xl font-black text-white text-sm hover:scale-[1.02] transition-all" style={{ background:g(P.g2,P.g3), boxShadow:`0 6px 20px rgba(16,185,129,.3)` }}>
                          ✅ Agregar al plan
                        </button>
                        <button onClick={()=>{ setCaseGenerating(true); setGeneratedCase(null); setTimeout(()=>{ setGeneratedCase(generateAICase(caseWorldId,caseDiff,caseTarget,caseContext)); setCaseGenerating(false); },1600); }}
                          className="px-5 py-3.5 rounded-xl font-bold text-sm border hover:bg-white/5 transition-all" style={{ color:P.muted, borderColor:P.border }}>
                          🔄 Otro caso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>)}

            {/* ── PLANS TAB ── */}
            {teacherTab==="plans"&&(<>
              <h1 className="text-2xl font-black mb-0.5" style={{ color:P.text }}>Planes Asignados</h1>
              <p className="text-sm mb-6" style={{ color:P.muted }}>{totalPlans} caso{totalPlans!==1?"s":""} generado{totalPlans!==1?"s":""} con IA · Grupo {u.group}</p>
              {totalPlans===0?(
                <div className="rounded-2xl p-12 border text-center" style={{ background:P.s1, borderColor:P.border }}>
                  <div className="text-6xl mb-4">📋</div>
                  <p className="font-bold text-lg mb-2" style={{ color:P.text }}>Sin planes asignados aún</p>
                  <p className="text-sm mb-5" style={{ color:P.muted }}>Usa el Asistente IA para generar casos didácticos y asignarlos.</p>
                  <button onClick={()=>setTeacherTab("ai")} className="px-6 py-3 rounded-xl font-bold text-white" style={{ background:g(P.v2,P.c2) }}>🤖 Ir al Asistente IA</button>
                </div>
              ):(
                <div className="space-y-6">
                  {(studentPlans["all"]??[]).length>0&&(
                    <div>
                      <div className="flex items-center gap-2 mb-3"><span className="text-xl">👥</span><h3 className="font-bold" style={{ color:P.text }}>Todo el grupo</h3><span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(14,165,233,.15)",color:P.c4 }}>{studentPlans["all"].length} casos</span></div>
                      <div className="grid grid-cols-2 gap-4">{studentPlans["all"].map(c=><CaseCard key={c.id} c={c} onRemove={()=>setStudentPlans(prev=>({...prev,all:(prev.all??[]).filter(x=>x.id!==c.id)}))}/>)}</div>
                    </div>
                  )}
                  {TEACHER_DATA.map((s,i)=>{
                    const key=s.name.split(" ")[0].toLowerCase();
                    const plans=studentPlans[key]??[];
                    if(!plans.length) return null;
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-3 mb-3">
                          <CharSVG hair={SEED_USERS[i]?.hairColor||"#2C1810"} hairStyle={SEED_USERS[i]?.hairStyle||"A"} skin={SEED_USERS[i]?.skinTone||"#FDBCB4"} shirt={SEED_USERS[i]?.shirtColor||P.v2} mood="happy" size={40}/>
                          <h3 className="font-bold" style={{ color:P.text }}>{s.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(139,92,246,.15)",color:P.v4 }}>{plans.length} caso{plans.length>1?"s":""}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">{plans.map(c=><CaseCard key={c.id} c={c} onRemove={()=>setStudentPlans(prev=>({...prev,[key]:(prev[key]??[]).filter(x=>x.id!==c.id)}))}/>)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>)}

          </div>
        </main>
      </div>
    </Shell>
  );


  // ══════════════════════════════════════════════════════════════════════════════
  // STUDENT APP — also used by the teacher practice view, with isolated state
  // ══════════════════════════════════════════════════════════════════════════════
  const me = su!;
  const meLevel = getLevelInfo(me.xp);
  const mapScreens:AppScreen[] = ["skill","sim","results"];
  const STUDENT_NAV = [
    { id:"home" as AppScreen, icon:House, lbl:"Inicio" }, { id:"map" as AppScreen, icon:MapIcon, lbl:"Mapa" },
    { id:"orion" as AppScreen, icon:MessageCircle, lbl:"Orion" },
    { id:"dash" as AppScreen, icon:BarChart3, lbl:"Progreso" }, { id:"avatar" as AppScreen, icon:UserRound, lbl:"Avatar" },
  ];
  const activeNav = mapScreens.includes(appScreen)?"map":appScreen;
  const avatar = { hair: me.hairColor, hairStyle: me.hairStyle, skin: me.skinTone, shirt: me.shirtColor };
  const executedPracticeWrites = practiceWrites.filter(w => !w.blocked).length;
  const blockedPracticeWrites  = practiceWrites.filter(w => w.blocked).length;
  function stageOf(r: MissionRun|null) {
    if (!r) return null;
    const sc = getScript(r.missionId);
    const scn = sc.scenes[r.sceneId];
    return scn ? { n: scn.stage, total: sc.stages.length, label: sc.stages[scn.stage-1] } : null;
  }
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
  const btnPrimary = "min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 inline-flex items-center justify-center gap-2";
  const btnGhost   = "min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/5 inline-flex items-center justify-center gap-2";
  const primaryStyle = { background:"linear-gradient(110deg,#5832D5,#7939DD 68%,#9D36BF)", boxShadow:"0 5px 18px rgba(124,58,237,.34)" };
  const ghostStyle   = { color:P.text, borderColor:P.border, background:"rgba(255,255,255,.03)" };

  return (
    <Shell>
      {/* Short celebration (skipped with reduced motion; results are always shown as text) */}
      {confetti && !reducedMotion && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:100 }} aria-hidden="true">
          {confettiList.slice(0,30).map((p,i)=><div key={i} className="absolute rounded-sm" style={{ left:p.left,top:0,width:`${p.size}px`,height:`${p.size}px`,backgroundColor:p.color,transform:`rotate(${p.rot}deg)`,animation:`cffall 1.4s ${(i%10)*0.03}s linear forwards` }}/>)}
        </div>
      )}
      {levelUpShow && lastReward && !reducedMotion && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex:200 }} aria-hidden="true">
          <div className="text-center" style={{ animation:"lvup .45s cubic-bezier(.17,.67,.44,1.27)" }}>
            <div className="rounded-3xl px-8 py-4 border" style={{ background:"linear-gradient(135deg,#0A1220,#1a0e4e)", borderColor:"rgba(139,92,246,.5)", boxShadow:"0 0 60px rgba(139,92,246,.4)" }}>
              <p className="font-black text-3xl" style={{ color:"#C4B5FD" }}>¡Nivel {lastReward.newLevel}!</p>
              <p className="text-sm mt-1" style={{ color:"rgba(240,246,255,.85)" }}>Subiste de nivel</p>
            </div>
          </div>
        </div>
      )}
      {particles.length>0&&appScreen==="sim"&&!reducedMotion&&(
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:90 }} aria-hidden="true">
          {particles.map(p=>(
            <div key={p.id} className="absolute text-3xl" style={{ left:`${p.x}%`, bottom:"30%", animation:`particleup 1.4s ${p.delay}s ease-out forwards` }}>{p.emoji}</div>
          ))}
        </div>
      )}

      <div className="flex flex-col h-screen" style={{ background:P.bg }}>
        <a href="#lx-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg" style={{ background:P.v2, color:"#fff" }}>Saltar al contenido</a>

        {/* Teacher practice band */}
        {isPractice && (
          <div id="lx-band" role="region" aria-label="Vista de práctica docente" className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-3 border-b flex-shrink-0" style={{ background:"linear-gradient(90deg,#0B3550,#16305E)", borderColor:"rgba(56,189,248,.55)" }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(56,189,248,.2)" }}><FlaskConical size={18} style={{ color:P.c4 }} aria-hidden="true"/></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">Vista de práctica docente</p>
              <p className="text-xs leading-relaxed" style={{ color:"#D3E9F8" }}>
                Estás probando como estudiante con una cuenta de práctica. El avatar, el XP, las monedas y el progreso de esta vista no se guardan en ninguna cuenta.{" "}
                <span data-testid="practice-writes">Escrituras en Supabase durante la práctica: {executedPracticeWrites}{blockedPracticeWrites>0?` (bloqueadas: ${blockedPracticeWrites})`:""}.</span>
              </p>
            </div>
            <button type="button" onClick={exitPractice} className="min-h-11 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 flex-shrink-0" style={{ background:"#fff", color:"#0B3550" }}>
              <Undo2 size={16} aria-hidden="true"/>Volver al panel docente
            </button>
          </div>
        )}

        {/* Mobile navigation */}
        <nav id="lx-mobilenav" aria-label="Secciones" className="md:hidden flex items-center gap-1 px-3 py-2 border-b overflow-x-auto flex-shrink-0" style={{ background:P.s1, borderColor:P.border }}>
          <LXLogo size={22}/><span className="flex-1"/>
          {STUDENT_NAV.map(n=>{ const I=n.icon; return (
            <button key={n.id} type="button" onClick={()=>setAppScreen(n.id)} aria-current={activeNav===n.id?"page":undefined} className="min-w-11 min-h-11 px-2 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold"
              style={activeNav===n.id?{ background:"rgba(34,211,238,.14)", color:"#E9FDFF" }:{ color:P.muted }}><I size={18} aria-hidden="true"/>{n.lbl}</button>
          ); })}
          <button type="button" onClick={isPractice?exitPractice:logout} aria-label={isPractice?"Volver al panel docente":"Cerrar sesión"} className="min-w-11 min-h-11 rounded-xl flex items-center justify-center" style={{ color:P.muted }}>{isPractice?<Undo2 size={18}/>:<LogOut size={18}/>}</button>
        </nav>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside id="lx-sidebar" className="hidden md:flex w-60 flex-shrink-0 flex-col border-r py-5 px-3 overflow-y-auto" style={{ background:P.s1, borderColor:P.border }} aria-label="Barra lateral">
            <div className="px-2 mb-6"><LXLogo size={28}/></div>
            <button type="button" onClick={()=>setAppScreen("avatar")} aria-label={`Abrir mi perfil y avatar. ${me.name} ${me.last}, nivel ${meLevel.level}`} className="w-full rounded-2xl p-3 mb-5 border text-left transition-all hover:scale-[1.01]" style={{ background:P.s2, borderColor:P.border }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1 relative">
                  <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={52}/>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:g(P.v2,P.c2) }} aria-hidden="true"><span style={{ fontSize:9, color:"#fff" }}>✏️</span></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color:P.text }}>{me.name} {me.last}</p>
                  <p className="text-xs" style={{ color:P.muted }}>{me.grade}</p>
                  {me.pet&&me.pet!=="⛔"&&<p className="text-sm mt-0.5" aria-hidden="true">{me.pet}</p>}
                </div>
              </div>
              <XPBar xp={me.xp}/>
              <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor:P.border }}>
                {[{ icon:Zap,val:animXP.toLocaleString(),lbl:"XP",color:P.a4 },{ icon:Coins,val:String(me.coins),lbl:"Monedas",color:P.a3 },{ icon:Flame,val:`${me.streak}d`,lbl:"Racha",color:"#FDBA74" }].map(s=>(
                  <div key={s.lbl} className="text-center">
                    <div className="text-xs font-bold flex items-center gap-1 justify-center" style={{ color:s.color }}><s.icon size={12} aria-hidden="true"/>{s.val}</div>
                    <div className="text-[11px]" style={{ color:P.muted }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </button>
            <nav aria-label="Secciones" className="space-y-1 flex-1">
              {STUDENT_NAV.map(n=>{ const I=n.icon; const on=activeNav===n.id; return (
                <button key={n.id} type="button" onClick={()=>setAppScreen(n.id)} aria-current={on?"page":undefined} className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={on?{ background:"rgba(34,211,238,.14)", color:"#E9FDFF", boxShadow:`inset 3px 0 0 ${P.c3}` }:{ color:P.muted }}>
                  <I size={18} aria-hidden="true"/>{n.lbl}
                </button>
              ); })}
            </nav>
            <div className="border-t pt-3 mt-3" style={{ borderColor:P.border }}>
              {isPractice ? (
                <button type="button" onClick={exitPractice} className="w-full min-h-11 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5" style={{ color:P.c4, borderColor:"rgba(56,189,248,.45)" }}>
                  <Undo2 size={14} aria-hidden="true"/>Volver al panel docente
                </button>
              ) : (
                <button type="button" onClick={logout} className="w-full min-h-11 flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5" style={{ color:P.muted, borderColor:P.border }}>
                  <LogOut size={14} aria-hidden="true"/>Cerrar sesión
                </button>
              )}
            </div>
          </aside>

          {/* Main */}
          <main id="lx-main" tabIndex={-1} className="flex-1 overflow-y-auto">
            <div className={`${appScreen==="sim"?"max-w-[1400px]":"max-w-5xl"} mx-auto px-4 sm:px-8 py-6 sm:py-8`}>
              {appScreen==="home"   && HomeScreen()}
              {appScreen==="map"    && MapScreen()}
              {appScreen==="skill"  && selectedWorld && SkillScreen()}
              {appScreen==="sim"    && SimScreen()}
              {appScreen==="results"&& ResultsScreen()}
              {appScreen==="orion"  && <OrionChat studentName={me.name} messages={orionChat} onMessagesChange={setOrionChat} missionContext={orionMissionContext}/>}
              {appScreen==="dash"   && DashScreen()}
              {appScreen==="avatar" && AvatarScreen()}
            </div>
          </main>
        </div>
      </div>
      {appScreen !== "orion" && !(appScreen === "sim" && decisionDialogOpen) && <OrionFloatingAssistant studentName={me.name} messages={orionChat} onMessagesChange={setOrionChat} missionContext={orionMissionContext}/>}
    </Shell>
  );

  // Screens are plain render functions (not components defined inside App), so they
  // are not remounted on every render: keyboard focus and animations stay stable.

  // ── HOME ──────────────────────────────────────────────────────────────────
  function HomeScreen() {
    const recWorld = WORLDS[0];
    const recMission = WORLD_MISSIONS.com.find(m=>!doneMap[m.id]) ?? WORLD_MISSIONS.com[0];
    const recIndex = WORLD_MISSIONS.com.indexOf(recMission);
    const recStages = getScript(recMission.id).stages.length;
    const rs = stageOf(run);
    const hero = run && runMission && runWorld && rs
      ? { world: runWorld, mission: runMission, index: (WORLD_MISSIONS[runWorld.id] ?? []).indexOf(runMission), continuing: true }
      : { world: recWorld, mission: recMission, index: recIndex, continuing: false };
    return (
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black" style={{ color:P.text }}>Hola, {me.name}</h1>
            <p className="text-sm mt-0.5" style={{ color:P.muted }}>Listo para vivir una nueva experiencia · {me.grade}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-2 border" style={{ background:"rgba(245,197,66,.08)", borderColor:"rgba(245,197,66,.35)" }}>
              <Flame size={16} style={{ color:"#FDBA74" }} aria-hidden="true"/><span className="font-bold text-sm" style={{ color:"#FDE58A" }}>{me.streak} días de racha</span>
            </div>
            <button type="button" onClick={()=>setAppScreen("avatar")} aria-label={`Ver mi perfil · nivel ${meLevel.level}`} className="relative rounded-full overflow-hidden flex items-end justify-center" style={{ width:52, height:52, background:P.s3, boxShadow:`inset 0 0 0 2px ${P.v3}` }}>
              <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" variant="bust" size={52}/>
              <span className="absolute -bottom-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[11px] font-black" style={{ background:P.a3, color:"#3A2600" }} aria-hidden="true">{meLevel.level}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Primary action: continue or choose a mission */}
            <section aria-labelledby="home-mission-title" className="rounded-3xl overflow-hidden border grid sm:grid-cols-5" style={{ background:P.s1, borderColor: hero.continuing ? P.c3 : P.border, boxShadow:SHADOW.card }}>
              <div className="sm:col-span-2 relative min-h-[200px]">
                <div className="absolute inset-0"><MissionArt worldId={hero.world.id} from={hero.world.from} index={hero.index} height={260}/></div>
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black" style={{ background:"rgba(10,18,48,.88)", color: hero.continuing ? P.c4 : P.v4, border:`1px solid ${hero.continuing ? P.c3 : P.v3}` }}>
                  {hero.continuing ? <><Play size={12} aria-hidden="true"/>Misión en curso</> : <><Sparkles size={12} aria-hidden="true"/>Recomendada por Orion</>}
                </span>
              </div>
              <div className="sm:col-span-3 p-6 flex flex-col">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color:P.c4 }}>{hero.continuing ? "Continuar misión" : "Elegir misión"} · {hero.world.name}</p>
                <h2 id="home-mission-title" className="text-2xl font-black mt-1" style={{ color:P.text }}>{hero.continuing ? `Continuar misión: ${hero.mission.title}` : hero.mission.title}</h2>
                {hero.continuing && run && rs ? (<>
                  <StageSteps n={rs.n} total={rs.total} label={rs.label}/>
                  <p className="text-sm mt-3" style={{ color:P.muted }}>
                    {run.decisions.length} {run.decisions.length===1?"decisión tomada":"decisiones tomadas"} · {run.hints.length} {run.hints.length===1?"pista de Orion usada":"pistas de Orion usadas"} · Retomas en: {PHASE_LABEL[run.phase].toLowerCase()}
                  </p>
                </>) : (<>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color:"#D3DBF5" }}>{hero.mission.desc}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs flex-wrap" style={{ color:P.muted }}>
                    <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true"/>{hero.mission.dur}</span><DiffBadge level={hero.mission.diff}/><span>{recStages} etapas</span><span className="font-bold" style={{ color:P.a4 }}>+{hero.mission.xp} XP</span>
                  </div>
                </>)}
                <div className="flex flex-wrap gap-3 mt-auto pt-5">
                  {hero.continuing
                    ? <button type="button" onClick={continueMission} className={`${btnPrimary} text-base px-6 py-3`} style={primaryStyle}>Continuar misión <ChevronRight size={18} aria-hidden="true"/></button>
                    : <button type="button" onClick={()=>startMission(recWorld, recMission)} className={`${btnPrimary} text-base px-6 py-3`} style={primaryStyle}>Empezar misión <ChevronRight size={18} aria-hidden="true"/></button>}
                  <button type="button" onClick={()=>setAppScreen("map")} className={btnGhost} style={ghostStyle}>{hero.continuing ? "Elegir otra misión" : "Ver todas en el mapa"}</button>
                </div>
              </div>
            </section>

            <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm" style={{ color:P.text }}>Metas del día</h3>
                <span className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color:P.a4 }}>2 de 3</span><DemoChip/></span>
              </div>
              {[{ done:true, text:"Completa una misión de Comunicación",xp:50 },
                { done:true, text:"Mantén tu racha diaria activa",       xp:30 },
                { done:false,text:"Explora un mundo nuevo en el mapa",   xp:75 }].map((m,i)=>(
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor:P.border }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={m.done?{ background:P.g2 }:{ border:`2px solid ${P.muted}` }} aria-hidden="true">
                    {m.done&&<Check size={14} className="text-white"/>}
                  </div>
                  <span className="text-sm flex-1" style={{ color:m.done?P.muted:P.text }}>{m.text}<span className="sr-only">{m.done?" (hecha)":" (pendiente)"}</span></span>
                  <span className="text-xs font-bold" style={{ color:m.done?P.g4:P.a4 }}>{m.done?"Hecha":`+${m.xp} XP`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mentor panel */}
          <aside aria-labelledby="home-mentor" className="rounded-3xl border p-5 flex flex-col" style={{ background:"linear-gradient(180deg,#1A1F5A,#111C42)", borderColor:"rgba(187,170,255,.35)" }}>
            <h2 id="home-mentor" className="text-sm font-black uppercase tracking-wider" style={{ color:P.v4 }}>Orion · Mentor</h2>
            <div className="flex justify-center my-3"><OrionFigure size={150}/></div>
            <div className="rounded-2xl p-4 text-sm leading-relaxed" style={{ background:"rgba(255,255,255,.06)", color:"#E3E8FA" }}>
              {run ? <>Retoma tu misión donde la dejaste. Estás en la etapa <strong style={{ color:P.c4 }}>{rs?.label?.toLowerCase()}</strong>.</>
                : <>Podemos empezar practicando cómo comunicar tus ideas. Te recomiendo <strong style={{ color:P.c4 }}>{recMission.title}</strong>.</>}
              <span className="block mt-2">Te faltan <strong style={{ color:P.a4 }}>{meLevel.xpToNext} XP</strong> para el nivel {meLevel.level+1}.</span>
            </div>
            <button type="button" onClick={()=>setAppScreen("dash")} className={`${btnGhost} w-full mt-4`} style={ghostStyle}><BarChart3 size={15} aria-hidden="true"/>Ver mi progreso</button>
          </aside>
        </div>
      </div>
    );
  }

  // ── MAP ───────────────────────────────────────────────────────────────────
  function MapScreen() {
    const rs = stageOf(run);
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <BackArrow onClick={()=>setAppScreen("home")} label="Volver al inicio"/>
          <div><h1 className="text-2xl font-black" style={{ color:P.text }}>Escenarios disponibles</h1><p className="text-sm" style={{ color:P.muted }}>Elige un mundo para empezar la simulación</p></div>
        </div>
        {run && runMission && runWorld && rs && (
          <div className="rounded-2xl p-4 mb-5 border flex flex-wrap items-center gap-4" style={{ background:"rgba(34,211,238,.08)", borderColor:P.c3 }}>
            <WorldEmblem worldId={runWorld.id} from={runWorld.from} to={runWorld.to} size={44}/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:P.c4 }}>Misión activa · {runWorld.name}</p>
              <p className="text-sm font-bold" style={{ color:P.text }}>{runMission.title} — Etapa {rs.n} de {rs.total}: {rs.label}</p>
            </div>
            <button type="button" onClick={continueMission} className={btnPrimary} style={primaryStyle}>Continuar misión</button>
          </div>
        )}
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {WORLDS.map((w, wi)=>{
            const active = run?.worldId===w.id && !!rs;
            const missions = WORLD_MISSIONS[w.id] ?? [];
            const completed = missions.filter(mission => doneMap[mission.id]).length;
            return (
              <li key={w.id} className="rounded-2xl overflow-hidden border flex flex-col" style={{ background:P.s1, borderColor: active ? P.c3 : P.border, boxShadow: active ? `0 0 0 2px ${P.c3}` : SHADOW.card }}>
                <div className="relative">
                  <MissionArt worldId={w.id} from={w.from} index={wi} height={120}/>
                  <span className="absolute -bottom-5 left-4"><WorldEmblem worldId={w.id} from={w.from} to={w.to} size={44}/></span>
                  {active && rs && <span className="absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background:P.c3, color:"#05202A" }}>Activa · Etapa {rs.n}/{rs.total}</span>}
                </div>
                <div className="p-4 pt-7 flex flex-col flex-1">
                  <h2 className="font-bold" style={{ color:P.text }}>{w.name}</h2>
                  <p className="text-sm mt-1 leading-relaxed flex-1" style={{ color:P.muted }}>{WORLD_DESC[w.id]}</p>
                  <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1" style={{ color:P.muted }}><span>Progreso</span><span>{completed}/{missions.length} misiones</span></div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.1)" }} aria-hidden="true"><div className="h-full rounded-full" style={{ width:`${(completed / missions.length)*100}%`, background:P.a3 }}/></div>
                  </div>
                  <button type="button" onClick={() => { setSelectedWorld(w); setAppScreen("skill"); }}
                    aria-label={`${w.name}. Seleccionar. ${completed} de ${missions.length} misiones.${active && rs ? ` Misión activa en la etapa ${rs.n} de ${rs.total}.` : ""}`}
                    className={`${btnPrimary} w-full mt-4`} style={primaryStyle}>
                    {active ? "Ver misiones · en curso" : "Seleccionar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // ── SKILL ─────────────────────────────────────────────────────────────────
  function SkillScreen() {
    const w = selectedWorld!;
    const worldMs = WORLD_MISSIONS[w.id] ?? WORLD_MISSIONS.com;
    const doneCount = worldMs.filter(m => doneMap[m.id]).length;
    const rs = stageOf(run);
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <BackArrow onClick={()=>setAppScreen("map")} label="Volver al mapa"/>
          <WorldEmblem worldId={w.id} from={w.from} to={w.to} size={44}/>
          <div>
            <h1 className="text-2xl font-black" style={{ color:P.text }}>{w.name}</h1>
            <p className="text-sm" style={{ color:P.muted }}>{doneCount} de {worldMs.length} misiones completadas en esta sesión</p>
          </div>
        </div>
        <p className="text-sm mb-6 sm:ml-[112px]" style={{ color:P.g4 }}>
          {doneCount > 0 ? `+${worldMs.filter(m=>doneMap[m.id]).reduce((s,m)=>s+(doneMap[m.id]?.xp??0),0)} XP ganados en este mundo` : "Completa misiones para ganar XP"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {worldMs.map((m, mi) => {
            const done = doneMap[m.id];
            const active = run?.missionId===m.id;
            const missionScript = getScript(m.id);
            const stages = missionScript.stages.length;
            const decisionCount = Object.values(missionScript.scenes).reduce((total, item) => total + item.choices.length, 0);
            return (
              <article key={m.id} className="rounded-2xl overflow-hidden border transition-all flex flex-col" style={{ background:P.s1, borderColor: active ? P.c3 : done ? P.g3 : P.border, boxShadow: active ? `0 0 0 2px ${P.c3}` : SHADOW.card }}>
                <div className="relative">
                  <MissionArt worldId={w.id} from={w.from} index={mi} height={150}/>
                  {active && rs ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold" style={{ background:P.c3, color:"#05202A" }}><Play size={12} aria-hidden="true"/> En curso · Etapa {rs.n} de {rs.total}</div>
                  ) : done ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-white" style={{ background:"rgba(4,120,87,.95)" }}><CheckCircle size={12} aria-hidden="true"/> Completada · {done.score}/100</div>
                  ) : null}
                  <div className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-black" style={{ background:"rgba(10,18,48,.88)", color:P.a4 }}>+{m.xp} XP</div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-bold mb-1" style={{ color:P.text }}>{m.title}</h2>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color:P.muted }}>{m.desc}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs" style={{ color:P.muted }}>
                    <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true"/>{m.dur}</span><DiffBadge level={m.diff}/><span>{stages} etapas</span>
                    <span>{decisionCount} decisiones</span>
                  </div>
                  <p className="inline-flex items-center gap-1.5 mb-3 text-xs font-semibold" style={{ color:"#FDE58A" }}>
                    <Hand size={13} aria-hidden="true"/>LSP visible · video pendiente
                  </p>
                  <div className="mt-auto space-y-2">
                    {active ? (
                      <>
                        <button type="button" onClick={continueMission} className={`${btnPrimary} w-full`} style={primaryStyle}>Continuar misión</button>
                        <button type="button" onClick={()=>startMission(w,m)} className={`${btnGhost} w-full`} style={ghostStyle}><RotateCcw size={14} aria-hidden="true"/>Empezar de nuevo</button>
                      </>
                    ) : done ? (
                      <button type="button" onClick={()=>startMission(w,m)} className={`${btnGhost} w-full`} style={ghostStyle}><RotateCcw size={14} aria-hidden="true"/>Repetir misión</button>
                    ) : (
                      <button type="button" onClick={()=>startMission(w,m)} className={`${btnPrimary} w-full`} style={primaryStyle}><Play size={14} aria-hidden="true"/>Iniciar misión</button>
                    )}
                    {run && !active && <p className="text-xs" style={{ color:P.muted }}>Iniciarla reemplaza tu misión en curso ({runMission?.title}).</p>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SIMULATION ────────────────────────────────────────────────────────────
  function SimScreen() {
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
            {!immersive && <BackArrow onClick={()=>setAppScreen("skill")} label="Salir de la misión (tu avance se conserva)"/>}
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

  // ── RESULTS ───────────────────────────────────────────────────────────────
  function ResultsScreen() {
    const r = lastReward;
    if (!r) return (
      <div className="text-center py-16">
        <h1 ref={resultsHeadingRef} tabIndex={-1} className="text-xl font-bold mb-4" style={{ color:P.text }}>No hay resultados recientes</h1>
        <button type="button" onClick={()=>setAppScreen("map")} className={btnPrimary} style={primaryStyle}>Ir al mapa</button>
      </div>
    );
    const li = getLevelInfo(r.newXP);
    const world = WORLDS.find(w=>w.id===r.worldId);
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="relative inline-flex items-center justify-center mb-4 lx-celebrate" aria-hidden="true">
          <span className="absolute rounded-full" style={{ width:170, height:170, background:"radial-gradient(circle,rgba(245,197,66,.45),transparent 65%)" }}/>
          <span className="relative" style={{ filter:"drop-shadow(0 0 24px rgba(245,197,66,.55))" }}><Medal icon={r.leveledUp?"trophy":"star"} size={104}/></span>
        </div>
        <h1 ref={resultsHeadingRef} tabIndex={-1} className="text-3xl font-black mb-1" style={{ color:P.text }}>¡Misión completada!</h1>
        <p className="mb-4" style={{ color:P.muted }}>{r.missionTitle} · Puntuación {r.score}/100</p>
        {r.practice && <p className="inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 mb-5 border" style={{ color:P.c4, borderColor:"rgba(56,189,248,.45)", background:"rgba(14,165,233,.08)" }}><FlaskConical size={13} aria-hidden="true"/>Vista de práctica: esta recompensa solo existe en la sesión de práctica</p>}
        <p role="status" className="sr-only">Ganaste {r.xp} XP y {r.coins} monedas. {r.leveledUp?`Subiste al nivel ${r.newLevel}.`:`Sigues en el nivel ${r.newLevel}; faltan ${li.xpToNext} XP para el siguiente.`}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5" data-testid="results-reward">
          {[{ icon:<Zap size={26} aria-hidden="true"/>, val:`+${r.xp}`, lbl:"XP ganados", sub:`${r.baseXP} de la misión${r.bonusXP?` + ${r.bonusXP} de bonus`:""}`, color:P.a4, bg:"rgba(245,197,66,.10)", border:"rgba(245,197,66,.45)" },
            { icon:<Coins size={26} aria-hidden="true"/>, val:`+${r.coins}`, lbl:"Monedas", sub:`Total: ${r.coinsTotal}`, color:"#FDE68A", bg:"rgba(245,158,11,.12)", border:"rgba(252,211,77,.35)" },
            { icon:r.leveledUp?<Trophy size={26} aria-hidden="true"/>:<Award size={26} aria-hidden="true"/>, val:`Nivel ${r.newLevel}`, lbl:r.leveledUp?"¡Subiste de nivel!":"Nivel actual", sub:r.leveledUp?`Antes: nivel ${r.prevLevel}`:`Faltan ${li.xpToNext} XP para el nivel ${li.level+1}`, color:P.v4, bg:"rgba(139,114,255,.12)", border:"rgba(187,170,255,.4)" }].map(t=>(
            <div key={t.lbl} className="rounded-2xl p-5 border" style={{ background:t.bg, borderColor:t.border }}>
              <div className="mb-2 flex justify-center" style={{ color:t.color }}>{t.icon}</div>
              <div className="font-black text-2xl" style={{ color:t.color }}>{t.val}</div>
              <div className="text-sm mt-1 font-semibold" style={{ color:P.text }}>{t.lbl}</div>
              <div className="text-xs mt-0.5" style={{ color:P.muted }}>{t.sub}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border mb-5 text-left" style={{ background:P.s1, borderColor:P.border }}><XPBar xp={r.newXP} size="lg"/></div>
        <div className="rounded-2xl p-5 mb-5 text-left border" style={{ background:"linear-gradient(135deg,#151C52,#111C42)", borderColor:"rgba(187,170,255,.35)" }}>
          <div className="flex gap-3 items-start mb-3">
            <OrionFace size={52}/>
            <p className="text-sm leading-relaxed flex-1" style={{ color:"rgba(240,246,255,.92)" }}>
              <strong>{r.outcome.head}.</strong> {r.negatives>0?`Reconsideraste ${r.negatives} ${r.negatives===1?"decisión":"decisiones"} y seguiste adelante: volver a intentarlo también es aprender.`:"Tomaste buenas decisiones en cada etapa."} {r.hintsUsed>0?`Usaste ${r.hintsUsed} ${r.hintsUsed===1?"pista":"pistas"}.`:""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border" style={{ background:"rgba(16,185,129,.08)",borderColor:"rgba(52,211,153,.3)" }}>
              <p className="text-xs font-bold mb-1" style={{ color:P.g4 }}>Fortaleza</p>
              <p className="text-xs" style={{ color:"rgba(240,246,255,.85)" }}>{r.outcome.strength}</p>
            </div>
            <div className="rounded-xl p-3 border" style={{ background:"rgba(245,158,11,.08)",borderColor:"rgba(252,211,77,.3)" }}>
              <p className="text-xs font-bold mb-1" style={{ color:"#FDE68A" }}>A mejorar</p>
              <p className="text-xs" style={{ color:"rgba(240,246,255,.85)" }}>{r.outcome.improve}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button type="button" onClick={()=>setAppScreen("map")} className={btnGhost} style={ghostStyle}>Ver mapa</button>
          <button type="button" onClick={()=>{ if(world) setSelectedWorld(world); setAppScreen("skill"); }} className={btnPrimary} style={primaryStyle}>Otra misión de {world?.name ?? "este mundo"}</button>
        </div>
      </div>
    );
  }

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  function DashScreen() {
    const sessionDone = Object.keys(doneMap).length;
    return (
      <div>
        <h1 className="text-2xl font-black mb-0.5" style={{ color:P.text }}>Mi progreso</h1>
        <p className="mb-6" style={{ color:P.muted }}>Tu nivel, tus recompensas y tus insignias</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="sm:col-span-2 rounded-2xl p-5 border flex items-center gap-5" style={{ background:P.s1, borderColor:"rgba(245,197,66,.35)" }}>
            <Medal icon="trophy" size={64}/>
            <div className="flex-1">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-bold" style={{ color:P.text }}>Nivel {meLevel.level}</h2>
              <span className="text-sm" style={{ color:P.muted }}>{animXP.toLocaleString()} XP en total</span>
            </div>
            <XPBar xp={me.xp} size="lg"/>
            </div>
          </div>
          <div className="rounded-2xl p-5 border space-y-2.5" style={{ background:P.s1, borderColor:P.border }}>
            <p className="text-sm flex items-center gap-2" style={{ color:P.text }}><Coins size={16} style={{ color:P.a3 }} aria-hidden="true"/><strong>{me.coins}</strong> monedas</p>
            <p className="text-sm flex items-center gap-2" style={{ color:P.text }}><Flame size={16} style={{ color:"#FDBA74" }} aria-hidden="true"/><strong>{me.streak}</strong> días de racha</p>
            <p className="text-sm flex items-center gap-2" style={{ color:P.text }}><Target size={16} style={{ color:P.c4 }} aria-hidden="true"/><strong>{sessionDone}</strong> {sessionDone===1?"misión completada":"misiones completadas"} hoy</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 border mb-6" style={{ background:P.s1, borderColor:P.border }}>
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color:P.text }}>Insignias <DemoChip/></h2>
          <ul className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map(b=>(
              <li key={b.name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border" style={{ background:P.s2, borderColor:P.border }}>
                <Medal icon={b.icon} size={44}/>
                <span className="text-xs text-center leading-tight" style={{ color:P.muted }}>{b.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 mb-3"><h2 className="font-bold text-sm" style={{ color:P.text }}>Estadísticas de la semana</h2><DemoChip/></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatPill icon={<Target size={22} aria-hidden="true"/>} val="14"   label="Misiones totales" color={P.v4}/>
          <StatPill icon={<Clock size={22} aria-hidden="true"/>} val="3.2h" label="Práctica"         color={P.c4}/>
          <StatPill icon={<Trophy size={22} aria-hidden="true"/>} val="#8"   label="Ranking"          color={P.a3}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:P.text }}>Radar de habilidades <DemoChip/></h3>
            <RadarSVG data={RADAR_DATA} color={P.v3} size={250}/>
          </div>
          <div className="rounded-2xl p-5 border" style={{ background:P.s1, borderColor:P.border }}>
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:P.text }}>Actividad semanal <DemoChip/></h3>
            <div className="flex items-end gap-2 h-44">
              {[3,5,2,7,4,6,1].map((v,i)=>(
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg" style={{ height:`${(v/7)*140}px`, background:i===5?g(P.v2,P.v3,"180deg"):"rgba(255,255,255,0.12)" }} title={`${v} misiones`}/>
                  <span className="text-xs" style={{ color:P.muted }}>{"LMXJVSD"[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 border flex flex-wrap items-center gap-4" style={{ background:"linear-gradient(135deg,#0A1220,#101E3A)", borderColor:"rgba(109,40,217,.25)" }}>
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <OrionFace size={40}/>
            <div><h2 className="font-bold text-sm" style={{ color:P.text }}>¿Quieres conversar con Orion?</h2><p className="text-xs" style={{ color:P.muted }}>Habla o escribe sobre habilidades para la vida. No necesitas estar en una misión.</p></div>
          </div>
          <button type="button" onClick={()=>setAppScreen("orion")} className="min-h-11 px-4 rounded-xl font-bold text-sm text-white inline-flex items-center gap-2" style={{ background:g(P.v2,P.v1), boxShadow:SHADOW.action }}>
            <MessageCircle size={16} aria-hidden="true"/>Conversar con Orion
          </button>
        </div>
      </div>
    );
  }

  // ── AVATAR ────────────────────────────────────────────────────────────────
  function AvatarScreen() {
    const swatch = (selected:boolean) => selected ? <Check size={18} className="text-white" style={{ filter:"drop-shadow(0 0 2px rgba(0,0,0,.9))" }} aria-hidden="true"/> : null;
    return (
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color:P.text }}>Mi avatar</h1>
        <p className="mb-6" style={{ color:P.muted }}>Personaliza tu personaje</p>
        {isPractice && <p className="text-sm rounded-xl px-4 py-3 mb-6 border" style={{ color:"#D3E9F8", borderColor:"rgba(56,189,248,.45)", background:"rgba(14,165,233,.08)" }}>Vista de práctica: los cambios de avatar solo se aplican a la cuenta de práctica y se descartan al volver al panel docente.</p>}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="rounded-2xl p-6 border text-center mb-4" style={{ background:P.s1, borderColor:P.border }}>
              <div className="relative w-32 h-40 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full" style={{ background:"radial-gradient(circle,rgba(109,40,217,.2) 0%,transparent 70%)" }}/>
                <CharSVG hair={avatar.hair} hairStyle={avatar.hairStyle} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={140}/>
                {me.pet&&me.pet!=="⛔"&&<div className="absolute bottom-0 right-0 text-2xl" aria-hidden="true">{me.pet}</div>}
              </div>
              <p className="font-bold" style={{ color:P.text }}>{me.name} {me.last}</p>
              <p className="text-xs mt-0.5" style={{ color:P.muted }}>Nivel {meLevel.level} · {me.xp.toLocaleString()} XP</p>
            </div>
          </div>

          <div className="col-span-2 space-y-5">
            <div className="flex gap-2" role="group" aria-label="Qué personalizar">
              {(["char","pet"] as const).map(t=>(
                <button key={t} type="button" aria-pressed={avTab===t} onClick={()=>setAvTab(t)} className="min-h-11 px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={avTab===t?{ background:g(P.v2,P.v3),color:"#fff" }:{ background:P.s1,color:P.text,border:`1px solid ${P.border}` }}>
                  {t==="char"?"🧍 Personaje":"🐾 Mascota"}
                </button>
              ))}
            </div>

            {avTab==="char"&&(
              <>
                <fieldset>
                  <legend className="text-xs font-bold mb-2" style={{ color:P.muted }}>Tono de piel</legend>
                  <div className="flex gap-2">{SKIN_TONES.map((s,i)=><button key={s} type="button" aria-label={`Tono de piel ${i+1}`} aria-pressed={avatar.skin===s} onClick={()=>updateActiveProfile({ skinTone:s })} className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background:s,borderColor:avatar.skin===s?"#fff":"transparent" }}>{swatch(avatar.skin===s)}</button>)}</div>
                </fieldset>
                <fieldset>
                  <legend className="text-xs font-bold mb-2" style={{ color:P.muted }}>Color de cabello</legend>
                  <div className="flex gap-2 flex-wrap">{HAIR_COLORS.map((h,i)=><button key={h} type="button" aria-label={`Color de cabello ${i+1}`} aria-pressed={avatar.hair===h} onClick={()=>updateActiveProfile({ hairColor:h })} className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background:h==="#F5F5F5"?"#c8c8c8":h,borderColor:avatar.hair===h?"#fff":"transparent" }}>{swatch(avatar.hair===h)}</button>)}</div>
                </fieldset>
                <fieldset>
                  <legend className="text-xs font-bold mb-2" style={{ color:P.muted }}>Estilo de cabello</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {HAIR_STYLES.map((s,i)=>(
                      <button key={s} type="button" aria-label={`Estilo de cabello ${i+1}`} aria-pressed={avatar.hairStyle===s} onClick={()=>updateActiveProfile({ hairStyle:s })} className="relative rounded-xl p-2 border transition-all hover:scale-105 flex justify-center" style={{ background:avatar.hairStyle===s?g(P.v2,P.v3):P.s2,borderColor:avatar.hairStyle===s?"#fff":P.border }}>
                        <CharSVG hair={avatar.hair} hairStyle={s} skin={avatar.skin} shirt={avatar.shirt} mood="happy" size={55}/>
                        {avatarSelectedBadge(avatar.hairStyle===s)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-xs font-bold mb-2" style={{ color:P.muted }}>Color de ropa</legend>
                  <div className="flex gap-2 flex-wrap">{SHIRT_COLORS.map((c,i)=><button key={c} type="button" aria-label={`Color de ropa ${i+1}`} aria-pressed={avatar.shirt===c} onClick={()=>updateActiveProfile({ shirtColor:c })} className="w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110" style={{ background:c,borderColor:avatar.shirt===c?"#fff":"transparent" }}>{swatch(avatar.shirt===c)}</button>)}</div>
                </fieldset>
              </>
            )}

            {avTab==="pet"&&(
              <div className="grid grid-cols-6 gap-3" role="group" aria-label="Mascota">
                {PETS.map(p=>(
                  <button key={p} type="button" aria-label={p==="⛔"?"Sin mascota":`Mascota ${p}`} aria-pressed={me.pet===p} onClick={()=>updateActiveProfile({ pet:p })} className="relative h-14 rounded-xl flex items-center justify-center text-2xl border transition-all hover:scale-110" style={{ background:me.pet===p?g(P.v2,P.v1):P.s2,borderColor:me.pet===p?"#fff":P.border }}>
                    {p==="⛔"?<span className="text-xs" style={{ color:P.text }}>Sin</span>:p}
                    {avatarSelectedBadge(me.pet===p)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

/** Decorative photos: if one fails to load, hide it and let the gradient show. */
function hideBrokenImage(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.visibility = "hidden"; }

function avatarSelectedBadge(selected: boolean) {
  if (!selected) return null;
  return <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:"#fff" }} aria-hidden="true"><Check size={12} style={{ color:"#4C1D95" }}/></span>;
}

function StageSteps({ n, total, label }:{ n:number; total:number; label:string }) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold" style={{ color:P.text }}>Etapa {n} de {total} · {label}</p>
      <div className="flex gap-1.5 mt-2" aria-hidden="true">
        {Array.from({ length: total }).map((_,i)=>(
          <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i<n-1 ? P.g3 : i===n-1 ? P.v3 : "rgba(255,255,255,.14)" }}/>
        ))}
      </div>
    </div>
  );
}

/** Orion's avatar. `pulse` changes replay a short, one-time reaction (disabled with reduced motion). */
function OrionFace({ pulse, size=36 }:{ pulse?:number; size?:number }) {
  return (
    <span key={pulse} className={`inline-flex items-end justify-center rounded-2xl overflow-hidden flex-shrink-0 ${pulse?"orion-pop":""}`} aria-hidden="true"
      style={{ width:size, height:size, background:"linear-gradient(160deg,#2E2A7A,#17205A)", border:"1px solid rgba(187,170,255,.5)" }}>
      <OrionFigure variant="bust" size={size}/>
    </span>
  );
}

// ─── Layout atoms ──────────────────────────────────────────────────────────────
const CSS = `
  .lx-welcome{background:radial-gradient(ellipse at 8% 82%,#32166A 0,transparent 36%),radial-gradient(ellipse at 100% 4%,#3E2096 0,transparent 36%),radial-gradient(ellipse at 75% 105%,#103D81 0,transparent 47%),#090F30}
  .lx-welcome-panel{background:linear-gradient(145deg,rgba(29,33,85,.92),rgba(12,17,50,.96));border:1px solid rgba(177,165,255,.38);box-shadow:0 18px 58px rgba(4,7,29,.62)}
  .lx-welcome-accent{color:#F28DF1;background:linear-gradient(100deg,#BBA2FF,#FA91E9);background-clip:text;-webkit-text-fill-color:transparent}
  .lx-neon-action{background:linear-gradient(100deg,#5530D1,#8732E7 60%,#AB258F);border:1px solid #D5B4FF;box-shadow:0 6px 22px rgba(157,60,248,.39),inset 0 1px 1px rgba(255,255,255,.32)}
  .lx-neon-action:hover{filter:brightness(1.12)}
  @keyframes cffall      {0%{transform:translateY(-60px) rotate(0deg);opacity:1}80%{opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}
  @keyframes bounce-icon {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes lvup        {0%{opacity:0;transform:scale(.5)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
  @keyframes particleup  {0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-180px) scale(0.5);opacity:0}}
  @keyframes fadeSlideIn {from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes lxStageIn   {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes lxFade      {from{opacity:0}to{opacity:1}}
  @keyframes orionPop    {0%{transform:scale(1);box-shadow:0 0 0 0 rgba(167,139,250,0)}40%{transform:scale(1.14);box-shadow:0 0 0 6px rgba(167,139,250,.35)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(167,139,250,0)}}
  .lx-stage-in{animation:lxStageIn .22s ease-out both}
  .lx-fade{animation:lxFade .18s ease-out both}
  .orion-pop{animation:orionPop .6s ease-out 1}
  @keyframes lxReact     {0%{opacity:.35;transform:translateY(6px)}100%{opacity:1;transform:none}}
  .lx-react{animation:lxReact .35s ease-out both}
  .lx-celebrate{animation:bounce-icon .7s ease-in-out 2}
  .lx-choice:hover,.lx-choice:focus-visible{border-color:rgba(167,139,250,.8)!important;background:rgba(109,40,217,.16)!important}
  :where(button,a,input,select,textarea,summary,[tabindex]):focus-visible{outline:3px solid #C4B5FD!important;outline-offset:2px!important}
  :where(h1,h2,h3)[tabindex="-1"]:focus{outline:none!important}
  button:disabled{cursor:not-allowed;opacity:.6}
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  }
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.35);border-radius:4px}
  input::placeholder,textarea::placeholder{color:rgba(147,168,198,0.85)}
  input,select,button{font-family:'Poppins',sans-serif}
  select option{background:#152035}
`;

function Stars() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0 }}>
      {STARS.map((s,i)=><div key={i} className="absolute rounded-full bg-white animate-pulse" style={{ top:s.top,left:s.left,width:`${s.sz}px`,height:`${s.sz}px`,opacity:s.op,animationDelay:s.d,animationDuration:s.dur }}/>)}
      <div className="absolute" style={{ top:"-10%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle,rgba(109,40,217,0.09) 0%,transparent 65%)" }}/>
      <div className="absolute" style={{ bottom:"0",right:"-5%",width:"50%",height:"50%",background:"radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 65%)" }}/>
    </div>
  );
}

// ─── Custom Radar Chart (pure SVG — no recharts key collisions) ────────────────
function RadarSVG({ data, color, size=240 }: { data:{skill:string;value:number}[]; color:string; size?:number }) {
  const N   = data.length;
  const CX  = size / 2;
  const CY  = size / 2 - 10;
  const R   = size * 0.33;
  const LR  = R + 28;
  const step = (2 * Math.PI) / N;

  const pt = (i:number, r:number) => {
    const a = i * step - Math.PI / 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };

  const polygon = (r:number) => data.map((_,i) => { const p=pt(i,r); return `${p.x},${p.y}`; }).join(' ');

  const dataPts = data.map((d,i)=>pt(i,(d.value/100)*R));
  const dataStr = dataPts.map(p=>`${p.x},${p.y}`).join(' ');

  const anchor = (x:number, cx:number) => x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ overflow:"visible", maxWidth:size*1.35, display:"block", margin:"0 auto" }}>
      {/* Grid rings */}
      {[20,40,60,80,100].map(lvl=>(
        <polygon key={`ring-${lvl}`} points={polygon((lvl/100)*R)}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      ))}
      {/* Spokes */}
      {data.map((_,i)=>{ const p=pt(i,R); return (
        <line key={`spoke-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      );})}
      {/* Data fill */}
      <polygon points={dataStr} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2}/>
      {/* Data dots */}
      {dataPts.map((p,i)=>(
        <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill={color} strokeWidth={1.5}
          stroke="rgba(0,0,0,0.3)"/>
      ))}
      {/* Labels */}
      {data.map((d,i)=>{ const p=pt(i,LR); return (
        <text key={`lbl-${i}`} x={p.x} y={p.y+3}
          textAnchor={anchor(p.x,CX)} fontSize="10.5" fill="rgba(124,143,172,0.9)"
          fontFamily="Poppins,sans-serif" fontWeight="600">
          {d.skill}
        </text>
      );})}
    </svg>
  );
}

// ─── CaseCard ─────────────────────────────────────────────────────────────────
function CaseCard({ c, onRemove }:{ c:GenCase; onRemove:()=>void }) {
  const [exp, setExp] = useState(false);
  const world = [{ id:"com",from:"#7C3AED" },{ id:"fin",from:"#D97706" },{ id:"tea",from:"#059669" },{ id:"pen",from:"#2563EB" },{ id:"dig",from:"#0891B2" },{ id:"lid",from:"#CA8A04" },{ id:"emo",from:"#BE185D" },{ id:"cre",from:"#DB2777" },{ id:"inn",from:"#4F46E5" },{ id:"emp",from:"#16A34A" },{ id:"tie",from:"#EA580C" },{ id:"pro",from:"#9333EA" }].find(w=>w.id===c.worldId);
  const bg=world?.from??"#7C3AED";
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background:"#131D31", borderColor:"rgba(85,120,175,0.16)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl flex-shrink-0">{c.worldEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug" style={{ color:"#F0F6FF" }}>{c.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full border" style={{ color:"#F0F6FF", borderColor:`${bg}66` }}>{c.worldName}</span>
              <span className="text-xs" style={{ color:c.difficulty==="Básico"?"#10B981":c.difficulty==="Intermedio"?"#F59E0B":"#EF4444" }}>{c.difficulty}</span>
              <span className="text-xs" style={{ color:"#7C8FAC" }}>⏱ {c.duration}</span>
              <span className="text-xs font-bold" style={{ color:"#A78BFA" }}>⚡ {c.xp} XP</span>
            </div>
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color:"rgba(240,246,255,.6)", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{c.objective}</p>
        <div className="flex gap-2">
          <button onClick={()=>setExp(p=>!p)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all" style={{ color:"#7C8FAC", borderColor:"rgba(85,120,175,0.16)" }}>{exp?"Ver menos ▲":"Ver completo ▼"}</button>
          <button onClick={onRemove} className="px-3 py-1.5 rounded-lg text-xs border transition-all" style={{ color:"#EF4444", borderColor:"rgba(239,68,68,.2)" }}>✕</button>
        </div>
      </div>
      {exp&&(
        <div className="px-4 pb-4 pt-1 border-t space-y-3" style={{ borderColor:"rgba(85,120,175,0.1)" }}>
          <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color:"#38BDF8" }}>📖 Escenario</p><p className="text-xs leading-relaxed" style={{ color:"rgba(240,246,255,.75)" }}>{c.scenario}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"#F59E0B" }}>💬 Preguntas de reflexión</p>
            {c.questions.map((q,i)=><p key={i} className="text-xs mb-1 leading-relaxed" style={{ color:"rgba(240,246,255,.7)" }}><span className="font-black" style={{ color:"#F59E0B" }}>{i+1}. </span>{q}</p>)}
          </div>
          <div className="rounded-lg p-3 border" style={{ background:"rgba(16,185,129,.06)",borderColor:"rgba(16,185,129,.2)" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color:"#10B981" }}>✅ Evaluación</p>
            <p className="text-xs" style={{ color:"rgba(240,246,255,.7)" }}>{c.evaluation}</p>
          </div>
          {c.tips&&<div className="rounded-lg p-3 border" style={{ background:"rgba(14,165,233,.06)",borderColor:"rgba(14,165,233,.2)" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color:"#0EA5E9" }}>💡 Tips docente</p>
            <p className="text-xs" style={{ color:"rgba(240,246,255,.7)" }}>{c.tips}</p>
          </div>}
        </div>
      )}
    </div>
  );
}

function Shell({ children }:{ children:React.ReactNode }) {
  return (
    <div className="bg-background text-foreground" style={{ fontFamily:"'Poppins',sans-serif",minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Stars/>
      <div className="relative" style={{ zIndex:1 }}>{children}</div>
    </div>
  );
}

function AuthWrap({ title, sub, onBack, children, wide=false }:{ title:string; sub:string; onBack:()=>void; children:React.ReactNode; wide?:boolean }) {
  return (
    <div className="min-h-screen flex flex-col px-4 py-8" style={{ background:P.bg }}>
      <div className="max-w-5xl w-full mx-auto mb-8"><LXLogo size={36}/></div>
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-full ${wide?"max-w-2xl":"max-w-md"}`}>
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={onBack} aria-label="Volver" className="w-11 h-11 rounded-xl flex items-center justify-center border hover:bg-white/5 transition-colors" style={{ background:P.s1,borderColor:P.border,color:P.text }}><ArrowLeft size={18}/></button>
            <div><h1 className="text-2xl font-black" style={{ color:P.text }}>{title}</h1><p className="text-sm" style={{ color:P.muted }}>{sub}</p></div>
          </div>
          <div className="rounded-3xl p-6 sm:p-8 border" style={{ background:P.s1,borderColor:P.border,boxShadow:SHADOW.card }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
