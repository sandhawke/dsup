const debug = require('debug')(__filename.split('/').slice(-1).join())
const appmgr = require('appmgr')
const LinkHeader = require('http-link-header')
const delay = require('delay')
const WatchableSet = require('./watchable-set')
const jsonlines = require('./jsonlines')

const linkrel = 'https://sandhawke.github.io/dsup'
let streamNumbers = 0

class Server {
  constructor (options) {
    this.m = appmgr.create(options)
    Object.assign(this, options)

    // just for testing...
    this.m.app.get('/wait', async (req, res) => {
      const streamURL = 'foo'
      var links = new LinkHeader()
      links.set({ rel: linkrel, uri: streamURL })
      links.set({ rel: 'x' + linkrel, uri: streamURL })
      res.setHeader('Link', links)
      res.writeHead(200)
      for (let x = 0; x < 10; x++) {
        res.write('count = ' + x + '\n')
        await delay(1000)
      }
      res.end()
    })
  }

  async start () {
    await this.m.start()
    this.siteurl = this.m.siteurl
  }

  async stop () {
    return this.m.stop()
  }

  addResource (url, options = {}) {
    const format = options.format || jsonlines
    debug('format = %o', format)
    const set = options.data || new WatchableSet()
    const streamURL = url + '.dsup'
    this.m.app.get(streamURL, (req, res) => {
      let onClose = []
      const rememberToRemove = (event, f) => {
        onClose.push(() => { set.removeListener(event, f) })
      }
      const streamNumber = ++streamNumbers
      debug('stream open %d', streamNumber)
      req.on('close', () => {
        debug('stream CLOSED by client %d', streamNumber)
        onClose.forEach(x => x())
      })
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      })
      let f

      f = () => {
        debug('during clear, stream %d', streamNumber)
        res.write('event: remove-all\n\n')
      }
      set.on('clear', f)
      rememberToRemove('clear', f)
      f()
      
      f = item => {
        debug('during add %o, stream %d', item, streamNumber)
        res.write('event: add\ndata: ' + format.stringify(item).replace('\n', '\ndata: ') + '\n\n')
      }
      set.on('add', f)
      rememberToRemove('add', f)
      for (const i of set) f(i)
                   
      f = item => {
        debug('during remove %o, stream %d', item, streamNumber)
        const out = res.write('event: remove\ndata: ' + format.stringify(item).replace('\n', '\ndata: ') + '\n\n')
        debug('.. write returned', out)
      }
      set.on('delete', f)
      rememberToRemove('delete', f)                  
    })
    this.m.app.get(url, (req, res) => {
      var links = new LinkHeader()
      links.set({ rel: linkrel, uri: streamURL })
      res.set('Link', links)
      res.writeHead(200)
      const stringifier = new format.Stringifier()
      stringifier.pipe(res)
      for (const i of set) stringifier.write(i)
      stringifier.end()
    })
    return set
  }
}

module.exports = { Server }

// link.set({ rel: 'next', uri: 'http://example.com/next' })
// link.toString()
/*
var link = new LinkHeader()
link.parse( '<example.com>; rel="example"; title="Example Website"' )
link.parse( '<example-01.com>; rel="alternate"; title="Alternate Example Domain"' )
*/
