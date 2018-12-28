const debug = require('debug')(__filename.split('/').slice(-1).join())
const appmgr = require('appmgr')
const LinkHeader = require('http-link-header')
const delay = require('delay')
const KeyedSet = require('keyed-set')
const jsonlines = require('./jsonlines')
const handleStream = require('./stream')
var cors = require('cors')

const linkrel = 'https://sandhawke.github.io/dsup'

class Server {
  constructor (options) {
    this.m = appmgr.create(options)
    Object.assign(this, options)

    const corsHandler = cors({
      exposedHeaders: 'Link',
      allowedHeaders: 'Link'
    })
    this.m.app.use(corsHandler)
    this.m.app.options('/', corsHandler)

    this.m.app.get('/', (req, res) => {
      res.send('<html><body>Try <a href="static/demo">demo</a>')
    })
    
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
    const set = options.dataset || new KeyedSet()
    const stringify = options.dataset.stringify ||
          options.stringify ||
          JSON.stringify
    const streamURL = url + '.dsup'
    this.m.app.get(streamURL, (req, res) => {
      setCors(res)
      handleStream(set, format, req, res)
    })
    const setCors = (res) => {
      return
      res.set('Access-Control-Allow-Origin', '*')
      res.set('Access-Control-Allow-Credentials', 'true')
      res.set('Access-Control-Allow-Headers', 'Link')
      res.set('Access-Control-Expose-Headers', 'Link')
    }
    const sendHead = (res) => {
      var links = new LinkHeader()
      links.set({ rel: linkrel, uri: streamURL })
      res.set('Link', links)
      if (set.etag) res.set('ETag', set.etag)
      setCors(res)
      res.writeHead(200)
    }
    this.m.app.head(url, (req, res) => {
      sendHead(res)
      res.end()
    })
    this.m.app.get(url, (req, res) => {
      sendHead(res)

      res.write(stringify([...set]))
      res.write('\n')
      res.end()
      /*
      const stringifier = new format.Stringifier()
      stringifier.pipe(res)
      for (const i of set) stringifier.write(i)
      stringifier.end()
      */
    })
    // patch, someday  :-)
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
