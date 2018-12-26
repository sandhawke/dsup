const debug = require('debug')(__filename.split('/').slice(-1).join())
const Client = require('./client')

async function main () {
  const client = new Client('http://localhost:8080/time1000.json')
  client.data.on('add', item => {
    debug.log('added %o, now d=%o', item, [...client.data])
  })
  client.data.on('delete', item => {
    debug.log('deleted %o, now d=%o', item, [...client.data])
  })
}

main()
