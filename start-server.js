const debug = require('debug')(__filename.split('/').slice(-1).join())
const appmgr = require('appmgr')
const delay = require('delay')

class Server {
  constructor (options) {
    this.m = appmgr.create(options)
    Object.assign(this, options)

    this.m.app.get('/', (req, res) => {
      res.send('<html><body>Try <a href="static/demo">demo</a>')
    })
  }
  
  async start () {
    await this.m.start()
    this.siteurl = this.m.siteurl
    this.app = this.m.app
  }

  async stop () {
    return this.m.stop()
  }
}

async function startServer (options) {
  const s = new Server(options)
  await s.start()
  return s
}

module.exports = startServer

