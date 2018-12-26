const debug = require('debug')(__filename.split('/').slice(-1).join())
const Client = require('./client')
const delay = require('delay')

let adds = 0
let sum = 0
let count = 0

async function main () {
  const client = new Client('http://localhost:8080/time-1.json')
  client.data.on('add', item => {
    debug('added %o, now d=%o', item, [...client.data])
    if (item.count !== count) {
      console.log('adjusting count from %d to %d', count, item.count)
      count = item.count
    }
    count++
    if (item.hrtime) {
      const sent = BigInt(item.hrtime)
      const now = process.hrtime.bigint()
      const diff = now - sent
      sum += Number(diff)
      // console.log(' - ', diff)
      adds++
    } else {
      console.log('unexpected item', item)
    }
  })
}

async function stat () {
  let start = new Date()
  while (true) {
    await delay(1000)
    const now = new Date()
    const loopTime = now - start
    start = now
    console.log(`${Math.round(1000*adds/loopTime)} adds/sec, lag=${Math.round(sum/adds/1000)/1000}ms, count=${count}`)
    adds = 0
    sum = 0
  }
}

stat()
main()
