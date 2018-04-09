var AATree = require('../lib/aatree')
	, viz = require('./dot').dot

const log = console.log.bind (console)



var tree1 = new AATree (AATree.defaultCompare)
	.select (300)
	.set ('hello')
	.select (600)
	.set ('there')
  // .select (700)
  // .set ('world')
  // .select (900)
  // .set ('!!!')

function toNode (o) {
	if (o === AATree._private.EMPTY)
		return { shape:'point' }
	if (typeof o === 'object' && 'lv' in o)
		return { shape:'record', label:o.k, rank:o.lv, children:['l', 'r'] }
}

console.log(viz(tree1._reify(), toNode))

var cursor = tree1.select (609)
log (cursor)
log (cursor.previous (), cursor.next ())