import type { Reward } from "./lib/progress";
import type { HintRecord } from "./lib/orion";
import type { ChoiceQuality, SceneChoice, MissionOutcome } from "./data/comMission";

export interface GenCase {
  id:string; title:string; objective:string; scenario:string;
  questions:string[]; evaluation:string; tips:string;
  worldId:string; worldName:string; worldEmoji:string;
  difficulty:string; targetId:string; targetName:string;
  xp:number; duration:string; createdAt:string;
}

export type AuthStep = "splash"|"role"|"login-s"|"login-t"|"reg-role"|"reg-s"|"reg-t";

export type AppScreen = "home"|"map"|"skill"|"sim"|"results"|"dash"|"avatar"|"orion"|"teacher";

export interface User {
  id:string; name:string; last:string; email:string; grade:string;
  hairColor:string; hairStyle:string; skinTone:string; shirtColor:string; pet:string;
  level:number; xp:number; coins:number; streak:number; role:"student"|"teacher";
  subject?:string; group?:string;
}

export type MissionDiff = "Básico" | "Intermedio" | "Avanzado";

export interface MissionItem { id:string; emoji:string; title:string; desc:string; dur:string; diff:MissionDiff; xp:number; img:string; }

export type SimPhase = "intro"|"narrate"|"dialogue"|"choices"|"consequence"|"chosen"|"result";

export type ScenePlayback = "idle"|"playing"|"paused"|"complete";

export interface Decision { sceneId:string; choiceId:string; quality:ChoiceQuality; text:string; at:number }

export interface MissionRun {
  worldId:string; missionId:string;
  sceneId:string; phase:SimPhase; path:string|null;
  decisions:Decision[]; hints:HintRecord[];
  lastChoice:SceneChoice|null;
  bonusXP:number; lastBonus:number;
  orionOpen:boolean; reread:boolean; supportRequested:boolean;
}

export type DoneMap = Record<string,{ score:number; xp:number; path:string }>;

export interface MissionResult extends Reward {
  missionId:string; missionTitle:string; missionEmoji:string; worldId:string;
  outcome:MissionOutcome; score:number; negatives:number; hintsUsed:number;
  coinsTotal:number; practice:boolean;
}
