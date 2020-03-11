const AATree = require('../lib/aatree')
	, Node = AATree._internal.Node
	, EMPTY = AATree._internal.EMPTY
	, viz = require('./layout').toSvg
  , log = console.log.bind (console)

let t = new AATree ()
for (let i=0; i<1200; i++) {
  let k = Math.round (Math.random ()*1000)
  t = t.insert (k, 'value for '+k)
}

for (let i=0; i<50; i++) {
  let k = Math.round (Math.random ()*1000)
  let c = t.select (k)// .next ()
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

viz (t, process.stdout)

process.exit (205)