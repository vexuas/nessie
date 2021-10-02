const axios = require('axios');
const { apiKey } = require('./config/nessie.json');

const url = `https://api.mozambiquehe.re/maprotation?version=2&auth=${apiKey}`

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
