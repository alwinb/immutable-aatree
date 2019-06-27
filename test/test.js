const AATree = require('../lib/aatree')
	, Node = AATree.__internal.Node
	, EMPTY = AATree.__internal.EMPTY
	, viz = require('./dot').dot
  , log = console.log.bind (console)

function toNode (o) {
  if (o === EMPTY)
    return { shape:'point' }
  if (typeof o === 'object' && 'lv' in o)
    return { shape:'record', label:o.k, rank:o.lv, children:_children(o) }
}

function _children (o) {
  const r = []
  if (o.l !== EMPTY) r.push ('l')
  if (o.r !== EMPTY) r.push ('r')
  return r
}

let t = new AATree ()
for (let i=0; i<200; i++) {
  let k = Math.round (Math.random ()*1000)
  t = t.insert (k, 'value for '+k)
}

for (let i=0; i<100; i++) {
  let k = Math.round (Math.random ()*1000)
  let c = t.select (k) .next ()
  if (c) t = c .unset ()
}

function countSize (tree) {
  let c = 0
  t.forEach (_ => c++)
  return c
}

function isSorted (tree, cmp = AATree.defaultCompare) {
  let prev = null
  for (let [k,_] of tree) {
    if (!prev) prev = k
    else if (cmp (prev, k) >= 0) return false
  }
  return true
}


log (countSize (t))
log (isSorted (t))

log(
  viz (t.__reify (), toNode)
)

