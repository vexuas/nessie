const axios = require('axios');
const { apiKey } = require('./config/nessie.json');

//Documentation on API: https://apexlegendsapi.com/documentation.php
const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${apiKey}`;
/**
 * Full example response 
 * {
 *  battle_royale:{rotation},
 *  arenas: {rotation},
 *  ranked: {brRanked},
 *  arenasRanked: {rotation}
 *  control: {rotation}
 * } 
 * where
 * rotation = {
 *  current: {
 *    start: 1633206600,
      end: 1633207500,
      readableDate_start: '2021-10-02 20:30:00',
      readableDate_end: '2021-10-02 20:45:00',
      map: 'Overflow',
      code: 'arenas_overflow',
      DurationInSecs: 900,
      DurationInMinutes: 15,
      asset: 'https://apexlegendsstatus.com/assets/maps/Arena_Overflow.png',
      remainingSecs: 637,
      remainingMins: 11,
      remainingTimer: '00:10:37'
 *  }
 *  next: {
 *    start: 1633207500,
      end: 1633208400,
      readableDate_start: '2021-10-02 20:45:00',
      readableDate_end: '2021-10-02 21:00:00',
      map: 'Dome',
      code: 'arenas_dome',
      DurationInSecs: 900,
      DurationInMinutes: 15
 *  }
 * }
 * And brRanked = {
    current: {
      start: 1649178000,
      end: 1652202000,
      readableDate_start: '2022-04-05 17:00:00',
      readableDate_end: '2022-05-10 17:00:00',
      map: 'Kings Canyon',
      code: 'kings_canyon_rotation',
      DurationInSecs: 3024000,
      DurationInMinutes: 50400,
      asset: 'https://apexlegendsstatus.com/assets/maps/Kings_Canyon.png',
      remainingSecs: 2197532,
      remainingMins: 36626,
      remainingTimer: '610:25:32'
    },
    next: { map: 'Unknown' }
}
 */

exports.getBattleRoyalePubs = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data.battle_royale;
  });
  console.log(data);
  return data;
};
exports.getBattleRoyaleRanked = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data.ranked;
  });
  console.log(data);
  return data;
};
exports.getArenasPubs = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data.arenas;
  });
  console.log(data);
  return data;
};
exports.getArenasRanked = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data.arenasRanked;
  });
  console.log(data);
  return data;
};
exports.getControlPubs = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data.control;
  });
  console.log(data);
  return data;
};
exports.getRotationData = async () => {
  const data = await axios.get(url).then((response) => {
    return response.data;
  });
  // console.log(data);
  return data;
};
