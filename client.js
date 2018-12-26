const debug = require('debug')(__filename.split('/').slice(-1).join())
const LinkHeader = require('http-link-header')
const AbortController = require('abort-controller')
const EventEmitter = require('eventemitter3')
const WatchableSet = require('./watchable-set')
const fetch = require('node-fetch')
const delay = require('delay')
const stream = require('stream')
const jsonlines = require('./jsonlines')

const linkrel = 'https://sandhawke.github.io/dsup'

class Client extends EventEmitter {
  constructor (url, options = {format: jsonlines}) {
    super()
    this.url = url
    Object.assign(this, options)
    if (!this.data) this.data = new WatchableSet()
    this.start()
  }

  async start () {
    this.controller = new AbortController()
    debug('fetching')
    const res = await fetch(this.url, { signal: this.controller.signal })
    debug('.. resolved')
    debug('res: %O', res)
    debug('headers: %O', res.headers)
    const linkHeader = res.headers.get('link')
    if (false && linkHeader) {
      const links = LinkHeader.parse(linkHeader)
      if (links.has('rel', linkrel)) {
        const streamURL = links.get('rel', linkrel)
        debug('%o', {streamURL})
        debug('KEYS %o', Object.keys(res))
        debug('closing')
        this.controller.abort()
        this.stream()
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
      setTimeout(() => {this.start()}, 100)
    })
    res.body.pipe(parser)


    res.body.on('data', text => {
      // buffer up the text until a newline, 
    })
  }

  stream (url) {
    debug('stream from', url)
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
    const add = new Set
    const remove = new Set()
    const fmap = this.keyMap(from)
    const tmap = this.keyMap(to)
    for (const [key, val] of fmap.entries()) {
      if (!tmap.has(key)) remove.add(val)
    }
    for (const [key, val] of tmap.entries()) {
      if (!fmap.has(key)) add.add(val)
    }
    return {add, remove}
  }
}

module.exports = Client
