const debug = require('debug')(__filename.split('/').slice(-1).join())
const http = require('http')
const https = require('https')

const url = 'http://127.0.0.1:8080/time-1.json'

console.log('requesting', url)
const req = http.request(url, res => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end()
console.log('request made')


