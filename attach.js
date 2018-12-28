const debug = require('debug')(__filename.split('/').slice(-1).join())
const handleStream = require('./stream')
const KeyedSet = require('keyed-set')
const LinkHeader = require('http-link-header')

const linkrels = require('./linkrel')

function attach (app, path, options) {
  const dataset = options.dataset || new KeyedSet()

  const stringify = options.dataset.stringify ||
        options.stringify ||
        JSON.stringify

  // not sure this is right at all, just guessing
  const doCORS = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Credentials', 'true')
    res.set('Access-Control-Allow-Headers', 'Link')
    res.set('Access-Control-Expose-Headers', 'Link')
  }
  
  const streamURL = path + '.webdup'
  app.get(streamURL, (req, res) => {
    doCORS(req, res)
    handleStream({dataset, stringify}, req, res)
  })
  
  const sendHead = (req, res) => {
    var links = new LinkHeader()
    for (const linkrel of linkrels.send) {
      links.set({ rel: linkrel, uri: streamURL })
    }
    res.set('Link', links)
    if (dataset.etag) res.set('ETag', dataset.etag)
    doCORS(req, res)
    res.writeHead(200)
  }
  app.head(path, (req, res) => {
    sendHead(req, res)
    res.end()
  })
  app.get(path, (req, res) => {
    sendHead(req, res)

    res.write(stringify([...dataset]))
    res.write('\n')
    res.end()
    /*
      const stringifier = new format.Stringifier()
      stringifier.pipe(res)
      for (const i of set) stringifier.write(i)
      stringifier.end()
    */
  })

  return dataset
}

module.exports = attach
