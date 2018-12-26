// fix the absurdly bad naming of the exports from the jsonlines pkg
//
// Calling them the same as JSON.parse and JSON.stringify when their
// interface is totally different?  Really?
//
// Also provide non-streaming versions
//

const Stringifier = require('jsonlines/lib/stringifier')
const Parser = require('jsonlines/lib/parser')

function parse (text) {
  return text.split(/\n/).map(JSON.parse)
}

function stringify (item) {
  return JSON.stringify(item)
  // return items.map(JSON.stringify).join('/n')
}

module.exports = { Parser, Stringifier, parse, stringify }
