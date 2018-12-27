const debug = require('debug')(__filename.split('/').slice(-1).join())
const http = require('http')
const EventEmitter = require('eventemitter3')

var lineFeed = 10

class EventSource extends EventEmitter {
  constructor (url, eventSourceInitDict) {
    super()
    this.event = {}
    this.data = []
    debug('http.request %o', url)
    const req = http.request(url, res => {
      // res.setEncoding('utf8');
      debug('http.request callback running, status = %o', res.statusCode)
      let buf = Buffer(0)
      if (res.statusCode !== 200) {
        this.emit('error', new Event('error', {status: res.statusCode, message: res.statusMessage}))
        return // self.close()
      }
      res.on('data', chunk => {
        buf = Buffer.concat([buf, chunk], buf.length + chunk.length)
        const found = buf.indexOf(lineFeed)
        if (found >= 0) {
          const line = buf.toString('utf8', 0, found)
          this.gotLine(line)
          buf = buf.slice(found + 1)
        }
      })
    })
    debug('http.request returned %o', req)
    req.on('response', res => {
      debug('manual on-response')
    })
  }

  gotLine (line) {
    if (line.length > 0) {
      const found = line.indexOf(':')
      const key = line.slice(0, found)
      const arg = line.slice(found + 1)  // colon and space
      if (key === 'data') {
        this.data.push(arg)
      } else {
        this.event[key] = arg
      }
      return
    }
    const type = this.event['event']
    this.event.data = this.data.join('\n')
    if (type) {
      debug('emit %o %o', type, this.event)
      this.emit(type, this.event)
    }
    this.event = {}
    this.data = []
  }
}

module.exports = EventSource
