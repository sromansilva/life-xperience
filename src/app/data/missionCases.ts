import type { SpeakerId } from "../art/characters";
import type { MissionScene, MissionScript, SceneChoice } from "./comMission";

export type Setting = "studio" | "auditorium" | "office" | "desk" | "market" | "workshop" | "hall" | "outdoor" | "stage" | "library" | "digital";

type Step = readonly [
  title: string, challenge: string, choice: string, reaction: string,
  mistake: string, consequence: string, hint: string,
  alternate?: readonly [choice: string, reaction: string, nextFact?: string],
];

interface MissionCase {
  place: string;
  setting: Setting;
  props: readonly [string, string, string];
  context: string;
  openingLine: string;
  speaker: SpeakerId;
  steps: readonly Step[];
}

export const MISSION_CASES: Readonly<Record<string, MissionCase>> = {

  "com-2": {
    openingLine: "¡Ya prendí el micro! Quienes nos escuchan todavía no conocen el huerto.",
    place: "Cabina de la radio escolar", setting: "studio", props: ["🎙️", "🎧", "⏺️"],
    context: "Vas a grabar un podcast: un audio corto que otros pueden escuchar. Tu tema es el huerto del colegio.",
    speaker: "lucas",
    steps: [["Empieza tu podcast", "¿Con qué frase empezarías tu podcast?", "«Hola, hoy te contamos cómo sembramos lechugas en el huerto del colegio».", "Tus compañeros saben de qué hablarás y quieren escuchar cómo sembraron.", "«Hola... eh... tenemos tierra y una pala. Bueno, eso era todo».", "Tus compañeros oyeron una lista de cosas, pero no entendieron de qué trataba el audio.", "La primera frase puede decirle a quien escucha de qué trata el audio."]],
  },
  "com-3": {
    openingLine: "Yo quiero que el consejo escuche razones que podamos comprobar.",
    place: "Auditorio del debate escolar", setting: "auditorium", props: ["🎤", "📑", "📱"],
    context: "El consejo escolar debatirá si limitar el celular en clase. La decisión afectará a estudiantes y docentes.",
    speaker: "daniela",
    steps: [
      ["Comparar fuentes", "Una encuesta no dice a cuántas personas preguntaron, pero afirma que todos se distraen. Un informe del aula registra en qué momentos usaron el celular. ¿Qué evidencia llevarías?", "Usa el informe y explica qué aula y qué periodo cubre.", "El jurado puede verificar qué muestra el informe y qué falta saber.", "Cita la encuesta viral como si describiera a todo el colegio.", "El jurado pregunta cuántas personas respondieron y tu argumento pierde respaldo.", "Busca una fuente que permita saber a quién se observó y cuándo.", ["Contrasta ambas fuentes y señala qué datos faltan en la encuesta.", "El jurado te pide explicar qué evidencia todavía falta.", "En tu lista quedó una pregunta: ¿para qué usan el celular quienes necesitan ayuda para leer?"]],
      ["Responder a la objeción", "Un compañero usa el celular para leer con texto ampliado. ¿Cómo responderías sin ignorar su experiencia?", "Reconoce ese uso y distingue entre apoyo de accesibilidad y distracciones.", "El debate pasa de prohibir un objeto a regular usos concretos.", "Dile que su caso es demasiado raro para tomarlo en cuenta.", "La regla propuesta dejaría a algunos estudiantes sin una herramienta para leer.", "Una objeción válida puede revelar a quién dejaría fuera tu propuesta."],
      ["Cambiar ante evidencia nueva", "Otro salón mostró buenos resultados con usos guiados, pero solo durante una semana. ¿Qué recomendarías ahora?", "Propón un piloto con excepciones y criterios de evaluación antes de adoptar la regla.", "El consejo puede probar una medida revisable y comparar sus efectos.", "Promete que el mismo resultado se repetirá en todas las clases.", "El consejo descubre que la prueba fue corta y no puede confiar en esa predicción.", "Distingue lo que ya sabes de lo que tendría que comprobarse."],
    ],
  },
  "com-4": {
    openingLine: "En mi grupo podemos cambiar la hora, pero necesitamos el salón un buen rato.",
    place: "Sala de reservas del colegio", setting: "office", props: ["📅", "🔑", "🤝"],
    context: "Teatro y robótica necesitan el único salón libre el jueves. Los dos equipos tienen una presentación próxima.",
    speaker: "sofia",
    steps: [
      ["Escuchar necesidades", "Teatro necesita espacio para ensayar. Robótica necesita los enchufes para ajustar su robot. ¿Cómo iniciarías la conversación?", "Pide a cada grupo su horario y qué parte del espacio necesita.", "Descubres que pueden trabajar en turnos de distinta duración.", "Dale el salón completo al equipo que pidió primero.", "El otro equipo se queda sin recursos y deja de buscar un acuerdo.", "Antes de repartir horarios, averigua qué necesita cada equipo.", ["Dibuja un horario y deja que cada equipo marque sus tiempos flexibles.", "Ambos equipos dejan por escrito cuándo pueden ceder el espacio.", "El horario sigue sobre la mesa. Teatro marcó en verde las horas en las que podría usar el patio."]],
      ["Cerrar el acuerdo", "Robótica puede empezar tarde, pero necesita 40 minutos seguidos. Teatro puede usar el patio al terminar. ¿Qué acuerdas?", "Reserva primero el salón para teatro y un bloque continuo después para robótica. Confirma ambas horas con los equipos.", "Ambos equipos aceptan el horario y saben cuándo entregar la llave.", "Divide el tiempo en turnos de diez minutos para que parezca justo.", "Robótica no logra ajustar el robot y el ensayo de teatro se interrumpe varias veces.", "Repartir el mismo tiempo no siempre satisface necesidades diferentes."],
    ],
  },
  "fin-1": {
    openingLine: "Anoté los gastos. Si guardas dinero ahora, no tendrás que buscarlo después.",
    place: "Mesa de presupuesto en casa", setting: "desk", props: ["🪙", "🧮", "🚌"],
    context: "Tienes 20 soles. Necesitas 8 soles para el pasaje y 7 soles para un cuaderno.",
    speaker: "daniela",
    steps: [["Separa lo necesario", "¿Cuánto te queda para una salida después de pagar ambos gastos?", "Guarda 15 soles para el pasaje y el cuaderno. Te quedan 5 soles.", "Puedes pagar los dos gastos y aún tienes 5 soles para la salida.", "Usa 10 soles en la salida y guarda 10 soles para los gastos.", "El pasaje y el cuaderno cuestan 15 soles. Te faltan 5 soles para pagarlos.", "Suma el pasaje y el cuaderno antes de decidir cuánto gastar."]],
  },
  "fin-2": {
    openingLine: "En esta feria usamos dinero de juego. Podemos comparar qué pasa si sube o baja.",
    place: "Feria de simulación financiera", setting: "market", props: ["📈", "🪙", "⚖️"],
    context: "Tienes 200 soles ficticios. 60 soles son para una compra próxima y el resto se puede usar en una simulación de inversión.",
    speaker: "garcia",
    steps: [
      ["Fijar el límite", "Una inversión simulada puede caer justo cuando necesitas comprar los materiales. ¿Cuánto pondrías en riesgo?", "Aparta los 60 soles y decide qué parte del resto podrías perder.", "Puedes comprar los materiales aunque la simulación salga mal.", "Invierte los 200 soles porque la gráfica del último mes subió.", "Una caída te obliga a retirar con pérdida para pagar los materiales.", "Separa el dinero que necesitarás pronto del que puedes arriesgar.", ["Aparta los 60 soles y deja parte del resto como reserva adicional.", "Tienes más margen para una caída, con menos dinero participando en el ejercicio."]],
      ["Comparar riesgos", "Una opción depende de una sola empresa. Otra reparte el dinero entre varias y cobra por usar el servicio. ¿Qué comparas?", "Compara pérdidas posibles, costo por usar el servicio y si cada opción pone el dinero en una empresa o en varias.", "La elección considera el riesgo y el costo, además del rendimiento.", "Elige solo por lo que subió ayer.", "La decisión depende de un solo día y se olvida del costo del servicio.", "Pregunta qué podría pasar si cae una empresa o si todas caen juntas."],
      ["Revisar la estrategia", "El mercado simulado cae. Aún tienes la reserva y el objetivo no cambió. ¿Qué haces antes de mover dinero?", "Revisa si cambió el riesgo y decide según el límite que fijaste.", "Puedes explicar la decisión con tu plan inicial y los datos nuevos.", "Duplica la inversión para recuperar la pérdida de inmediato.", "Ahora puedes perder más de lo que habías decidido tolerar.", "La pérdida pasada no aumenta el dinero que puedes poner en riesgo."],
    ],
  },
  "fin-3": {
    openingLine: "Podemos ir marcando en el calendario cuánto ahorras cada semana.",
    place: "Calendario de ahorro", setting: "desk", props: ["🐷", "🗓️", "🎒"],
    context: "La mochila cuesta 48 soles. Tienes seis semanas para juntar el dinero y puedes guardar hasta 10 soles por semana.",
    speaker: "lucas",
    steps: [["Ahorra para la mochila", "¿Qué cantidad guardarías cada semana para llegar a tu meta?", "Guarda 8 soles por semana.", "Después de seis semanas tendrás los 48 soles que necesitas.", "Guarda 6 soles por semana.", "En seis semanas tendrás 36 soles. Te faltarán 12 soles.", "Prueba multiplicar el ahorro de una semana por las seis semanas."]],
  },
  "fin-4": {
    openingLine: "Ya tenemos la receta. Falta saber cuánto cuesta preparar cada vaso.",
    place: "Puesto de la feria escolar", setting: "market", props: ["🍋", "🏷️", "🧾"],
    context: "Tu grupo venderá limonada. Los ingredientes cuestan 24 soles para 12 vasos. Hay que decidir precio y producción.",
    speaker: "sofia",
    steps: [
      ["Calcular el costo", "¿Qué deberías calcular antes de escribir el precio?", "Divide el costo total entre los vasos y deja un poco de dinero extra por si algo sale mal.", "Sabes cuánto cuesta cada vaso y qué precio cubre los ingredientes.", "Copia el precio de una tienda sin comparar tamaños ni costos.", "El precio elegido puede no cubrir tus ingredientes.", "Primero convierte un costo de todo el lote en un costo por vaso.", ["Calcula el costo por vaso y pregunta cuánto pagaría el público de la feria.", "Tienes una referencia de costo y una primera señal de demanda."]],
      ["Ajustar el lote", "El pronóstico cambió y habrá menos público. ¿Cómo evitas perder todo el excedente?", "Prepara un primera tanda pequeña y repón si se vende.", "Reduces el desperdicio y puedes preparar más si llega más gente.", "Prepara el doble del lote para compensar la menor asistencia.", "Terminas con vasos sin vender y más costos.", "Compara qué tan fácil es preparar más con qué tan difícil es recuperar sobrantes."],
    ],
  },
  "tea-1": {
    openingLine: "Yo puedo probar la base mientras alguien revisa si están todas las piezas.",
    place: "Mesa de la maqueta escolar", setting: "workshop", props: ["✂️", "📐", "🏗️"],
    context: "La maqueta se entrega mañana. Ya tienen las piezas, pero nadie se encargó de probar si la base resiste.",
    speaker: "lucas",
    steps: [
      ["Coordinar tareas", "¿Qué reparto evita que el grupo monte la maqueta sin probarla?", "Asigna prueba de base, montaje y revisión, con una hora para pasar de una tarea a otra.", "El montaje empieza con una base comprobada.", "Pide que todos monten las piezas a la vez.", "Nadie revisa la base y se vence al poner peso.", "Busca qué tarea tiene que terminar antes de que empiece otra.", ["Haz primero una prueba rápida de base en pareja y después reparte montaje y revisión.", "El grupo detecta el punto débil antes de separar las tareas."]],
      ["Reorganizar el montaje", "La prueba encontró que falta un refuerzo y hay poco cartón. ¿Cómo responde el equipo?", "Acuerden qué pieza reutilizar y avisen al equipo de montaje antes de cambiar el plano.", "Todos trabajan con la misma versión y evitan rehacer piezas.", "Cambia el plano sin avisar para ahorrar tiempo.", "Dos compañeros cortan piezas para versiones incompatibles.", "Una modificación útil también necesita llegar a quienes dependen de ella."],
    ],
  },
  "tea-2": {
    openingLine: "Encontré tres videos. Me da miedo borrar justo el que necesitamos.",
    place: "Sala de edición del noticiero", setting: "studio", props: ["🎬", "💾", "📋"],
    context: "Quien editaba el noticiero faltó. Hay tres archivos con nombres parecidos y la entrega es hoy.",
    speaker: "daniela",
    steps: [
      ["Recuperar el material", "¿Cómo identificas el archivo válido sin arriesgar el trabajo existente?", "Compara fechas y contenido en copias, y anota cuál usarán.", "El equipo conserva los originales y comparte una versión de referencia.", "Borra las dos versiones más antiguas sin abrirlas.", "El archivo que conservaste no incluye la entrevista final.", "Antes de eliminar una versión, verifica qué contiene.", ["Pide a dos compañeros que comparen por separado los archivos sin modificarlos.", "Tienes una segunda verificación antes de elegir la versión."]],
      ["Redistribuir con lo que hay", "Solo una persona conoce el editor. También falta revisar el audio. ¿Cómo divides el trabajo?", "Deja la edición a esa persona y reparte guion, audio y revisión a los demás.", "El editor recibe materiales listos y avanza sin interrupciones.", "Pide que todos aprendan el editor y trabajen sobre el mismo archivo.", "Se pisan los cambios y se pierde tiempo en tareas duplicadas.", "Distingue las tareas que requieren el editor de las que pueden hacerse en paralelo."],
      ["Entregar y comunicar límites", "Falta una toma y no llegará antes del cierre. ¿Qué versión presentan?", "Entrega un video completo sin esa toma y explica qué se omitió y por qué.", "El noticiero se entiende y el equipo comunica el límite con claridad.", "Deja un espacio en blanco en el video esperando completar después.", "La proyección se corta y el público pierde el hilo.", "Protege la comprensión del público con lo que sí tienes."],
    ],
  },
  "tea-3": {
    openingLine: "Yo puedo preguntarles a los tres qué parte prefieren hacer.",
    place: "Tablero del equipo de ciencias", setting: "workshop", props: ["🧪", "📸", "📌"],
    context: "Tu grupo hará un afiche. Lucía quiere dibujar, Diego sabe tomar fotos y Eva quiere explicar el trabajo.",
    speaker: "sofia",
    steps: [["Reparte las tareas", "¿Cómo repartirías el dibujo, las fotos y la explicación?", "Lucía dibuja, Diego toma las fotos y Eva explica el afiche.", "Las tres tareas quedan cubiertas y todos pueden participar.", "Pídele a Lucía que haga el afiche y explique todo ella sola.", "Lucía se queda con casi todo el trabajo y nadie toma las fotos.", "Relaciona cada tarea con algo que le gusta hacer a alguien del grupo."]],
  },
  "tea-4": {
    openingLine: "En la recta va bien. Mira lo que hace cuando llega a esta curva.",
    place: "Zona de preparación del torneo", setting: "workshop", props: ["🏆", "🤖", "🔋"],
    context: "El robot del equipo debe recorrer una pista. Solo quedan dos turnos de prueba antes de competir.",
    speaker: "lucas",
    steps: [
      ["Elegir qué probar", "El robot funciona recto, pero a veces se desvía en las curvas. ¿Cómo usan el primer turno?", "Prueben las curvas y asignen a alguien para registrar dónde falla.", "Identifican una curva específica que necesita ajuste.", "Repitan solo el tramo recto porque siempre sale bien.", "Llegan al segundo turno sin saber por qué se desvía el robot.", "Usa el tiempo de prueba para reducir la incertidumbre más importante.", ["Hagan una vuelta completa registrando curvas y nivel de batería.", "Descubren que el fallo aparece al girar y con batería baja."]],
      ["Decidir qué llevar a la pista", "El ajuste funciona en una prueba, pero queda poca batería. ¿Qué hacen antes de competir?", "Cambien la batería, revisen el ajuste en equipo y acuerden qué hacer si falla.", "Todos conocen el plan y el robot sale con batería suficiente.", "Guarden el robot sin revisar nada para evitar tocar el ajuste.", "La batería se agota antes de terminar la pista.", "Un ajuste correcto aún necesita las condiciones que le permiten funcionar."],
    ],
  },

  "emo-1": {
    openingLine: "Todavía no te llaman. Me quedo contigo un momento.",
    place: "Pasillo antes de la exposición", setting: "hall", props: ["🫁", "🗒️", "🚪"],
    context: "Te toca exponer. Tienes las manos tensas y te cuesta recordar cómo empieza tu parte.",
    speaker: "sofia",
    steps: [["Tómate un momento", "¿Qué harías antes de pasar al frente?", "Respira despacio y repasa solo la primera frase.", "Ya sabes con qué frase empezar y puedes dar el primer paso.", "Intenta memorizar toda la exposición otra vez en unos segundos.", "Te llenas de ideas y te cuesta recordar la primera frase.", "Piensa en algo pequeño que puedas hacer ahora mismo."]],
  },
  "emo-2": {
    openingLine: "Los dos vimos la jugada desde lados diferentes de la cancha.",
    place: "Patio al terminar el partido", setting: "outdoor", props: ["⚽", "🧃", "🗣️"],
    context: "Dos compañeros se acusan de haber hecho perder al equipo. Uno quiere que decidas quién tuvo la culpa.",
    speaker: "lucas",
    steps: [
      ["Bajar la tensión", "¿Cómo invitas a conversar sin tomar partido?", "Propón una pausa y da a cada uno un turno para contar lo que vio.", "Se escuchan dos versiones y baja el tono de la discusión.", "Escoge al culpable con la primera versión que escuchaste.", "El otro se va antes de que puedan aclarar lo ocurrido.", "Haz sitio para que ambas personas describan lo ocurrido sin etiquetas.", ["Pregunta a cada uno qué necesita para poder hablar con calma.", "Aceptan conversar sin el resto del equipo alrededor."]],
      ["Acordar el próximo paso", "Uno sintió que nadie le avisó del cambio de posición. ¿Qué acuerdo podría ayudar?", "Acuerden una señal clara y ensáyenla antes del siguiente partido.", "La conversación se convierte en una solución que ambos pueden probar.", "Exige que se den la mano y da el asunto por resuelto.", "El malentendido vuelve a aparecer en el siguiente partido.", "Un acuerdo útil cambia algo concreto para la próxima vez."],
    ],
  },
  "emo-3": {
    openingLine: "Hoy no tengo ganas de hablar mucho. ¿Te puedes sentar aquí?",
    place: "Banco del patio durante el recreo", setting: "outdoor", props: ["🪑", "💬", "🎒"],
    context: "Sofía recibió una mala noticia. Se sienta aparte y dice que hoy le cuesta concentrarse.",
    speaker: "sofia",
    steps: [
      ["Escuchar sin presionar", "¿Cómo le mostrarías que puede contar contigo?", "Reconoce que suena difícil y pregúntale si quiere compañía o espacio.", "Sofía decide quedarse acompañada sin tener que contar detalles.", "Dile que hay problemas más graves y que debe animarse.", "Sofía siente que su preocupación no importa y termina la conversación.", "Acompañar empieza por reconocer cómo se siente la otra persona.", ["Ofrece sentarte un rato a su lado y espera a que ella decida hablar.", "Sofía acepta tu compañía y se toma su tiempo."]],
      ["Preguntar antes de ayudar", "Sofía teme perder las indicaciones de clase. ¿Qué apoyo respeta su decisión?", "Ofrece compartir tus apuntes y pregúntale si quiere que la acompañes a hablar con la profesora.", "Recibe ayuda concreta y decide por sí misma cuánto contar.", "Escribe al grupo explicando lo que le pasó para que todos ayuden.", "Una situación privada se comparte sin que ella lo haya elegido.", "La ayuda funciona mejor cuando la persona puede decidir cómo recibirla."],
    ],
  },
  "emo-4": {
    openingLine: "No me esperaba esa crítica. Necesito un momento para pensar.",
    place: "Sala del concurso de ciencias", setting: "auditorium", props: ["🔬", "⏱️", "🏅"],
    context: "Tu equipo escucha una crítica pública al proyecto. Un compañero se ríe por nervios y otra quiere abandonar.",
    speaker: "daniela",
    steps: [
      ["Reconocer la reacción", "Sientes ganas de responder enseguida. ¿Cómo te das tiempo?", "Pide un momento para revisar la crítica y anota el punto concreto que debes responder.", "Ganas unos segundos y separas la crítica del tono con que se dijo.", "Responde con un ataque a quien hizo la pregunta.", "El jurado deja de escuchar el argumento y el equipo se pone a la defensiva.", "Es más fácil pensar si separas lo que te dijeron de cómo te sentiste.", ["Pide que repitan la pregunta y dale a alguien del grupo el primer turno.", "El equipo escucha una versión más clara antes de responder."]],
      ["Regularse en grupo", "Una compañera quiere salir del escenario. ¿Qué haces sin exponerla?", "Ofrécele en voz baja que otro presente su parte y deja que elija.", "El grupo se reorganiza y ella decide cómo participar.", "Cuéntale al público que está nerviosa para ganar tiempo.", "La presión sobre ella aumenta y se desconecta de la presentación.", "Dar opciones en privado puede devolverle el control."],
      ["Responder con calma", "El jurado señala una limitación real del experimento. ¿Cómo cierras?", "Reconoce la limitación y explica qué prueba harían para resolverla.", "El equipo demuestra que puede aprender de una crítica bajo presión.", "Niega la limitación para que el grupo no pierda confianza.", "La respuesta contradice los resultados que ustedes mismos mostraron.", "Admitir una limitación puede fortalecer un argumento honesto."],
    ],
  },
  "lid-1": {
    openingLine: "Quédense bajo techo. Yo puedo confirmar la lista y el punto de salida.",
    place: "Punto de salida de la excursión", setting: "outdoor", props: ["🚌", "📋", "🌧️"],
    context: "Está por llover y el bus espera. Falta confirmar dónde está un compañero.",
    speaker: "garcia",
    steps: [
      ["Priorizar bajo presión", "¿Qué haces primero mientras el resto espera?", "Mantén al grupo bajo techo y confirma la ubicación del compañero con la docente.", "El equipo se mantiene junto y la docente verifica quién falta.", "Pide a varios estudiantes que salgan solos a buscarlo.", "Pierdes el control del grupo y ahora faltan más personas por ubicar.", "El apuro no cambia la prioridad: saber dónde está cada persona.", ["Verifica la lista con una persona y deja a otra a cargo del grupo bajo techo.", "El equipo sabe quién confirma la lista y quién mantiene el grupo reunido."]],
      ["Comunicar la salida", "El compañero ya apareció. La lluvia cambió el lugar para subir al bus. ¿Qué indicas?", "Confirma la nueva ruta con la docente y pide a cada subgrupo que repita dónde se reúne.", "Los subgrupos se mueven juntos hacia el punto correcto.", "Anuncia que todos corran al bus sin explicar dónde está.", "Dos grupos se separan al tomar rutas distintas.", "Una instrucción breve debe decir adónde ir y cómo confirmar que se entendió."],
    ],
  },
  "lid-2": {
    openingLine: "En vacaciones no voy a estar todos los días para regar.",
    place: "Tablero del huerto comunitario", setting: "outdoor", props: ["🌱", "🚿", "🗓️"],
    context: "El club quiere un huerto que pueda mantenerse todo el trimestre. Hay poco espacio y las vacaciones interrumpen el cuidado.",
    speaker: "sofia",
    steps: [
      ["Definir la meta", "Hay propuestas para sembrar de todo. ¿Qué meta permite evaluar el primer mes?", "Acuerden mantener sanas dos especies y registrar riego y crecimiento.", "El grupo puede comprobar el avance con recursos alcanzables.", "Promete llenar todo el patio sin medir espacio ni mantenimiento.", "El grupo empieza más plantas de las que puede cuidar.", "Una meta estratégica también debe caber en el tiempo y el espacio disponibles.", ["Comiencen con dos especies y fijen una fecha para decidir si amplían.", "La expansión queda condicionada a resultados del primer mes."]],
      ["Planificar recursos", "La mitad del equipo no estará en vacaciones. ¿Cómo cubres el riego?", "Organiza turnos confirmados y prevé una reserva de agua.", "Hay responsables confirmados y un respaldo ante ausencias.", "Escribe turnos sin comprobar si las personas pueden asistir.", "Las plantas se quedan varios días sin riego.", "Una tarea asignada solo está cubierta si alguien puede cumplirla."],
      ["Revisar resultados", "Una especie creció bien y otra no sobrevivió. ¿Qué decisión tomas para el siguiente mes?", "Revisa el registro, cambia una condición de la especie difícil y vuelve a medir.", "El grupo aprende qué ajuste influye antes de ampliar el huerto.", "Cambia semillas, riego y ubicación al mismo tiempo.", "Aunque mejore, no sabrás qué cambio ayudó.", "Si quieres aprender del resultado, conserva condiciones para poder comparar."],
    ],
  },
  "lid-3": {
    openingLine: "La primera parte nos salió bien. Me preocupa el cambio de escena.",
    place: "Camerino del festival escolar", setting: "stage", props: ["🎭", "🎟️", "🎵"],
    context: "El elenco perdió el ritmo en el ensayo y cree que la función saldrá mal.",
    speaker: "daniela",
    steps: [
      ["Reconocer lo que pasó", "¿Qué dices al equipo en vez de dar un discurso vacío?", "Reconoce la frustración y señala el momento que sí salió coordinado.", "El equipo identifica algo concreto que puede repetir.", "Diles que dejen de quejarse y que todo va a salir perfecto.", "El grupo siente que no escuchaste el problema y sigue desanimado.", "Una razón concreta para confiar vale más que una promesa.", ["Pregunta qué parte quieren practicar y celebra lo que sí dominaron.", "El elenco elige una meta de práctica manejable."]],
      ["Convertir el ánimo en acción", "Solo quedan diez minutos. El cambio de escena sigue siendo difícil. ¿Qué organizas?", "Ensayen solo la transición y acuerden una señal visible para entrar.", "Cada persona sabe cuándo moverse y la transición mejora.", "Repitan la obra entera sin parar donde falla.", "Se acaba el tiempo y la transición sigue sin resolverse.", "Elige una acción breve que resuelva el problema más urgente."],
    ],
  },
  "lid-4": {
    openingLine: "El personal está revisando la falla. Dejen libre la zona de los cables.",
    place: "Centro de coordinación de la feria", setting: "office", props: ["📢", "🗺️", "🔌"],
    context: "Falla el suministro eléctrico en la feria que coordinas. Algunas mesas dependen de equipos conectados.",
    speaker: "garcia",
    steps: [
      ["Tomar responsabilidad", "Hay versiones distintas sobre la falla. ¿Qué comunicas al equipo?", "Explica qué está confirmado, pide mantener el área libre y delega la consulta a un adulto responsable.", "El equipo tiene una instrucción segura mientras se confirma el problema.", "Culpa al equipo de sonido y pide que alguien revise los cables.", "Aumenta la confusión y alguien se acerca a equipos que no debe manipular.", "Empieza por seguridad, información confirmada y responsables claros.", ["Pausa las presentaciones eléctricas y asigna a una persona a informar novedades.", "El equipo sabe dónde recibir instrucciones mientras espera."]],
      ["Adaptar el programa", "Hay luz natural, pero la reparación puede tardar. ¿Qué haces con las presentaciones?", "Mueve al patio las actividades que pueden hacerse en papel y reprograma las otras.", "Parte de la feria continúa con una alternativa viable.", "Haz que cada grupo improvise por su cuenta sin anunciar el cambio.", "Se duplican espacios y el público pierde actividades.", "Diferencia lo que puede continuar con pocos recursos de lo que debe esperar."],
      ["Cerrar el incidente", "La energía vuelve cuando queda poco tiempo. ¿Qué decisión deja claro lo que sigue?", "Confirma con el personal, publica un horario actualizado y anota qué mejorar para la próxima feria.", "Los grupos conocen el cierre y el equipo conserva aprendizajes.", "Vuelve al horario original sin decir qué presentaciones se perdieron.", "Quedan grupos esperando un turno que ya no existe.", "Volver a operar requiere informar qué cambió y a quién afecta."],
    ],
  },
  "pen-1": {
    openingLine: "Me mandaron la foto, pero no sé quién la publicó.",
    place: "Mesa de verificación del periódico escolar", setting: "studio", props: ["📰", "🔎", "🔗"],
    context: "Te llega una foto que dice que mañana se suspenden las clases. La foto no muestra la fecha ni el nombre del colegio.",
    speaker: "lucas",
    steps: [["Comprueba el aviso", "¿Qué harías antes de compartir la foto?", "Busca el aviso en el canal del colegio y revisa la fecha.", "Descubres que el aviso era de otro colegio.", "Reenvía la foto porque varios amigos ya la compartieron.", "Algunas familias creen que no habrá clases y cambian sus planes.", "Una foto reenviada muchas veces todavía puede ser de otro día o lugar."]],
  },
  "pen-2": {
    openingLine: "Solo queda un cupo. Me gustaría que podamos explicar cómo lo elegimos.",
    place: "Mesa del comité estudiantil", setting: "office", props: ["⚖️", "📮", "📑"],
    context: "Queda una plaza para un taller. Dos estudiantes cumplen los requisitos y tienen necesidades distintas.",
    speaker: "daniela",
    steps: [
      ["Separar razones de preferencias", "El grupo quiere decidir según a quién conoce mejor. ¿Qué proceso propones?", "Acuerden criterios relacionados con el taller antes de comparar solicitudes.", "El comité puede explicar la decisión sin depender de amistades.", "Vota por quien conoces más y anima a los demás a hacer lo mismo.", "La elección queda ligada a relaciones personales.", "Un buen criterio se puede aplicar de la misma forma a ambas personas.", ["Pide que el grupo lea ambas solicitudes sin los nombres antes de acordar criterios.", "El comité identifica razones relevantes sin centrarse en amistades."]],
      ["Resolver un empate", "Ambas personas cumplen por igual y no hay tiempo para pedir más información. ¿Qué haces?", "Explica el empate y usa un desempate transparente, con lista de espera.", "Ambas personas entienden cómo se resolvió el caso y qué sigue.", "Cambia las reglas al final para que gane tu opción preferida.", "El proceso pierde credibilidad aunque se anuncie un resultado rápido.", "El desempate también necesita una regla explicable."],
    ],
  },
  "pen-3": {
    openingLine: "Cada vez que intento marcar esta tarjeta como verdadera, la frase dice lo contrario.",
    place: "Club de lógica de la biblioteca", setting: "library", props: ["🧩", "✉️", "❔"],
    context: "Un reto del club usa frases que se contradicen. Tu tarea es detectar qué supuestos generan la contradicción.",
    speaker: "sofia",
    steps: [
      ["Probar ambos supuestos", "Una tarjeta dice «Esta oración es falsa». ¿Cómo examinas el problema?", "Prueba qué ocurre si la frase es verdadera y qué ocurre si es falsa.", "Las dos pruebas muestran por qué asignarle un valor simple falla.", "Declárala falsa solo porque incluye esa palabra.", "Al tratarla como falsa, lo que afirma parece volverse verdadero.", "El significado de una palabra no prueba la verdad de la frase que la contiene.", ["Escribe las dos hipótesis en columnas y sigue sus consecuencias.", "La contradicción queda visible en ambas columnas."]],
      ["Comparar con otro caso", "Otra tarjeta dice «La tarjeta azul es falsa». La azul solo dice «Hoy es martes». ¿Qué cambia?", "Separa la referencia a otra tarjeta de la referencia a sí misma.", "Puedes comprobar el día sin caer en la misma contradicción.", "Afirma que toda frase que habla de otra frase es paradójica.", "Estás tratando como idénticos dos tipos distintos de referencia.", "Pregúntate si la frase depende de su propia verdad o de un hecho externo."],
      ["Explicar los límites", "Alguien propone borrar la frase original y declarar que la resolvió. ¿Qué explicas?", "Aclara qué supuesto genera el problema y por qué borrar la frase lo evita sin explicarlo.", "El grupo distingue evitar la contradicción de analizar su causa.", "Di que la lógica no sirve porque una oración no encaja.", "El grupo pierde una oportunidad de detectar la regla que falló.", "Una excepción es una pista para revisar supuestos, incluso si no da una respuesta simple."],
    ],
  },
  "pen-4": {
    openingLine: "Traje el registro de llegadas y una hoja con lo que opinan sus compañeros.",
    place: "Mesa de datos del consejo escolar", setting: "office", props: ["📊", "📄", "🖊️"],
    context: "Hay una discusión sobre el nuevo horario. Una hoja muestra llegadas tarde y otra recoge opiniones de estudiantes.",
    speaker: "garcia",
    steps: [
      ["Clasificar las afirmaciones", "«Hubo 12 tardanzas» y «el nuevo horario es horrible» aparecen juntas. ¿Cómo las presentas?", "Marca la cifra como un dato del registro y la valoración como una opinión.", "El consejo entiende qué puede verificar y qué expresa una experiencia.", "Cuenta ambas frases como hechos que prueban lo mismo.", "Las conclusiones mezclan medidas y valoraciones sin distinguirlas.", "Un registro responde cuánto ocurrió. Una valoración explica cómo se sintió alguien.", ["Pide la fuente de la cifra y pregunta qué parte del horario molestó.", "Puedes contextualizar el registro y entender la opinión."]],
      ["Interpretar sin exagerar", "La cifra viene de un solo día de lluvia. ¿Qué concluyes?", "Propón comparar varias semanas y considerar causas como el clima.", "El consejo evita atribuir al horario un efecto todavía incierto.", "Afirma que el horario causó todas las tardanzas.", "La conclusión ignora otras causas y usa una muestra limitada.", "Que dos cosas ocurran juntas todavía no dice cuál causó a la otra."],
    ],
  },

  "cre-1": {
    openingLine: "Ya puse dos vasos en la mesa para que podamos probar tu idea.",
    place: "Taller de ideas del recreo", setting: "workshop", props: ["💡", "🥤", "✏️"], speaker: "sofia",
    context: "En el recreo se mezclan los vasos limpios con los usados. Tienes cartón y marcadores.",
    steps: [["Dibuja una idea", "¿Qué podrías hacer hoy para ayudar a separar los vasos?", "Haz dos letreros: un vaso limpio y un vaso usado. Pídele a alguien que los pruebe.", "Ves si otra persona sabe dónde dejar su vaso con solo mirar los dibujos.", "Dibuja una máquina enorme, pero no muestres cómo se usaría.", "El grupo ve tu dibujo, pero todavía no sabe dónde dejar su vaso.", "Empieza con algo que puedas hacer y probar con lo que tienes."]],
  },
  "cre-2": {
    openingLine: "¡Última llamada para el tren a la Luna! Espero que trajeras tu boleto.",
    place: "Escenario de improvisación", setting: "stage", props: ["🎭", "🌂", "🎫"], speaker: "lucas",
    context: "Tu compañero entra con un paraguas y dice que es el último tren a la Luna.",
    steps: [
      ["Aceptar la propuesta", "¿Cómo construyes una escena con lo que acaba de ofrecer?", "Acepta el tren lunar y añade que falta un boleto para despegar.", "Ambos personajes comparten una situación y tienen algo que hacer.", "Dile que eso no tiene sentido y empieza otra historia.", "Tu compañero se queda sin una forma de continuar la escena.", "Añade una idea que pueda convivir con la que ya presentó tu compañero.", ["Pregunta por qué el tren lleva paraguas y conviértelo en un problema de la historia.", "La pareja convierte un objeto inesperado en parte de la trama."]],
      ["Cerrar el giro", "El público descubre que el paraguas era la antena del tren. ¿Cómo cierras?", "Recupera el objeto, despliega la antena y muestra el despegue.", "El cierre recompensa al público por recordar un detalle de la apertura.", "Introduce un villano nuevo en la última frase.", "La escena termina con un problema que no se alcanza a resolver.", "Una idea del inicio puede darle sentido al cierre."],
    ],
  },
  "cre-3": {
    openingLine: "Quiero que el coro recuerde algo que hacíamos antes de que se mudara.",
    place: "Sala de música del colegio", setting: "studio", props: ["🎵", "🥁", "✍️"], speaker: "daniela",
    context: "Quieren escribir un coro sobre extrañar a una amistad que se mudó.",
    steps: [
      ["Buscar una imagen", "¿Cómo haces que la emoción se sienta en una línea?", "Describe la silla vacía junto a la ventana donde conversaban.", "La letra muestra una ausencia con una imagen concreta.", "Repite «estoy triste» en cada línea para que se entienda.", "La emoción se entiende, pero la letra pierde detalles que la hagan memorable.", "Una escena que puedas imaginar comunica más que nombrar la emoción.", ["Describe el mensaje que empezaste a escribir y nunca enviaste.", "La letra encuentra otra imagen concreta para la despedida."]],
      ["Ajustar letra y ritmo", "La última frase no entra en el compás. ¿Qué cambias?", "Canta despacio, recorta sílabas de sobra y conserva la imagen principal.", "El coro mantiene el sentido y se puede cantar con el grupo.", "Acelera solo en la última frase para que entren todas las palabras.", "Las palabras se atropellan y cuesta entender la frase clave.", "Protege la imagen y prueba qué palabras pueden salir sin perderla."],
    ],
  },
  "cre-4": {
    openingLine: "Antes de ver el prototipo, cuéntanos qué le cuesta hacer a quien lo usaría.",
    place: "Vitrina de inventos del festival", setting: "stage", props: ["🎨", "📦", "🔦"], speaker: "garcia",
    context: "Presentas un estuche que ayuda a encontrar útiles sin depender solo del color. El jurado tiene 90 segundos.",
    steps: [
      ["Abrir con el problema", "¿Cómo usas los primeros segundos para que se entienda la necesidad?", "Haz una demostración rápida de buscar dos objetos iguales al tacto y explica el reto.", "El jurado puede visualizar el problema antes de ver el producto.", "Empieza leyendo todos los materiales de fabricación.", "El jurado conoce la lista, pero no para qué sirve el estuche.", "Presenta la necesidad desde la experiencia de quien usará el objeto.", ["Cuenta el caso breve de una estudiante que confunde los compartimentos.", "El jurado conoce a quién beneficia el diseño."]],
      ["Demostrar el beneficio", "Te preguntan si tu diseño ayuda con el estuche dentro de la mochila. ¿Cómo lo demuestras?", "Pide a alguien que identifique un compartimento por su forma sin mirarlo.", "La demostración prueba el uso que acaba de cuestionar el jurado.", "Muestra otra foto de los colores del estuche.", "La foto no responde si funciona cuando no puedes mirar.", "Prueba el diseño en la condición concreta que te preguntaron."],
      ["Cerrar con evidencia", "Una persona logra usarlo y otra tarda más. ¿Qué afirmas al cerrar?", "Explica qué observaste y qué compararás en una prueba con más personas.", "El cierre muestra valor sin prometer más de lo observado.", "Afirma que cualquiera lo usará de inmediato.", "El jurado recuerda a la persona que tardó y duda de tu conclusión.", "Una presentación convincente también dice qué falta comprobar."],
    ],
  },
  "inn-1": {
    openingLine: "Vi que alguien se quedó con la botella en la mano. El cartel no le ayudó.",
    place: "Laboratorio del hackathon escolar", setting: "workshop", props: ["💻", "🗑️", "🧰"], speaker: "daniela",
    context: "El colegio quiere mejorar la separación de desechos. Tu equipo tiene pocas horas para mostrar un prototipo.",
    steps: [
      ["Elegir un problema verificable", "La gente se equivoca con botellas sucias. ¿Qué investigas?", "Observa en qué momento se confunden y pregunta qué información faltó.", "Descubres que el letrero no explica qué hacer con líquidos.", "Añade una app antes de ver dónde ocurre el error.", "El equipo construye algo que no responde al problema del tacho.", "Observa la acción que falla antes de decidir la tecnología.", ["Prueba dos letreros en papel y observa cuál se entiende mejor.", "El equipo obtiene evidencia rápida sin programar todavía."]],
      ["Priorizar el prototipo", "Queda una hora y el sensor aún no funciona. ¿Qué muestras?", "Demuestra el flujo de clasificación con controles manuales y explica qué automatizarías.", "El jurado puede evaluar la interacción y conoce la parte pendiente.", "Simula que el sensor funciona sin decir que lo estás controlando.", "El jurado interpreta una función manual como una integración terminada.", "Una prueba útil distingue lo que funciona de lo que estás representando."],
      ["Interpretar la prueba", "Tres personas aciertan con botellas y dos dudan con vasos. ¿Qué mejoras?", "Agrega ejemplos para vasos y repite la prueba con esos desechos.", "La siguiente versión atiende el error observado.", "Cambia toda la aplicación porque dos personas dudaron.", "Pierdes lo que funcionó y no puedes aislar la causa de la mejora.", "Localiza el caso que sigue causando errores y cámbialo primero."],
    ],
  },
  "inn-2": {
    openingLine: "Yo encontré el pabellón por el mural. El nombre no me decía mucho.",
    place: "Laboratorio de prototipos digitales", setting: "digital", props: ["📱", "🧭", "♿"], speaker: "sofia",
    context: "Estudiantes nuevos se pierden entre pabellones. Quieres diseñar una aplicación de orientación.",
    steps: [
      ["Identificar la tarea", "Los estudiantes recuerdan colores de edificios, pero no nombres. ¿Qué prototipo haces primero?", "Dibuja un flujo para buscar el aula por código y confirmar con una referencia visible.", "La prueba empieza con una tarea concreta y reconoce lo que el estudiante ya sabe.", "Diseña primero el perfil social y la tienda de temas.", "El prototipo aún no permite encontrar un aula.", "Dibuja la ruta mínima entre el problema y su resolución.", ["Dibuja el trayecto con puntos reconocibles y pide a un estudiante nuevo que lo siga.", "Puedes observar qué referencias ayudan antes de programar."]],
      ["Resolver una ruta inaccesible", "La ruta corta usa escaleras. Alguien necesita evitar desniveles. ¿Qué incluyes?", "Ofrece una ruta accesible con referencias y explica cuándo cambia la duración.", "El usuario puede elegir una ruta viable para sus necesidades.", "Conserva una única ruta y esconde la advertencia en la ayuda.", "La persona descubre la barrera cuando ya llegó a la escalera.", "La ruta útil es la que la persona puede recorrer, aunque sea más larga."],
      ["Probar sin conexión", "La señal se pierde entre edificios. ¿Qué información queda disponible?", "Mantén las instrucciones esenciales ya cargadas y muestra si no se pudo actualizar.", "El estudiante puede terminar el trayecto y sabe qué datos podrían estar desactualizados.", "Deja una pantalla de carga indefinida hasta que vuelva la señal.", "El usuario se queda sin orientación en el punto más difícil.", "Conserva primero la información que se necesita durante el recorrido."],
    ],
  },
  "inn-3": {
    openingLine: "Mi tía quiere plantar algo, pero solo tiene una ventana pequeña.",
    place: "Mesa de proyectos del club de emprendimiento", setting: "market", props: ["🌱", "📦", "🗣️"], speaker: "lucas",
    context: "Quieres alquilar kits para cultivar plantas. Debes comprobar si a alguien le servirían antes de comprar insumos.",
    steps: [
      ["Definir el valor", "¿A quién le ofrecerías la primera versión y qué resolvería?", "Enfócate en familias con poco espacio y ofrece un kit pequeño con instrucciones.", "La propuesta responde a una necesidad concreta y se puede explicar en una frase.", "Promete un huerto grande para cualquier tipo de cliente.", "La oferta es demasiado amplia para saber si hay una demanda real.", "Define a quién le sirve la primera versión y por qué.", ["Elige un grupo pequeño de usuarios y pregunta cómo cultivan hoy.", "Descubres qué parte del proceso les cuesta más."]],
      ["Comprobar interés", "Varias personas dicen que les gusta, pero ninguna haría un pedido. ¿Qué pruebas ahora?", "Ofrece una demostración o reserva de prueba y pregunta qué impide dar el siguiente paso.", "Obtienes evidencia más útil que una opinión general.", "Compra materiales para cien kits porque hubo comentarios positivos.", "El dinero queda en inventario sin pedidos confirmados.", "El interés declarado y la disposición a probar una oferta son señales distintas."],
    ],
  },
  "inn-4": {
    openingLine: "Mis cuadernos se caen apenas abro la puerta. Mira.",
    place: "Pasillo de casilleros", setting: "hall", props: ["🔧", "🧲", "📚"], speaker: "daniela",
    context: "Se caen los cuadernos al abrir el casillero. Tienes un pedazo de cartón y una liga.",
    steps: [["Prueba una solución", "¿Cómo evitarías que caigan y dejarías que se puedan sacar?", "Usa el cartón como apoyo y la liga para sujetar los cuadernos.", "Los cuadernos se quedan en su sitio y puedes sacarlos cuando los necesitas.", "Pega los cuadernos al casillero con cinta.", "Los cuadernos no caen, pero cuesta sacarlos para clase.", "Piensa en qué puede sujetar los cuadernos sin pegarlos."]],
  },
  "dig-1": {
    openingLine: "El correo dice que me van a cerrar la cuenta. El enlace se ve raro.",
    place: "Bandeja de mensajes del laboratorio", setting: "digital", props: ["🔐", "📨", "🔗"], speaker: "lucas",
    context: "Te llega un correo que pide tu contraseña. Dice que tu cuenta escolar se cerrará hoy.",
    steps: [["Cuida tu contraseña", "El enlace no es del colegio. ¿Qué harías?", "Abre la página del colegio por tu cuenta y consulta el aviso.", "Puedes comprobarlo sin dar tu contraseña.", "Abre el enlace del mensaje y escribe tu contraseña.", "Alguien podría usar esa página para quedarse con tu contraseña.", "Si tienes dudas, entra por la dirección que ya conoces."]],
  },
  "dig-2": {
    openingLine: "Quiero compartir el trabajo del club. En una foto se ve nuestra ubicación.",
    place: "Panel de privacidad del club", setting: "digital", props: ["📱", "📷", "📍"], speaker: "sofia",
    context: "Vas a publicar fotos del club. Algunas dejan ver nombres y la ubicación de una actividad.",
    steps: [
      ["Revisar lo que publicas", "¿Qué haces antes de compartir el álbum?", "Revisa rostros, nombres y ubicación. Pregunta a quienes aparecen y limita la audiencia.", "Puedes mostrar el trabajo del club sin exponer detalles innecesarios.", "Publica el álbum completo y oculta datos si alguien se queja.", "La imagen puede copiarse antes de que la retires.", "Mira qué podría descubrir alguien que no forma parte del club.", ["Selecciona fotos del material y recorta los detalles que identifican a personas.", "El club puede enseñar su trabajo con menos datos personales."]],
      ["Responder a una solicitud", "Una compañera te pide retirar una foto que alguien ya reenvió. ¿Qué haces?", "Retira tu copia, avisa a quien la compartió y ajusta el permiso del álbum.", "Reduces la difusión y explicas qué copias puedes controlar.", "Borra tu publicación y asegura que desapareció de todas partes.", "Quedan copias que tu cuenta no puede borrar directamente.", "Distingue entre retirar tu publicación y controlar copias ajenas."],
    ],
  },
  "dig-3": {
    openingLine: "En la primera prueba, una estudiante usará el sitio solo con el teclado.",
    place: "Estación web del club de lectura", setting: "digital", props: ["💻", "📚", "🌐"], speaker: "garcia",
    context: "El club necesita una página sencilla para anunciar lecturas y reuniones. Algunas personas navegan con teclado.",
    steps: [
      ["Diseñar la estructura", "¿Qué debe encontrar alguien que entra por primera vez?", "Incluye próxima reunión, libro actual y cómo sumarse, con encabezados claros.", "La primera pantalla responde las preguntas más frecuentes del club.", "Organiza todo en una sola imagen llamativa.", "El texto no se puede seleccionar ni recorrer bien con tecnologías de asistencia.", "Ordena el contenido según las tareas que la página debe resolver.", ["Haz un menú breve con enlaces a lecturas, reuniones y contacto.", "Las tareas principales tienen destinos reconocibles."]],
      ["Probar el acceso", "En la prueba, el teclado no llega al botón de inscripción. ¿Qué haces?", "Usa un enlace o botón nativo y comprueba el orden y el foco con Tab.", "El control se puede encontrar y activar sin ratón.", "Agrega una flecha animada que apunte al botón.", "El botón se ve mejor, pero el teclado sigue sin alcanzarlo.", "Una indicación visual no arregla un control que no recibe foco."],
      ["Publicar la información justa", "Te piden mostrar teléfonos personales de todos para organizar reuniones. ¿Qué publicas?", "Usa un contacto del club y publica solo datos necesarios con autorización.", "La página cumple su objetivo sin exponer a todos los integrantes.", "Publica la lista completa porque quienes entran probablemente son del colegio.", "El directorio queda accesible a más personas de las previstas.", "Una página pública debe incluir solo la información necesaria para su propósito."],
    ],
  },
  "dig-4": {
    openingLine: "Yo también quiero ir al taller, pero no sé qué día empieza.",
    place: "Editor de correo del colegio", setting: "digital", props: ["📧", "📎", "✏️"], speaker: "sofia",
    context: "Quieres ir al taller de robótica. No sabes cuándo empieza ni qué debes llevar.",
    steps: [["Escribe tu correo", "¿Qué mensaje facilitaría que te respondan?", "«Hola, soy Camila de segundo. ¿Cuándo empieza el taller de robótica y qué debo llevar?»", "La persona entiende qué taller te interesa y qué necesitas saber.", "«Hola, mándeme la información, por favor».", "La persona tiene que preguntarte a qué actividad te refieres.", "Incluye el nombre del taller y una pregunta concreta."]],
  },

  "emp-1": {
    openingLine: "En el club leemos mucho. A mí me gustaría un separador con mi nombre.",
    place: "Puesto de separadores personalizados", setting: "market", props: ["🔖", "🎨", "🏷️"], speaker: "daniela",
    context: "Quieres vender separadores de libros en la feria. Hacer cada uno te cuesta 2 soles.",
    steps: [["Elige un precio", "¿Qué precio te permite recuperar lo que gastaste y guardar algo para hacer más?", "Cobra 3 soles por separador.", "Recuperas los 2 soles de materiales y te queda 1 sol por venta.", "Cobra 1 sol por separador.", "Por cada venta te falta 1 sol para recuperar el costo.", "Compara cuánto gastas en hacer uno con lo que recibirías al venderlo."]],
  },
  "emp-2": {
    openingLine: "Tengo anotados los ingredientes. Falta decidir para quiénes y cuánto haremos.",
    place: "Mesa de planificación del puesto", setting: "office", props: ["📋", "🍎", "🧾"], speaker: "sofia",
    context: "Tu grupo planea vender meriendas en la feria y quiere organizar la idea en una hoja.",
    steps: [
      ["Ordenar la propuesta", "¿Qué partes incluyes para saber si el puesto es viable?", "Describe público, oferta, recursos, costos y cómo cobrarás.", "La hoja permite encontrar supuestos y repartir tareas.", "Usa toda la hoja para dibujar el logotipo.", "El equipo aún no puede estimar cuántas meriendas necesita vender.", "Imagina que otra persona debe operar el puesto solo con lo que escribiste.", ["Esboza la compra del cliente y anota qué costo aparece en cada paso.", "El equipo ve qué necesita para atender una compra completa."]],
      ["Ajustar los números", "Subió el costo de un insumo y el público tiene presupuesto limitado. ¿Qué revisas?", "Compara porciones, alternativas y margen antes de actualizar precio o menú.", "El plan conserva una oferta asequible que cubre sus costos.", "Mantén el plan intacto y espera vender más para compensar.", "El margen puede seguir siendo insuficiente aunque vendas todo.", "Un costo nuevo puede cambiar qué oferta es viable."],
    ],
  },
  "emp-3": {
    openingLine: "A veces llego a casa y no me acuerdo de qué dejaron para el día siguiente.",
    place: "Punto de entrevistas en la biblioteca", setting: "library", props: ["🗣️", "📝", "📚"], speaker: "lucas",
    context: "El equipo quiere diseñar una agenda escolar. Hablarás con alguien que a veces olvida sus tareas.",
    steps: [["Haz una buena pregunta", "¿Qué le preguntarías para entender qué le cuesta?", "«Cuéntame la última vez que olvidaste una tarea. ¿Dónde la habías apuntado?»", "Descubres qué pasó y qué podría ayudarle a recordar.", "«¿Cierto que nuestra agenda te solucionaría todo?»", "Puede responder que sí por quedar bien, pero sigues sin saber qué le cuesta.", "Pídele que cuente algo que le pasó, con sus propias palabras."]],
  },
  "emp-4": {
    openingLine: "Cuéntanos qué pasó con las familias que probaron el préstamo de juegos.",
    place: "Auditorio de la ronda de inversión", setting: "auditorium", props: ["📈", "💼", "🎤"], speaker: "garcia",
    context: "Presentas un préstamo de juegos educativos. Diez familias probaron el servicio y cuatro volvieron a usarlo.",
    steps: [
      ["Sostener la oportunidad", "¿Cómo presentas los resultados iniciales?", "Explica cuántas familias probaron, cuántas volvieron y qué quieres validar.", "El jurado entiende la señal de interés y el tamaño de la prueba.", "Proyecta miles de clientes usando solo las cuatro repeticiones.", "El jurado pregunta cómo llegaste a esa cifra y no puedes explicarla.", "Una cifra inicial gana fuerza cuando aclaras de dónde viene.", ["Presenta los datos y describe por qué algunas familias no volvieron.", "El jurado ve qué quieres averiguar sobre las familias que volverían."]],
      ["Responder sobre costos", "El jurado pregunta qué pasa si se pierden piezas de los juegos. ¿Qué respondes?", "Incluye reposición en los costos y propone una revisión al devolver cada juego.", "La propuesta incorpora el costo y una forma de reducirlo.", "Di que nadie perderá piezas porque firmará un compromiso.", "El jurado no encuentra una respuesta para el costo de una pérdida real.", "Una medida para prevenir un problema no elimina su costo potencial."],
      ["Definir qué financias", "Te ofrecen menos dinero del que pediste. ¿Qué harías primero?", "Propón una prueba pequeña con metas de uso y pérdidas antes de expandir.", "La inversión tiene un objetivo medible y un criterio para decidir el siguiente paso.", "Promete abrir todos los puntos con la mitad del presupuesto.", "La operación queda sin recursos de reposición y seguimiento.", "Vincula el dinero disponible a la pregunta más importante por resolver."],
    ],
  },
  "tie-1": {
    openingLine: "Recuerda que Ciencias se entrega hoy. El cartel puede esperar al viernes.",
    place: "Tablero de pendientes de hoy", setting: "desk", props: ["⏰", "📚", "✅"], speaker: "sofia",
    context: "Hoy debes entregar una tarea de Ciencias. El cartel del club se entrega el viernes. Tienes media hora libre.",
    steps: [["Ordena tus pendientes", "¿Qué harías primero?", "Haz la tarea de Ciencias. Deja un momento del jueves para el cartel.", "Avanzas en lo que vence hoy y ya tienes un momento para lo demás.", "Haz el cartel primero porque tienes más ganas de dibujar.", "Se acaba la media hora y la tarea que vence hoy sigue pendiente.", "Mira qué entrega vence antes."]],
  },
  "tie-2": {
    openingLine: "El martes salgo tarde del entrenamiento. Prefiero repasar un rato otro día.",
    place: "Calendario de la semana escolar", setting: "desk", props: ["🗓️", "🏀", "🌙"], speaker: "lucas",
    context: "Tienes examen el jueves y entrenamiento el martes. Quieres repasar y dormir a tiempo.",
    steps: [["Haz un plan para la semana", "¿En qué días conviene repasar?", "Repasa un rato el lunes y otro el miércoles.", "Llegas al jueves con dos repasos y tiempo para descansar.", "Estudia todo el miércoles hasta la medianoche.", "Te queda poco tiempo para repasar y duermes menos.", "Busca dos ratos libres antes del examen."]],
  },
  "tie-3": {
    openingLine: "Cada vez que suena el chat, vuelvo a leer el mismo párrafo.",
    place: "Rincón de estudio con temporizador", setting: "desk", props: ["⏱️", "🔕", "📖"], speaker: "daniela",
    context: "Te distraes mientras lees y necesitas resumir un capítulo largo.",
    steps: [
      ["Elegir un bloque de enfoque", "¿Qué harías durante un primer bloque corto?", "Silencia notificaciones y enfócate en resumir solo una sección.", "Terminas un bloque con un resultado que puedes revisar.", "Mantén abiertos el chat y varios videos para alternar cuando te aburras.", "Cada interrupción te obliga a volver a ubicarte en el texto.", "Un bloque útil tiene un objetivo concreto y reduce interrupciones.", ["Empieza con diez minutos y deja anotadas las dudas para revisarlas al terminar.", "Tienes un bloque breve y un lugar donde dejar interrupciones pendientes."]],
      ["Ajustar el siguiente bloque", "Perdiste concentración a los 18 minutos. ¿Qué pruebas ahora?", "Haz una pausa breve y prueba un bloque más corto con una meta específica.", "Ajustas el método según lo que observaste en tu atención.", "Duplica la duración del próximo bloque para recuperar tiempo.", "Pierdes el foco antes de alcanzar el nuevo objetivo.", "El tiempo útil de enfoque puede ser distinto al tiempo que marca un reloj."],
    ],
  },
  "tie-4": {
    openingLine: "Ayer salí tarde porque me faltaba guardar un cuaderno.",
    place: "Panel de rutina de la mañana", setting: "hall", props: ["☀️", "🎒", "⏰"], speaker: "sofia",
    context: "Llegaste tarde tres veces porque preparas la mochila justo antes de salir.",
    steps: [
      ["Elegir un hábito pequeño", "¿Qué cambio puedes repetir desde hoy?", "Prepara la mochila después de cenar y déjala junto a la puerta.", "La mañana tiene una tarea menos y una señal visible.", "Agrega una rutina larga de cinco hábitos sin cambiar la mochila.", "La rutina ocupa más tiempo y sigue el retraso habitual.", "Cambia primero la tarea que está causando el retraso.", ["Pon una lista junto a la mochila y revísala antes de acostarte.", "Puedes detectar lo que falta antes de la mañana."]],
      ["Mantener el hábito", "El miércoles llegas tarde a casa. ¿Cómo sostienes la rutina sin hacerla larga?", "Usa una versión mínima: deja listos cuadernos y llaves y revisa lo demás en la mañana.", "Mantienes lo esencial incluso en un día distinto.", "Abandona el hábito porque no puedes hacerlo de la forma ideal.", "El retraso vuelve justo cuando más necesitas apoyo.", "Prepara una versión pequeña del hábito para los días difíciles."],
    ],
  },
  "pro-1": {
    openingLine: "Anoté dónde usaron el cronómetro. Revisemos antes de sacar conclusiones.",
    place: "Salón tras la clase de ciencias", setting: "hall", props: ["🔍", "🧪", "📋"], speaker: "garcia",
    context: "Falta el cronómetro de Ciencias. La última persona que lo usó anotó que lo dejó junto a la caja de materiales.",
    steps: [["Sigue la pista", "¿Dónde buscarías primero?", "Revisa la caja de materiales y pregunta a quienes guardaron las cosas.", "Encuentras el cronómetro junto a los tubos del experimento.", "Acusa a quien salió último del salón.", "Causas una pelea y sigues sin saber dónde está el cronómetro.", "Empieza por el lugar que menciona la pista."]],
  },
  "pro-2": {
    openingLine: "Yo ya probé dos órdenes. Si los anotamos, nadie tiene que empezar de cero.",
    place: "Mesa del reto de combinaciones", setting: "library", props: ["🧩", "🔢", "🤝"], speaker: "lucas",
    context: "Deben ordenar cuatro tarjetas. La azul va antes de la verde y la roja no va en los extremos.",
    steps: [
      ["Representar las pistas", "¿Cómo puede colaborar el grupo sin repetir pruebas?", "Dibujen cuatro espacios y marquen qué posiciones descarta cada pista.", "El grupo puede ver las restricciones en un tablero común.", "Pide que cada persona pruebe combinaciones al azar sin anotarlas.", "Varias personas repiten los mismos intentos sin saber por qué fallaron.", "Hagan visible lo que ya descartaron para que todos partan del mismo punto.", ["Asigna una pista a cada persona y luego crucen las restricciones.", "Cada compañero explica qué eliminó y por qué."]],
      ["Comprobar la solución", "Ya tienen una secuencia que cumple dos reglas, pero queda una pista sin revisar. ¿Qué hacen?", "Comprueben las reglas una a una y expliquen por qué la secuencia cumple todas.", "El equipo distingue una propuesta plausible de una solución comprobada.", "Denla por correcta porque se parece a la respuesta anterior.", "La secuencia puede incumplir justo la pista que nadie revisó.", "La última comprobación debe incluir también la pista que parece menos importante."],
    ],
  },
  "pro-3": {
    openingLine: "El paso está cerrado. Confirmen la ruta con el personal antes de mover al grupo.",
    place: "Centro escolar de coordinación por lluvias", setting: "office", props: ["🌧️", "🗺️", "📻"], speaker: "garcia",
    context: "En un simulacro por lluvias, un camino está cerrado y algunos grupos todavía esperan indicaciones.",
    steps: [
      ["Confirmar lo que se sabe", "Hay un mapa antiguo y un aviso reciente del personal. ¿Qué tomas como punto de partida?", "Confirma el cierre con el personal y actualiza el mapa con la ruta autorizada.", "El equipo comparte una referencia reciente y verificada.", "Usa el mapa antiguo porque muestra el camino más corto.", "La ruta lleva a un paso que ya fue cerrado.", "La información más útil debe ser reciente y comprobable.", ["Pide que el personal indique la ruta y que otro compañero la anote.", "Tienes instrucciones claras antes de comunicarlas al grupo."]],
      ["Adaptar la ruta", "Una parte del grupo necesita una ruta sin escaleras. ¿Qué haces?", "Confirma una ruta accesible con el personal y asigna acompañamiento en el grupo.", "La alternativa se puede recorrer sin dejar a nadie atrás.", "Envía a todo el grupo por las escaleras porque llegan antes.", "Parte del grupo queda separada del resto.", "Una solución rápida debe seguir siendo viable para todas las personas."],
      ["Comprobar el cierre", "Un grupo no confirma que llegó al punto seguro. ¿Qué comunica el equipo?", "Informa al personal cuál es el grupo, su última ubicación confirmada y por dónde debía ir.", "El personal recibe datos claros para verificar el paradero.", "Anuncia que todos llegaron porque los demás grupos ya contestaron.", "Se da por terminado el simulacro sin verificar a quienes faltan.", "Distingue entre lo confirmado y lo que todavía falta comprobar."],
    ],
  },
  "pro-4": {
    openingLine: "Encontré dos mesas libres. Quizá podamos mostrar el cartel de otra forma.",
    place: "Taller de reparación de la feria", setting: "workshop", props: ["🛠️", "📦", "🔄"], speaker: "daniela",
    context: "Se rompe el soporte del cartel y no hay repuestos. Debes mostrar las instrucciones antes de que llegue el público.",
    steps: [
      ["Cambiar el enfoque", "¿Cómo resuelves el problema sin reconstruir el soporte?", "Usa una superficie disponible y divide el cartel en hojas que puedan leerse a la altura adecuada.", "Las instrucciones se pueden consultar mientras el equipo prepara otra solución.", "Intenta pegar el soporte roto sin comprobar si aguanta.", "El cartel vuelve a caerse en una zona de paso.", "Identifica para qué servía el soporte y busca otra manera de cumplir esa función.", ["Usa una mesa existente e inclina las hojas sobre una base estable.", "Puedes mostrar las instrucciones con objetos que ya están disponibles."]],
      ["Probar con público", "Las hojas se leen de cerca, pero el grupo se amontona. ¿Qué ajustas?", "Duplica los puntos de lectura y señala el orden con números visibles.", "El público se reparte y encuentra la secuencia sin preguntar.", "Pide a todos que lean al mismo tiempo desde el punto original.", "La fila crece y las personas del fondo siguen sin ver.", "Una buena solución funciona también cuando varias personas la usan a la vez."],
      ["Elegir una versión estable", "La fila mejoró, pero una de las mesas bloquea el paso. ¿Qué mantienes?", "Conserva dos puntos de lectura, mueve la mesa fuera del paso y repite la observación.", "Las instrucciones quedan accesibles y el paso se mantiene libre.", "Quita las indicaciones para que nadie se detenga.", "Resuelves la fila a costa de perder la información esencial.", "Revisa el efecto secundario sin abandonar el objetivo inicial."],
    ],
  },
};

