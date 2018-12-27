const debug = require('debug')(__filename.split('/').slice(-1).join())
const EventSource = require('./eventsource')  // MINE

const e = new EventSource('http://localhost:8080/')

