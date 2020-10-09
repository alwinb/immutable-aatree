const AATree = require('../lib/aatree')
const { Node, Empty:EMPTY } = AATree.core
const { Canvas, viz } = require('./layout')
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
// NB passing the store as the second argument is only for internal use
// thus, this is _not_ a stable/ supported use of the API
var sampleTree = tree = new AATree (AATree.defaultCompare, store0)

// ## Test

process.stdout.write (`<style>
  html { font-family:Sans-Serif; }
  body { margin:2rem 2rem; width:30rem; }
  svg { margin:0 auto; font-size:12px; padding:1rem; display:block; }
</style>`)

log ('<h1>Immutable AATree Example</h1>')

log ('<code>var tree0 = sampleTree</code>')
var tree0 = sampleTree
viz (tree0, process.stdout)

log ('<code>var tree1 = tree0.select(1).unset()</code>')
var tree1 = tree0.select(1).unset()
viz (tree1, process.stdout)

log ('<code>var tree2 = tree1.select(2).unset()</code>')
var tree2 = tree1.select(2).unset()
viz (tree2, process.stdout)

log ('<code>var tree3 = tree1.select(3).unset()</code>')
var tree3 = tree1.select(3).unset()
viz (tree3, process.stdout)

log ('<code>var tree4 = tree1.select(4).unset()</code>')
var tree4 = tree1.select(4).unset()
viz (tree4, process.stdout)

log ('<code>var tree5 = tree4.select(21).set("v21")</code>')
var tree5 = tree4.select(21).set("v21")
viz (tree5, process.stdout)

log ('<code>var tree6 = tree5.select(23).set("v23")</code>')
var tree6 = tree5.select(23).set("v23")
viz (tree6, process.stdout)

log ('<code>var tree7 = tree6.select(21).previous().unset()</code>')
var tree7 = tree6.select(21).previous().unset()
viz (tree7, process.stdout)

/*
log ('<plaintext>')
var cursor = tree.select(100)
//var cursor = tree.select(3)
 while (cursor) {
   log(cursor.value)
   cursor = cursor.previous()
}

log('==========')

var cursor = tree.select(-1)
log (cursor)
log (cursor.previous(), cursor.next ())

// var cursor = tree.select(0)
// //var cursor = tree.selectFirst()
// while (cursor) {
//   log (cursor.value)
//   cursor = cursor.next()
// }
*/


// 205 tells TextMate to show the result as HTML
process.stdout.on ('close', _ => process.exit (205))
process.stdout.end ()