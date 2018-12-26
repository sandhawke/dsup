const dsup = require('./server')
const delay = require('delay')

const run = async () => {
  const server = new dsup.Server()
  await server.start()
  console.log(`Try:
curl ${server.siteurl}/time1000.json
curl ${server.siteurl}/time1000.json.dsup
`)
  const set1000 = server.addResource('/time1000.json', JSON)
  set1000.add({ hello: 'Hello, World!' })

  while (true) {
    const timeObj = {
      time: (new Date()).toISOString()
    }
    set1000.add(timeObj)
    await delay(1)
    set1000.delete(timeObj)
  }
}

run()
