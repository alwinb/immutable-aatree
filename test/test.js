const AATree = require('../lib/aatree')
	, Node = AATree.__internal.Node
	, EMPTY = AATree.__internal.EMPTY
	, viz = require('./dot').dot
  , log = console.log.bind (console)

function toNode (o) {
  if (o === EMPTY)
    return { shape:'point' }
  if (typeof o === 'object' && 'lv' in o)
    return { shape:'record', label:o.k, rank:o.lv, children:['l', 'r'] }
}


let t = new AATree ()
for (let i=0; i<200; i++) {
  let k = Math.random ()
  t = t.insert (k, 'value for '+k)
}

for (let i=0; i<100; i++) {
  let k = Math.random ()
  let c = t.select (k) .next ()
  if (c) t = c .unset ()
}

// let c = 0
// t.forEach (_ => c++)
// log (c)

log(
  viz (t.__reify (), toNode)
)