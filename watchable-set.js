/*
  Set() + EventEmitter()

  Not sure which it should inherit from, if either.  It has to relay
  for at least one of the. 
*/

const EventEmitter = require('eventemitter3')

class WatchableSet extends EventEmitter {
  constructor (init) {
    super()
    this.data = new Set()
    if (init) {
      for (const i of init) this.data.add(i)
    }
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
