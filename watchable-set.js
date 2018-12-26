/*
  Set() + EventEmitter()

  Not sure which it should inherit from, if either.  It has to relay
  for at least one of the.

  OH -- plus we need to match for DEEP-EQUAL ?!
*/

const debug = require('debug')(__filename.split('/').slice(-1).join())
const EventEmitter = require('eventemitter3')

class WatchableSet extends EventEmitter {
  constructor (init) {
    super()
    this.data = new Set()
    if (init) {
      for (const i of init) this.data.add(i)
    }
  }

  // So painful.  But otherwise we need to keep a map from all the
  // stringified versions?  This is why earlier versions of the
  // protocol had delete by number -- since you need to keep track of
  // that kind of stuff anyway.  But for quads it's okay because they
  // are already indexed. 
  getMatch (obj, str) {
    const objs = str(obj)
    debug('Looking for match for %o', objs)
    for (const item of this.data.keys()) {
      const st = str(item)
      debug('..  vs %o', st)
      if (st === objs) return item
    }
    debug('..Failed')
    return undefined
  }
  
  get length () { return 0 }
  get size () { return this.data.size() }

  add (value) {
    this.data.add(value)
    this.emit('add', value)
    return this
  }

  clear () {
    this.data.clear()
    this.emit('clear')
    return this
  }

  delete (value) {
    this.data.delete(value)
    this.emit('delete', value)
    return this
  }

  entries () {
    return this.data.entries()
  }

  forEach (...args) {
    return this.data.forEach(...args)
  }

  has (value) {
    return this.data.has(value)
  }

  keys () {
    return this.data.keys()
  }

  values () {
    return this.data.values()
  }

  * [Symbol.iterator] (value) {
    for (const i of this.data) yield i
  }
}

module.exports = WatchableSet
