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

  const versions = new Map // etag => { lastUsed, mark, etag }
  const keep = () => {
    const etag = dataset.etag
    let rec = versions.get(etag)
    if (!rec) {
      const mark = dataset.mark()
      console.log('saving mark!  %o', mark)
      rec = { mark, etag }
    }
    rec.lastUsed = new Date()
    versions.set(etag, rec)
    if (versions.size > 10) {   // tough tradeoff; versions are expensive
      let oldest = rec
      for (const entry of versions.values()) {
        if (entry.lastUsed < oldest.lastUsed) oldest = entry
      }
      oldest.mark.close()
      versions.delete(oldest.etag)
    }
  }
  const getVersion = (etag) => {
    const v = versions.get(etag)
    if (!v) return undefined
    v.lastUsed = new Date()
    return v
  }
  
  // not sure this is right at all, just guessing
  const doCORS = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Credentials', 'true')
    res.set('Access-Control-Allow-Headers', 'Link')
    res.set('Access-Control-Expose-Headers', 'Link')
  }

  // SWITCH TO ONE STREAM URL FOR THE PROCESS, since it gets passed
  // the webdup-source-url?
  const streamURL = path + '.webdup'
  app.get(streamURL, (req, res) => {
    doCORS(req, res)
    handleStream({dataset, stringify, getVersion}, req, res)
  })
  
  const sendHead = (req, res) => {
    var links = new LinkHeader()
    for (const linkrel of linkrels.send) {
      links.set({ rel: linkrel, uri: streamURL })
    }
    res.set('Link', links)
    doCORS(req, res)
    res.writeHead(200)
  }
  app.head(path, (req, res) => {
    const etag = dataset.etag
    if (etag) res.set('ETag', etag)  // but don't bother to keep() it
    sendHead(req, res)
    res.end()
  })
  app.get(path, (req, res) => {
    const etag = dataset.etag
    if (etag) res.set('ETag', etag)
    sendHead(req, res)

    res.write(stringify([...dataset]))
    res.write('\n')
    res.end()
    if (dataset.etag !== etag) {
      throw Error('etag changed during serialization; that shouldnt be possible')
    }
    keep()
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
