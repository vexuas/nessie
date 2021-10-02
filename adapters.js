const https = require('https');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');
const { apiKey } = require('./config/nessie.json');


exports.getCurrentMapRotations = () => {
  let data = '';
  const options = {
    hostname: 'api.mozambiquehe.re',
    path: `/maprotation?version=2&auth=${apiKey}`,
    method: 'GET'
  }
  const req = https.request(options, response => {
    response.on('data', chunk => {
      data += chunk
    })
    response.on('end', () => {
     console.log(JSON.parse(data));
    })
  })
  req.end();
}
