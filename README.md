# webdup.js - web dataset update protocol
[![NPM version][npm-image]][npm-url]

Status: in progress

## The Dataset API

Inside both the client and server, application code interacts with
webdup code mostly by each of them modifying and listening for
modifications to one or more "dataset" objects.

By default, we create datasets as instances of
[KeyedSet](https://github.com/sandhawke/keyed-set#readme), but you're
welcome to provide your own, as long as they conforms to the same
interface.

Specifically, the server needs:
* ds.on('change', ...)
* ds.diff(...)
* ds.clone()

And the client needs:
* ds.change(...)

Typically the application code on the server will be changing the
dataset and the application code on the client will be using the
latest state and/or listening for changes.

On both sides, if possible, the dataset should provide a .etag
property whose value is a string which will be different for every
state of the dataset, statistically speaking. While it's tempting to
make this as SHA-256 of the dataset, any deletion would require
recomputing the entire hash.  A suggested alternative is to hash each
element separately, and have the etag be the XOR of all the hashes.
This is not as secure, but should be sufficient for accurately
identifying versions.

The dataset should also provide:

* ds.stringify([items]) => string

Given an array (not just an iterable) of zero or more items or their
keys (as per KeyedSet), return a string which encodes them such that
they can be reconstructed by ds.parse.  JSON.stringify should
generally work for this.

* ds.parse(str) => [items]

Parse a string of the preferred serialization format and return an
**iterable** of zero or more items encountered.  JSON.parse works,
given the string encodes an array, as above.

* new ds.Parser()

In addition to parse(), the dataset may provider a streaming parser
implementing writableStream, allowing data to be made available while
arriving over the network and with less buffering.

* new ds.Stringifier()

In addition to stringify(), the dataset may provide a streaming
serializer, a readableStream, which can be piped to a suitable output
stream.

## Issues

Browsers limit the number of streams per origin, so EventSource() wont
work in parallel beyond about 5.  (This is a reason to use WebSockets
as the underlying transport.  That, and better flow control.  Also,
serializing as text vs allowing cbor, which might be nice.)
Workarounds? Multiple origins, via servers on different ports or
hostnames. Or a combined EventSource() for multiple resources; add a
"path:" field, and let the URL include ?paths=....&etags=.... matched
arrays.  Or path2, etag2, etc.  Or JSON.stringified array of {path,
etag}.  So Link: <...>; rel=.../webdup-service
That'd be a nice thing anyway, one stream per origin (per user).

[npm-image]: https://img.shields.io/npm/v/dsup.svg?style=flat-square
[npm-url]: https://npmjs.org/package/dsup
