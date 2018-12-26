const dsup = require('./server')
const delay = require('delay')

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
  // timer(0)

  async function timer(ms) {
    const set = server.addResource(`/time-${ms}.json`, JSON)
    set.add({ hello: `This is a timer resource, updating every %{ms}ms.` })
    let count = 0

    /*
    while (true) {
      const timeObj = {
        time: (new Date()).toISOString(),
        hrtime: process.hrtime.bigint().toString(),
        count: count++
      }
      set.add(timeObj)
      if (ms) {
        await delay(ms)
      } // else ... inf loop?
      set.delete(timeObj)
    }
    */

    let timeObj
    function loop () {
      if (timeObj) set.delete(timeObj)
      timeObj = {
        time: (new Date()).toISOString(),
        hrtime: process.hrtime.bigint().toString(),
        count: count++
      }
      set.add(timeObj)
      if (ms) {
        setTimeout(loop, ms)
      } else {
        setImmediate(loop)
      }
    }
    loop()
  }
}

run()
