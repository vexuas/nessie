import axios from 'axios';
import got from 'got';
import { ALS_API_KEY } from '../config/environment';

//Documentation on API: https://apexlegendsapi.com/documentation.php
const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${ALS_API_KEY}`;

//TODO: Add schema for ALS responses
export async function getRotationData(): Promise<any> {
  const response: string = (await got.get(url)).body;
  return JSON.parse(response);
}
export const getBattleRoyalePubs = async () => {
  const response = await getRotationData();
  return response.battle_royale;
};
export const getBattleRoyaleRanked = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.ranked;
  });
  console.log(data);
  return data;
};
export const getArenasPubs = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.arenas;
  });
  console.log(data);
  return data;
};
export const getArenasRanked = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.arenasRanked;
  });
  console.log(data);
  return data;
};
export const getControlPubs = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.control;
  });
  console.log(data);
  return data;
};
export const getLimitedTimeEvent = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.ltm;
  });
  console.log(data);
  return data;
};
