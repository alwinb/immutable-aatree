var AATree = require ('../lib/aatree')
  , log = console.log.bind (console)

var empty = new AATree (AATree.defaultCompare)
var tree1 = empty.insert (1, 'Hello', 2, 'World', 3, '!!')

tree1.each (log)

// Hello 1
// World 2
// !! 3

var cursor = tree1.select (3)
log (cursor.found)

// true

var tree2 = cursor.set ('!')
tree2.each (log)

// Hello 1
// World 2
// ! 3


// Unset on a cursor not found, does nothing
var c = tree2.select (10)
log (c.found) // false
var tree3 = c.unset ()
log (tree2 === tree3) // true

var c = tree2.select (0)
