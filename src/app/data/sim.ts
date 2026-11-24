import type { SimPhase } from "../types";

export const PHASE_LABEL: Record<SimPhase,string> = {
  intro:"Antes de empezar", narrate:"Situación", dialogue:"Diálogo",
  choices:"Tu decisión", consequence:"Consecuencia", chosen:"Reacción", result:"Resultado",
};

export const BONUS_SECONDS = 10;

export const BONUS_XP = 15;
