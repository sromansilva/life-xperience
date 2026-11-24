import { P } from "../theme";

export const CONFETTI_COLORS = [P.v3,P.a3,P.g3,P.r3,P.c3,P.p3];

export const CONFETTI = Array.from({ length:60 }, (_,i) => ({
  left:`${((i*7+3)*13)%100}%`, delay:`${(i*.042)%2}s`,
  dur:`${1.1+(i*.031)%1.4}s`, color:CONFETTI_COLORS[i%6],
  size:5+(i%7), rot:(i*37)%360,
}));

export const STARS = Array.from({ length:50 }, (_,i) => ({
  top:`${((i*11+7)*19)%100}%`, left:`${((i*13+3)*17)%100}%`,
  sz:1+(i%3), op:.05+((i*7)%20)/100, d:`${(i*.3)%4}s`, dur:`${2+(i*.18)%3}s`,
}));
