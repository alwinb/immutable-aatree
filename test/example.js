var AATree = require ('../lib/aatree')
const log = console.log.bind (console)

var empty = new AATree (AATree.defaultCompare)
var tree1 = empty.insert (1, 'Hello', 2, 'World', 3, '!!')

function logp (value, key) {
  log (key+':', value)
}

tree1.forEach (logp)

// 1: Hello
// 2: World
// 3: !!

var cursor = tree1.select (3)
log (cursor.found)

// true

var tree2 = cursor.set ('!')
tree2.forEach (logp)

// 1: Hello
// 2: World
// 3: !

var cursor = tree2.select (5)
log (cursor.found)

// false

tree4 = cursor.set ('Welcome!')
tree4.forEach (logp)

// 1: Hello
// 2: World
// 3: !
// 5: Welcome!

tree5 = tree4.remove (2)
tree5.forEach (logp)

// 1: Hello
// 3: !
// 5: Welcome!
