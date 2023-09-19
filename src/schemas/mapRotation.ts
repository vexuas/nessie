export interface MapRotationAPIObject {
  battle_royale: MapRotationBattleRoyaleSchema;
  arenas: MapRotationArenasSchema;
  ranked: MapRotationRankedSchema;
  arenasRanked: MapRotationArenasRankedSchema;
  ltm: MapRotationMixtapeSchema;
}
interface MapRotationCurrentSchema {
  start: number;
  end: number;
  readableDate_start: string;
  readableDate_end: string;
  map: string;
  code: string;
  DurationInSecs: number;
  DurationInMinutes: number;
  asset: string;
  remainingSecs: number;
  remainingMins: number;
  remainingTimer: string;
}
interface MapRotationNextSchema {
  start: number;
  end: number;
  readableDate_start: string;
  readableDate_end: string;
  map: string;
  code: string;
  DurationInSecs: number;
  DurationInMinutes: number;
  asset: string;
}
interface MapRotationMixtapeCurrentSchema extends MapRotationCurrentSchema {
  isActive: boolean;
  eventName: string;
}
interface MapRotationMixtapeNextSchema extends MapRotationNextSchema {
  isActive: boolean;
  eventName: string;
}
export interface MapRotationBattleRoyaleSchema {
  current: MapRotationCurrentSchema;
  next: MapRotationNextSchema;
}
export interface MapRotationArenasSchema {
  current: MapRotationCurrentSchema;
  next: MapRotationNextSchema;
}
export interface MapRotationRankedSchema {
  current: MapRotationCurrentSchema;
  next?: MapRotationNextSchema;
}
export interface MapRotationArenasRankedSchema {
  current: MapRotationCurrentSchema;
  next?: MapRotationNextSchema;
}
export interface MapRotationMixtapeSchema {
  current: MapRotationMixtapeCurrentSchema;
  next: MapRotationMixtapeNextSchema;
}
