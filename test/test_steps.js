var AATree = require('../lib/aatree')
	, viz = require('./dot').dot

const log = console.log.bind (console)



var tree1 = new AATree (AATree.defaultCompare)
	.insert (300, 'hello', 600, 'there', 700, 'world')
  // .select (900)
  // .set ('!!!')

function toNode (o) {
	if (o === AATree.__internal.EMPTY)
		return { shape:'point' }
	if (typeof o === 'object' && 'lv' in o)
		return { shape:'record', label:o.k, rank:o.lv, children:['l', 'r'] }
}

console.log(viz(tree1.__reify(), toNode))

var cursor = tree1.select (609)
log (cursor)
log (cursor.previous (), cursor.next ())