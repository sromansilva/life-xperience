import { P } from "../theme";
import type { MissionItem } from "../types";
import { COM1_SCRIPT, type MissionScript } from "./comMission";
import { createMissionScript } from "./missionCases";

export const WORLDS = [
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

export const WORLD_DESC: Record<string,string> = {
  com:"Expresa tus ideas, escucha y resuelve conflictos.", fin:"Administra tu dinero y enfrenta imprevistos.",
  tea:"Coordina, reparte roles y logra metas en grupo.", emo:"Reconoce y regula tus emociones.",
  lid:"Inspira y guía a otros en momentos clave.", pen:"Analiza información y separa hechos de opiniones.",
  cre:"Convierte ideas en propuestas originales.", inn:"Crea soluciones para problemas reales.",
  dig:"Protege tu información y comunícate en línea.", emp:"Diseña y presenta tu primer proyecto.",
  tie:"Organiza tus tareas y prioridades.", pro:"Resuelve casos con método, paso a paso.",
};

export const I = {
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

export const WORLD_MISSIONS: Record<string, MissionItem[]> = {
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

export const MISSION_SCRIPTS = new Map(WORLDS.flatMap(world =>
  (WORLD_MISSIONS[world.id] ?? []).map(mission => [
    mission.id,
    mission.id === COM1_SCRIPT.id ? COM1_SCRIPT : createMissionScript(mission.id, mission.title, world.name),
  ] as const),
));

export function getScript(missionId: string): MissionScript {
  const script = MISSION_SCRIPTS.get(missionId);
  if (!script) throw new Error(`No se encontró el guion de ${missionId}`);
  return script;
}

export function findMission(worldId:string, missionId:string): MissionItem|null {
  return (WORLD_MISSIONS[worldId] ?? []).find(m=>m.id===missionId) ?? null;
}
