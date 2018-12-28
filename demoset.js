/*
  A simple dataset implementations, using a weak 32-bit code for etag
  calculation.
*/
const KeyedSet = require('keyed-set')

class DemoDataset extends KeyedSet {
  constructor (...args) {
    super(...args)
    this.on('change', ev => this.etagger(ev))
  }

  etagger (ev) {
    let id 
    if (ev.type === 'clear') {
      delete this.x32
      id = 0
    } else {
      id = ev.item && ev.item._id32
      if (id === undefined) return
    }
    if (this.x32 === undefined) this.x32 = 0
    this.x32 = this.x32 ^ id
    this.etag = 'id-xor32-' + (this.x32 - + (1 << 31)).toString(16)
  }

  emptyClone () {
    return new DemoDataset()
  }
}

module.exports = DemoDataset
