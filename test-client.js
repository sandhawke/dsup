const debug = require('debug')(__filename.split('/').slice(-1).join())
const Client = require('./client')

async function main () {
  const client = new Client('http://localhost:8080/time-0.json')
  client.dataset.on('change', change => { console.log(change) })
}

main()
