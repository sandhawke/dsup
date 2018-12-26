# dsup
[![NPM version][npm-image]][npm-url]

Client and server for the dataset update protocol

Issues:

* deletes are slow, because how do you find the item in the set?

Options:
1. keep the serialization of every item around, 2xing storage, etc
2. do some database indexing type stuff, knowing the structure; this is okay for use in RDF-land, I think
3. keep an array of object pointers; change protocol so delete is by number, slicing out part(s) of the array.

Waaaaaah.  I don't like having this kind of peforrmance issue so
deeply change the design of the protocol!

[npm-image]: https://img.shields.io/npm/v/dsup.svg?style=flat-square
[npm-url]: https://npmjs.org/package/dsup
