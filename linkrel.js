/*
  Webdup uses a link-rel to point to the event-stream from the dataset
  resource.  But while it's not standardized, the actual link relation
  text is somewhat in flux, so we allow sending several different
  ones, and looking for several different ones.
*/

const rels = [
  'https://sandhawke.github.io/webdup',
  'https://webdup.org/v1',
  'x-webdup',
]

module.exports = {
  send: [...rels],
  lookFor: [...rels]
}
