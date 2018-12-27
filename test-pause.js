const debug = require('debug')(__filename.split('/').slice(-1).join())
const Client = require('./client')

const pauseAfter = 1000
const resumeAfter = 1000

async function main () {
  const client = new Client('http://localhost:8080/time-0.json')
  client.data.on('add', item => {
    // debug('added %o, now d=%o', item, [...client.data])
  })
  client.data.on('delete', item => {
    // debug('deleted %o, now d=%o', item, [...client.data])
  })

  const pause = () => {
    // requires MY eventsource implementation
    if (client.source && client.source.response) {
      debug('pausing')
      client.source.response.pause()
    } else {
      debug('no client.source.response yet')
    }
    setTimeout(resume, resumeAfter)
  }
  const resume = () => {
    // requires MY eventsource implementation
    if (client.source && client.source.response) {
      debug('resuming')
      client.source.response.resume()
    } else {
      debug('no client.source.response yet')
    }
    setTimeout(pause, pauseAfter)
  }

  resume()
}

main()
