const dsup = require('./server')
const delay = require('delay')
const Demoset = require('./demoset')

let zcounter = 0

const run = async () => {
  const server = new dsup.Server()
  await server.start()
  console.log(`Try:
curl -v ${server.siteurl}/time-1000.json
curl ${server.siteurl}/time-1000.json.dsup
curl ${server.siteurl}/time-100.json.dsup
curl ${server.siteurl}/time-10.json.dsup
curl ${server.siteurl}/time-1.json.dsup
`)
  timer(1000)
  timer(100)
  timer(10)
  timer(1)
  // timer(0) // start this at some URL then redirect; shut off after a while?

  async function timer(ms) {
    const set = server.addResource(`/time-${ms}.json`, {
      dataset: new Demoset()
    })
    set.add({ hello: `This is a timer resource, updating every ${ms}ms.`,
              _id32: 0x12345678 + (1 << 31)})
    let count = 0

    let timeObj
    function loop () {
      if (timeObj) set.delete(timeObj)
      const now = (new Date()).toISOString()
      // if (ms === 1000) console.log(now)
      timeObj = {
        time: now,
        hrtime: process.hrtime.bigint().toString(),
        count: count++,
        _id32: randomInt32()

      }
      set.add(timeObj)
      if (ms) {
        setTimeout(loop, ms)
      } else {
        zcounter = count
        setImmediate(loop)
      }
    }
    loop()
  }
}

function randomInt32 () {
  return Math.round(Math.random() * 0xffffffff) + (1 << 31)
}

let oz=0
setInterval(() => {
  // console.log('zcounter=%d, timer-0 counting %s/s', zcounter, zcounter-oz)
  oz = zcounter
}, 1000)

run()
