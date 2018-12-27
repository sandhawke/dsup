/*
  I was using npm package eventsource and getting bizarre bugs, where
  res.on('data', ...) was providing the same 9 events repeating.  It
  was baffling.  I wrote this, which works for my purposes.  

  Doesn't currently do various EventSource stuff I don't need, like
  reconnecting.
*/

const debug = require('debug')(__filename.split('/').slice(-1).join())
const http = require('http')
const https = require('https')
const EventEmitter = require('eventemitter3')
const {parse} = require('url')

class EventSource extends EventEmitter {
  constructor (url, eventSourceInitDict) {
    super()

    this.event = {}
    this.data = []

    const options = parse(url)
    let hModule = http
    if (options.protocol === 'https:') hModule = https

    options.headers = {}
    options.headers['Accept'] = 'text/event-stream',
    options.headers['Cache-Control'] = 'no-cache'
    // if (lastEventId) options.headers['Last-Event-ID'] = lastEventId

    debug('http.request %o', options)
    const req = hModule.request(options, res => {
      debug('http.request callback running, status = %o', res.statusCode)
      if (res.statusCode !== 200) {
        console.error('error', {status: res.statusCode, message: res.statusMessage})
        this.emit('error', new Event('error', {status: res.statusCode, message: res.statusMessage}))
        return // self.close()
      }

      res.setEncoding('utf8');
      let buf = ''

      res.on('data', chunk => {
        buf = buf + chunk
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) this.gotLine(line)
      })
    })
    debug('http.request returned %o', req)
    req.on('response', res => {
      debug('manual on-response')
    })
    req.on('error', e => {
      console.error('req.onEerror: ', e)
    })
    req.end()  // never forget this!  :-)
  }

  gotLine (line) {
    if (line.length > 0) {
      const m = line.match(/^(.*?): ?(.*)/)
      if (m) {
        const key = m[1]
        const arg = m[2]
        // const found = line.indexOf(':')
        // const key = line.slice(0, found)
        // const arg = line.slice(found + 2)  // colon and space
        if (key === 'data') {
          this.data.push(arg)
        } else {
          this.event[key] = arg
        }
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
