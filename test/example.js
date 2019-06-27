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

var tree4 = cursor.set ('Welcome!')
tree4.forEach (logp)

// 1: Hello
// 2: World
// 3: !
// 5: Welcome!

var tree5 = tree4.remove (2)
for (let p of tree5) log (p)

// [ 1, 'Hello' ]
// [ 3, '!' ]
// [ 5, 'Welcome!' ]


