var AATree = require('../lib/aatree')
	, Node = AATree._internal.Node
	, EMPTY = AATree._internal.EMPTY
	, viz = require('./layout').toSvg

const log = console.log.bind (console)

// For debugging only - path to array

function toArray (path) {
	var r = []
	while (path != null) {
		r.unshift (path.branch)
		r.unshift (path.node.k)
		path = path.tail }
	return r }



// Sample tree
// ===========
// This is the example from the original paper

// Node (key, value, level, left, right)

var t13 = Node (13, 'v13', 1, EMPTY, EMPTY)
	, t11 = Node (11, 'v11', 1, EMPTY, EMPTY)
	, t12 = Node (12, 'v12', 2, t11, t13)
	, t9  = Node (9,  'v9',  1, EMPTY, EMPTY)
	, t7  = Node (7,  'v7',  1, EMPTY, EMPTY)
	, t8  = Node (8,  'v8',  2, t7, t9)
	, t5  = Node (5,  'v5',  1, EMPTY, EMPTY)
	, t6  = Node (6,  'v6',  2, t5, t8)
	, t3  = Node (3,  'v3',  1, EMPTY, EMPTY)
	, t1  = Node (1,  'v1',  1, EMPTY, EMPTY)
	, t2  = Node (2,  'v2',  2, t1, t3)
	, t10 = Node (10, 'v10', 3, t6, t12)
	, t4  = Node (4,  'v4',  3, t2, t10)

var store0 = t4

// ## An AATree based on the sample store

var tree = new AATree (AATree.defaultCompare, store0)

// ## Test

// tree.select(1).unset().store
// tree.select(2).unset().store
// tree.select(3).unset().store
// tree.select(4).unset().store
// tree.select(5).unset().store
// tree.select(6).unset().store
// tree.select(7).unset().store
// tree.select(8).unset().store
// tree.select(9).unset().store
// tree.select(10).unset().store
// tree.select(11).unset().store
// tree.select(12).unset().store
// tree.select(13).unset().store
var tree0 = tree
var tree1 = tree.select(1).unset()
var tree2 = tree1.select(2).unset()
var tree3 = tree1.select(3).unset()
var tree4 = tree1.select(4).unset()

function toNode (o) {
  if (o === EMPTY)
    return { shape:'point' }
  if (o && typeof o === 'object' && 'lv' in o)
    return { shape:'record', label:o.k, rank:o.lv, children:['l', 'r'] }
  if (o && typeof o === 'object' && 'parent' in o)
    return { shape:'record', label:o.node.k, children:['branch', 'node', 'parent'], color:'forestgreen' }
  else return viz.defaultNode (o)
}

log(
  '<style>svg { border:1px solid black;}</style>'
,
	viz(tree0, toNode)
, viz(tree1, toNode)
, viz(tree2, toNode)
, viz(tree3, toNode)
, viz(tree4, toNode)
// , viz(tree0.select(4), toNode)
// , viz(tree0.select(7), toNode)
)
process.exit (205)

// var cursor = tree.select(100)
// //var cursor = tree.select(3)
//  while (cursor) {
//    log(cursor.value)
//    cursor = cursor.previous()
// }

// log('==========')
//
// var cursor = tree.select(-1)
// log (cursor)
// log (cursor.previous(), cursor.next ())

// var cursor = tree.select(0)
// //var cursor = tree.selectFirst()
// while (cursor) {
//   log (cursor.value)
//   cursor = cursor.next()
// }
