const debug = require('debug')(__filename.split('/').slice(-1).join())
const Client = require('./client')
const delay = require('delay')

let adds = 0
let sum = 0
let count = 0

async function main () {
  const client = new Client('http://127.0.0.1:8080/time-0.json')
  client.data.on('add', item => {
    debug('added %o, now d=%o', item, [...client.data])
    if (item.count !== count) {
      console.log('skipping', item.count - count)
      // console.log('adjusting count from %d to %d', count, item.count)
      count = item.count
    }
    count++
    if (item.hrtime) {
      // const sent = BigInt(item.hrtime)
      // const now = process.hrtime.bigint() 
      const sent = new Date(item.time)
      const now = new Date()
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
    // console.log(`${Math.round(1000*adds/loopTime)} adds/sec, t=${loopTime}ms lag=${Math.round(sum/adds/1000)/1000}ms, count=${count}`)
    console.log(`${Math.round(1000*adds/loopTime)} adds/sec (${loopTime}ms) clock-skew=${Math.round(10*sum/adds)/10}ms, object-counter=${count}`)
    adds = 0
    sum = 0
    // be slow!
    // for (let x = 0; x < 10000000000; x++) { }
  }
}

stat()
main()
