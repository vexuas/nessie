const axios = require('axios');
const { apiKey } = require('./config/nessie.json');

//Documentation on API: https://apexlegendsapi.com/documentation.php
const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${apiKey}`
/**
 * Full example response 
 * {
 *  battle_royale:{rotation},
 *  arenas: {rotation},
 *  ranked: {brRanked},
 *  arenasRanked: {rotation}
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
 *  current: {
      map: 'Kings Canyon',
      asset: 'https://apexlegendsstatus.com/assets/maps/Kings_Canyon.png'
    },
    next: { map: 'Olympus' }
 * }
 */

exports.getBattleRoyalePubs = async () => {
  const data = await axios.get(url).then(response => {
    return response.data.battle_royale;
  })
  return data;
}
exports.getBattleRoyaleRanked = async () => {
  const data = await axios.get(url).then(response => {
    return response.data.ranked;
  })
  return data;
}
exports.getArenasPubs = async () => {
  const data = await axios.get(url).then(response => {
    return response.data.arenas;
  })
  return data;
}
exports.getArenasRanked = async () => {
  const data = await axios.get(url).then(response => {
    return response.data.arenasRanked;
  })
  return data;
}
