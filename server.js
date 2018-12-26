const appmgr = require('appmgr')
const LinkHeader = require('http-link-header')
const delay = require('delay')
const WatchableSet = require('./watchable-set')
const jsonlines = require('./jsonlines')

const linkrel = 'https://sandhawke.github.io/dsup'

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
      for (let x = 0; x<10; x++) {
        res.write('count = ' + x + '\n')
        await delay(1000)
      }
      res.end()
    })
  }

  async start () {
    await this.m.start()
    this.siteurl = this.m.siteurl
    return
  }

  async stop () {
    return await this.m.stop()
  }

  addResource(url, options = {}) {
    const format = options.format || jsonlines
    const set = options.data || new WatchableSet()
    const streamURL = url + '.dsup'
    this.m.app.get(streamURL, (req, res) => {
      res.send('not implemented')
    })
    this.m.app.get(url, (req, res) => {
      var links = new LinkHeader()
      links.set({ rel: linkrel, uri: streamURL })
      links.set({ rel: 'x' + linkrel, uri: streamURL })
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
