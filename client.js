const debug = require('debug')(__filename.split('/').slice(-1).join())
//const request = require('./request')  // MINE
const axios = require('axios')
const LinkHeader = require('http-link-header')
const EventEmitter = require('eventemitter3')
const KeyedSet = require('keyed-set')
const URL = require('url')
const linkrels = require('./linkrel')
const delay = require('delay')

let EventSource
if (typeof window === 'undefined') {
  EventSource = require('./eventsource')  // MINE, not the npm package
} else {
  EventSource = window.EventSource
}

const linkrel = 'https://sandhawke.github.io/dsup'

class Client extends EventEmitter {
  constructor (url, options) {
    super()
    this.url = url
    Object.assign(this, options)
    if (!this.dataset) this.dataset = new KeyedSet()
    this.start()
  }

  async start () {
    debug('fetching')
    const res = await axios.get(this.url, { responseType: 'text' })   // stream?
    this.streamURL = this.findStreamURL(res.headers.link)
    console.log('etag', res.headers.etag)
    console.log('last-modified', res.headers['last-modified'])

    // console.log(typeof res.data, res.data)
    const recd = new KeyedSet(res.data)
    const diff = this.dataset.diff(recd)
    this.dataset.changeAll(diff) // rename to patch?

    if (this.streamURL) {
      this.stream(this.streamURL)
    } else {
      console.log('no webdup link, will have to poll')
      await delay(1)
      this.start()
    }
    
    /*
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
    res.data.pipe(parser)
    */
  }

  idCheck (event) {
    if (event.id && this.dataset.etag) {
      if (event.id !== this.dataset.etag) {
        console.error({event, etag: this.dataset.etag})
        throw Error('mismatch between event.id and dataset.etag')
      }
      debug('wow, event id matches!', event.id)
    }
  }
  
  stream (url) {
    // query parms
    
    console.log('Calling EventSource on', url)
    const source = new EventSource(url)
    this.source = source
    source.addEventListener('add', event => {
      debug('msg=add %o', event)
      for (const item of JSON.parse(event.data)) {
        this.dataset.add(item)
        this.idCheck(event)
      }
    })
    source.addEventListener('remove', event => {
      debug('msg=remove %o', event)
      for (const key of JSON.parse(event.data)) {
        this.dataset.deleteKey(key)
        this.idCheck(event)
      }
    })
    source.addEventListener('remove-all', event => {
      this.dataset.clear()
      this.idCheck(event)
    })
  }
  
  close () {
    // ...
  }

  findStreamURL (linkHeader) {
    if (linkHeader) {
      const links = LinkHeader.parse(linkHeader)
      for (const linkrel of linkrels.lookFor) {
        if (links.has('rel', linkrel)) {
          const relURL = links.get('rel', linkrel)[0].uri
          debug({relURL, base: this.url})
          const result = URL.resolve(this.url, relURL)
          return result
        }
      }
    }
    return undefined
  }
}

module.exports = Client