export function createMissionScript(id: string, title: string, skill: string): MissionScript {
  const mission = MISSION_CASES[id];
  if (!mission) throw new Error(`Falta el guion de la misión ${id}`);
  const scenes: Record<string, MissionScene> = {};
  const end = "end:completed";
  const sceneId = (index: number, alternate = false) => `stage-${index + 1}${alternate ? "-alternate" : ""}`;

  mission.steps.forEach(([label, challenge, action, reaction, mistake, consequence, hint, alternate], index) => {
    const next = index + 1 < mission.steps.length ? sceneId(index + 1) : end;
    const wrong: SceneChoice = {
      id: "rethink", emoji: "↺", text: mistake, quality: "negative", consequence, crowd: "doubtful",
    };
    const good: SceneChoice = {
      id: "advance", emoji: "✦", text: action, quality: "good", reaction, next, crowd: "engaged",
    };
    const choices = index % 2 === 0 ? [wrong, good] : [good, wrong];
    if (alternate) {
      choices.splice(1, 0, {
        id: "alternate", emoji: "◈", text: alternate[0], quality: "ok", reaction: alternate[1],
        next: alternate[2] && next !== end ? sceneId(index + 1, true) : next, crowd: "attentive",
      });
    }

    // A stage can supply new facts before its question. Present those facts once.
    const questionStart = challenge.indexOf("¿");
    const newFacts = questionStart > 0 ? challenge.slice(0, questionStart).trim() : "";
    const task = questionStart > 0 ? challenge.slice(questionStart) : challenge;
    const narration = [index === 0 ? mission.context : "", newFacts].filter(Boolean).join(" ");
    const previous = mission.steps[index - 1];
    const scene: MissionScene = {
      id: sceneId(index),
      stage: index + 1,
      location: mission.place,
      mood: index === 0 ? "nervous" : "confident",
      narration,
      speaker: "",
      speakerId: mission.speaker,
      dialogue: index === 0 ? mission.openingLine : "",
      consigna: task,
      board: { title, sub: label },
      choices,
      hints: {
        clarify: [
          { focus: "objetivo", text: hint },
          { focus: "consigna", text: `Piensa qué pasaría con cada opción antes de elegir. Recuerda los detalles en «Recordar la escena».` },
        ],
        recover: {
          rethink: [
            { focus: "objetivo", text: hint },
            { focus: "ejemplo", text: `${consequence} Piensa qué tendría que cambiar para evitar ese resultado.` },
          ],
        },
      },
    };
    scenes[scene.id] = scene;
    const previousFact = previous?.[7]?.[2];
    if (previousFact) {
      const branchId = sceneId(index, true);
      scenes[branchId] = { ...scene, id: branchId, narration: [previousFact, narration].filter(Boolean).join(" ") };
    }
  });

  const final = mission.steps[mission.steps.length - 1];
  return {
    id, stages: mission.steps.map(step => step[0]), start: sceneId(0), scenes, authored: true,
    outcomes: {
      completed: {
        emoji: "🏅", head: `${title} · Misión completada`, score: 96, gains: { [skill]: 16 },
        strength: final[3], improve: final[6],
      },
    },
  };
}
