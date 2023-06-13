import axios from 'axios';
import { ALS_API_KEY } from '../config/environment';

//Documentation on API: https://apexlegendsapi.com/documentation.php
const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${ALS_API_KEY}`;

//TODO: Add schema for ALS responses
exports.getBattleRoyalePubs = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.battle_royale;
  });
  console.log(data);
  return data;
};
exports.getBattleRoyaleRanked = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.ranked;
  });
  console.log(data);
  return data;
};
exports.getArenasPubs = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.arenas;
  });
  console.log(data);
  return data;
};
exports.getArenasRanked = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.arenasRanked;
  });
  console.log(data);
  return data;
};
exports.getControlPubs = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.control;
  });
  console.log(data);
  return data;
};
exports.getLimitedTimeEvent = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data.ltm;
  });
  console.log(data);
  return data;
};
exports.getRotationData = async () => {
  const data = await axios.get(url).then((response: any) => {
    return response.data;
  });
  console.log(data);
  return data;
};
