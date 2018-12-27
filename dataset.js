/*
  A 'dataset' must implement:

  - .add .delete .clear .values .has --- just like standard Set()

  - .on .removeListener --- just like EventEmitter() --- issuing
    'add', 'delete', and 'clear' for dataset changes.  Handlers must
    not change the set before returning; this might be checked.

  Implemented, but see below:
  - .getMatch(other) returns a member, if there is one, which
    "matches" other, in that they have the same key, or the same
    serialization if there is no key. I don't know of any efficient
    way to implement this in general.  Options include (1) keeping all
    the serializations in memory, (2) doing a linear search and
    re-serializing everything at every call, (3) keep an array in
    alphabet order of the serializations, so the search can be a
    binary search, ... but now insert and delete are slow, too.

    Maybe this should just be a map from key->object, where delete
    just gives the key.  For RDF, that's the full object.

  Below -- this is the interface we need:

    .parseAndAdd1(itemstr) 
    .parseAndAddN(itemstr) 
    .itemByKey(keystr)
    .itemKey(item)
    .entries() =>   [key, item]
    .stringifyTo(writeableStream)
    .versionId

   we can implement that with Map, looking like a Set, for generic JS
   objects, or ones with a ._id.

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
