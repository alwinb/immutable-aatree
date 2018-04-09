var AATree = require('../lib/aatree')
const log = console.log.bind (console)


// Specify a comparison function
// (This is idiomatic, the same thing Array.sort expects)

var compare = function (a, b) {
	return a < b ? -1 : a > b ? 1 : 0
}

// Lookup and insert/update values
// -------------------------------

var tree1 = new AATree(compare)
var cursor = tree1.select('key1')
console.log(cursor)
// { found: false, key: 'key1', set: [Function: set] }

var tree2 = cursor.set('value for key1')
var cursor = tree2.select('key1')
console.log(cursor)
// { found: true, key: 'key1', value: 'value for key1', set: [Function: set] }

var tree3 = tree2.select('key2').set('value for key2')
var cursor = tree3.select('key2')


// Call a function for each entry in the tree
// ------------------------------------------

log ('\ntest each')
tree3.each (function (value, key) { console.log(key, ':', value) })



// Lazy stream of pairs in ascending order
// ---------------------------------------

log ('\ntest stream')
var stream = tree3.stream()

do {
	var pair = stream.next()
	console.log(pair)
}
while (pair != null)

// { key: 'key1', value: 'value for key1' }
// { key: 'key2', value: 'value for key2' }
// null
