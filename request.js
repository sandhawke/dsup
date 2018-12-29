/*
  Tiny wrapper

  Tried "fetch" and "got" and ... yeah.
*/
const http = require('http')
const https = require('https')
const {parse} = require('url')

function request(options, cb) {
  if (typeof options === 'string') {
    options = parse(options)
  }
  if (!options.protocol) {
    Object.assign(options, parse(options.url))
  }
  
  let hModule = http
  if (options.protocol === 'https:') hModule = https

  const req = hModule.request(options, cb)

  req.on('error', e => {
    console.error('req.onEerror: ', e)
  })
  req.end()
  return request
}
