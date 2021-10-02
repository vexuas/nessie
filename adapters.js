const axios = require('axios');
const { apiKey } = require('./config/nessie.json');


exports.getCurrentMapRotations = async () => {
  try {
    const data = await axios.get(`https://api.mozambiquehe.re/maprotation?version=2&auth=${apiKey}`).then(response => {
      return response.data;
    })
    return data;
  } catch(e){
    console.log(e); //Maybe add special error handling
  }
}
