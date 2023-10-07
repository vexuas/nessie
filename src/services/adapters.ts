import got from 'got';
import { ALS_API_KEY } from '../config/environment';
import {
  MapRotationAPIObject,
  MapRotationArenasRankedSchema,
  MapRotationArenasSchema,
  MapRotationBattleRoyaleSchema,
  MapRotationMixtapeSchema,
  MapRotationRankedSchema,
} from '../schemas/mapRotation';
import { SeasonAPISchema } from '../schemas/season';
import { sendErrorLog } from '../utils/helpers';

//Documentation on API: https://apexlegendsapi.com/documentation.php
const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${ALS_API_KEY}`;
//Less publicly known api to retrieve season data; kudos to @SDCore
//No authentication + rate limited so we should be mindful in using this
const seasonUrl = 'https://api.jumpmaster.xyz/seasons/Current';

export async function getRotationData(): Promise<MapRotationAPIObject> {
  const response: string = (await got.get(url)).body;
  return JSON.parse(response);
}
export async function getSeasonInformation(): Promise<SeasonAPISchema | null> {
  try {
    const response: string = (await got.get(seasonUrl)).body;
    return JSON.parse(response);
  } catch (error) {
    sendErrorLog({ error });
    return null;
  }
}

export async function getBattleRoyalePubs(): Promise<MapRotationBattleRoyaleSchema> {
  const response = await getRotationData();
  return response.battle_royale;
}
export async function getBattleRoyaleRanked(): Promise<MapRotationRankedSchema> {
  const response = await getRotationData();
  return response.ranked;
}
export async function getArenasPubs(): Promise<MapRotationArenasSchema> {
  const response = await getRotationData();
  return response.arenas;
}
export async function getArenasRanked(): Promise<MapRotationArenasRankedSchema> {
  const response = await getRotationData();
  return response.arenasRanked;
}
export async function getMixtape(): Promise<MapRotationMixtapeSchema> {
  const response = await getRotationData();
  return response.ltm;
}
