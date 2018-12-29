const debug = require('debug')(__filename.split('/').slice(-1).join())
let streamNumbers = 0

const handleStream = ({dataset, stringify, getVersion}, req, res) => {
  const streamNumber = ++streamNumbers
  debug('stream open %d', streamNumber)
  console.log('stream open %d', streamNumber)

  // Obviously we're messing with internals, but I don't know a proper
  // way to lower the highwatermark on a socket created by
  // http.Server, and we want it low, so we can use SmartPatch to cut
  // out unnecessary traffic
  // console.log('res.socket %O', res.socket)
  if (res.socket._writableState.highWaterMark) {
    res.socket._writableState.highWaterMark = 1024
  } else {
    throw Error('res._writableState.highWaterMark missing -- library version issue?')
  }

  // When the client closes the connection, we need to stop listening
  // to changes on this dataset
  req.on('close', () => {
    debug('stream CLOSED by client %d', streamNumber)
    dataset.off('change', onChange)
  })

  // Very simple header.  Could also link back to dataset resource?
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  })

  let pending = dataset.smartPatch()
  let flowing = true
  let idOkay

  const onChange = event => {
    debug(event)
    if (!flowing) {
      pending.push(event)
      return
    }
    const out = []

    let etag = dataset.etag
    if (idOkay && etag) out.push('id: ' + etag)
    
    let type = event.type
    let text
    if (event.type === 'clear') {
      type = 'remove-all'
    } else if (event.type === 'add') {
      text = stringify([event.item])
    } else if (event.type === 'delete') {
      type = 'remove'
      text = stringify([event.key])
    }

    out.push('event: ' + type)
    if (text) {
      for (const line of text.split('\n')) {
        out.push('data: ' + line)
      }
    }
    out.push('', '') // two blank lines to end event
    flowing = res.write(out.join('\n'))
    if (!flowing) debug('highwatermark hit - backpressure observed')
  }
  dataset.on('change', onChange)

  // If we got back-pressure during a res.write, and flowing was set
  // to false, we're supposed to get a 'drain' event as soon as it's
  // good to send again.
  const onDrain = () => {
    process.stdout.write('.')
    console.log('Draining with ', pending)
    flowing = true
    while (flowing) {
      const ev = pending.shift()
      if (!ev) break
      onChange(ev)
    }
  }
  res.on('drain', onDrain)

  // Okay, now we need to catch up the client to our current state

  let etag = (req.query['webdup-client-has-etag'] ||
              req.param['last-event-it'])
  console.log('client etag=%o', etag)
  if (etag === dataset.etag) {
    console.log('client etag is current!')
  } else {
    const version = getVersion(etag)
    let diff
    
    if (version) {
      // versions.mark is a SmartPatch of everything that's happened to
      // this dataset since mark() was called, back when this etag was
      // current
      console.log('using version!  %o', version)
      pending.push(...version.mark)
      
    } else {
      console.log('no version match; starting fresh')
      pending.push({ type: 'clear' })
      const clientState = dataset.cloneEmpty()
      const diff = clientState.diff(dataset)
      pending.push(...diff)
    }
    
    // we weren't really blocked, we were just using pending for this buffering
    onDrain()
  }
  idOkay = true
}

module.exports = handleStream
