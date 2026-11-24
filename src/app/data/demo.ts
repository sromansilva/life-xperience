import type { User } from "../types";
import { reconcileProgress } from "../lib/progress";

export const SEED_USERS: User[] = [
  // XP matches the level under the single rule level = floor(xp/500)+1 (see lib/progress.ts)
  { id:"s1", name:"Alejandro", last:"Torres",  email:"alejandro@demo.com",  grade:"1°A", hairColor:"#2C1810", hairStyle:"A", skinTone:"#FDBCB4", shirtColor:"#6D28D9", pet:"🐶", level:7,  xp:3250, coins:340, streak:5,  role:"student" },
  { id:"s2", name:"Valentina", last:"Ruiz",    email:"valentina@demo.com",  grade:"1°A", hairColor:"#1A1A2E", hairStyle:"B", skinTone:"#D08B5B", shirtColor:"#DC2626", pet:"🐱", level:9,  xp:4200, coins:620, streak:12, role:"student" },
  { id:"s3", name:"Mateo",     last:"González",email:"mateo@demo.com",      grade:"1°B", hairColor:"#8B4513", hairStyle:"C", skinTone:"#AE8B6A", shirtColor:"#059669", pet:"🐸", level:5,  xp:2300, coins:210, streak:2,  role:"student" },
  { id:"s4", name:"Isabela",   last:"Moreno",  email:"isabela@demo.com",    grade:"1°A", hairColor:"#1A1A2E", hairStyle:"D", skinTone:"#614335", shirtColor:"#0284C7", pet:"🦄", level:11, xp:5250, coins:880, streak:21, role:"student" },
  { id:"s5", name:"Sebastián", last:"Vargas",  email:"sebastian@demo.com",  grade:"1°B", hairColor:"#FFD700", hairStyle:"A", skinTone:"#EDB98A", shirtColor:"#D97706", pet:"🦊", level:4,  xp:1700, coins:130, streak:1,  role:"student" },
  { id:"s6", name:"Camila",    last:"Jiménez", email:"camila@demo.com",     grade:"1°B", hairColor:"#DC143C", hairStyle:"B", skinTone:"#FDBCB4", shirtColor:"#BE185D", pet:"🐼", level:8,  xp:3600, coins:490, streak:9,  role:"student" },
  { id:"t1", name:"Ana",       last:"García",  email:"docente@demo.com",    grade:"",    hairColor:"#1A1A2E", hairStyle:"B", skinTone:"#EDB98A", shirtColor:"#0284C7", pet:"",   level:1,  xp:0,    coins:0,   streak:0,  role:"teacher", subject:"Ciencias Sociales", group:"1°A · 1°B" },
];

export const mkRadar = () => [
  { skill:"Comunicación", value:72 },{ skill:"Finanzas", value:45 },
  { skill:"Trabajo Eq.",  value:88 },{ skill:"Empatía",  value:60 },
  { skill:"Pensamiento",  value:55 },{ skill:"Creatividad", value:40 },
];

export const RADAR_DATA         = mkRadar();

export const RADAR_DATA_TEACHER = mkRadar();

export const TEACHER_DATA = [
  { name:"Alejandro T.", avatar:"s1", alert:false, com:72, lid:58, emp:64, pen:55, missions:14, streak:5,  level:7 },
  { name:"Valentina R.", avatar:"s2", alert:false, com:88, lid:74, emp:90, pen:70, missions:22, streak:12, level:9 },
  { name:"Mateo G.",     avatar:"s3", alert:true,  com:42, lid:30, emp:50, pen:38, missions:9,  streak:2,  level:5 },
  { name:"Isabela M.",   avatar:"s4", alert:false, com:95, lid:89, emp:82, pen:91, missions:31, streak:21, level:11 },
  { name:"Sebastián V.", avatar:"s5", alert:true,  com:35, lid:25, emp:42, pen:30, missions:6,  streak:1,  level:4 },
  { name:"Camila J.",    avatar:"s6", alert:false, com:78, lid:65, emp:80, pen:60, missions:19, streak:9,  level:8 },
];

export const BADGES = [
  { emoji:"🌟", icon:"star",   name:"Primera misión" },{ emoji:"🔥", icon:"flame", name:"Racha 5 días" },
  { emoji:"🏆", icon:"trophy", name:"Top 10 ranking" },{ emoji:"💡", icon:"bulb",  name:"Pensador crítico" },
  { emoji:"🎯", icon:"target", name:"Sin errores"    },{ emoji:"⚡", icon:"zap",   name:"Velocista"       },
];

export function reconcileUser(user: User): User {
  if (user.role !== "student") return user;
  const r = reconcileProgress(user.xp, user.level);
  return { ...user, xp:r.xp, level:r.level };
}

export function makePracticeUser(): User {
  return { id:"practice", name:"Estudiante", last:"de práctica", email:"practica@local", grade:"Vista docente",
    hairColor:"#1A1A2E", hairStyle:"C", skinTone:"#EDB98A", shirtColor:"#0E7490", pet:"🦉",
    level:1, xp:0, coins:0, streak:0, role:"student" };
}
