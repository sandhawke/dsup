const debug = require('debug')(__filename.split('/').slice(-1).join())
const LinkHeader = require('http-link-header')
const AbortController = require('abort-controller')
const EventEmitter = require('eventemitter3')
const WatchableSet = require('./watchable-set')
const fetch = require('node-fetch')
const jsonlines = require('./jsonlines')
const url = require('url')
let EventSource
if (typeof window === 'undefined') {
  EventSource = require('./eventsource')  // MINE, not the npm package
} else {
  EventSource = window.EventSource
}


const linkrel = 'https://sandhawke.github.io/dsup'

class Client extends EventEmitter {
  constructor (url, options = { format: jsonlines }) {
    super()
    this.url = url
    Object.assign(this, options)
    if (!this.data) this.data = new WatchableSet()
    this.start()
  }

  async start () {
    this.controller = new AbortController()
    debug('fetching')
    if (typeof window === 'undefined') {
      const res = await fetch(this.url, { signal: this.controller.signal })
      debug('.. resolved')
      debug('res: %O', res)
      debug('headers: %O', res.headers)
      const linkHeader = res.headers.get('link')
      this.withResponse(res, linkHeader)
    } else {
      var req = new XMLHttpRequest();
      req.open('head', this.url)
      req.setRequestHeader('Access-Control-Allow-Headers', 'Link')
      const that = this
      req.onload = function () {
        const res = this
        debug('.. resolved')
        debug('res: %O', res)
        debug('headers: %O', res.getAllResponseHeaders())
        const linkHeader = res.getResponseHeader('link')
        that.withResponse(this, linkHeader)
      }
      req.send()
    }
  }

  withResponse (res, linkHeader) {
    if (linkHeader) {
      const links = LinkHeader.parse(linkHeader)
      if (links.has('rel', linkrel)) {
        const relURL = links.get('rel', linkrel)[0].uri
        debug({relURL, base: this.url})
        const streamURL = url.resolve(this.url, relURL)
        debug('%o', { streamURL })
        debug('KEYS %o', Object.keys(res))
        debug('closing')
        this.controller.abort()
        this.stream(streamURL)
        return
      }
    } else {
      debug('no link header')
    }

    debug('reading body')
    const parser = new this.format.Parser()
    const buff = new Set()
    parser.on('data', item => buff.add(item))
    parser.on('end', () => {
      // bring this.data into sync with what we learned from buff
      const diff = this.diff(this.data, buff)
      for (const item of diff.add) this.data.add(item)
      for (const item of diff.remove) this.data.delete(item)

      // better start polling...
      setTimeout(() => { this.start() }, 100)
    })
    res.body.pipe(parser)

    res.body.on('data', text => {
      // buffer up the text until a newline,
    })
  }

  idCheck (event) {
    if (event.id) {
      if (event.id !== this.data.etag) {
        console.error({event, etag: this.data.etag})
        throw Error('mismatch between event.id and dataset.etag')
      }
      debug('wow, event id matches!', event.id)
    }
  }
  
  stream (url) {
    debug('Calling EventSource on', url)
    console.log('Calling EventSource on', url)
    const source = new EventSource(url)
    this.source = source
    source.addEventListener('add', event => {
      debug('msg=add %o', event)
      for (const item of this.format.parse(event.data)) {
        this.data.add(item)
        this.idCheck(event)
      }
    })
    source.addEventListener('remove', event => {
      debug('msg=remove %o', event)
      for (const item of this.format.parse(event.data)) {
        const obj = this.data.getMatch(item, this.format.stringify)
        if (obj) { 
          this.data.delete(obj)
          this.idCheck(event)
        } else {
          console.error('WARNING2: deleting thing not found: ' + JSON.stringify(event))
        }
      }
      // NO, we need to use the serialization!
      // I guess WatchableSet needs to be SerializedWatchableSet ?
      //    -- but kb can handle this, actually
      //    -- deleteMatching == uses deep equal, or serialization
      // this.data.delete(item)
    })
    source.addEventListener('remove-all', event => {
      this.data.clear()
      this.idCheck(event)
    })
  }

  close () {
    // ...
  }

  keyMap (s) {
    const out = new Map()
    for (const item of s) {
      out.set(this.format.stringify(item), item)
    }
    return out
  }

  /**
   * Computer the set difference, but compare the serializations of
   * the objects rather than the pointers.  Slower, but should still
   * be close to linear time.
   */
  diff (from, to) {
    const add = new Set()
    const remove = new Set()
    const fmap = this.keyMap(from)
    const tmap = this.keyMap(to)
    for (const [key, val] of fmap.entries()) {
      if (!tmap.has(key)) remove.add(val)
    }
    for (const [key, val] of tmap.entries()) {
      if (!fmap.has(key)) add.add(val)
    }
    return { add, remove }
  }
}

module.exports = Client
