# Immutable/ Persistent AATree Datastructure

An implementation of [persistent][1]
ordered dictionaries via [AA trees][2], 
with a Cursor API for stepping through and manipulating
entries.

[1]: (https://en.wikipedia.org/wiki/Persistent_data_structure)
[2]: (https://en.wikipedia.org/wiki/AA_tree)

# Example

	var AATree = require ('immutable-aatree')
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
	for (let p of tree5) log (p)

	// [ 1, 'Hello' ]
	// [ 3, '!' ]
	// [ 5, 'Welcome!' ]


# API

## Comparison functions
Since AATrees implement _ordered_ keyed dictionaries,
they are parameterized by the order on keys.
This order is specified by a comparison function, a function
`compare (k1, k2)` that returns
`-1` if `k1` is to be considered smaller than `k2`,
`0` if `k1` and `k2` are to be considered equivalent, and
`1` if `k1` is to be considered larger than `k2`.
The static method `AATree.defaultCompare` is a comparison function
that uses javascripts built-in comparison operators.

	AATree.defaultCompare = function compare (a, b) {
	  return a < b ? -1 : a > b ? 1 : 0 }

## AATree construtor
Given a comparison function `cmp` for keys,
`new AATree (cmp)` returns an empty AATree object, an object with methods
`lookup`, `select`, `insert`, `stream` and `each`.
Note that none of these methods mutate their owner object, but
return new objects instead.

### Lookup
`lookup (k)` searches for a key `k` and returns an object
`{ found:true, key:k, value }` if found,
or `{ found:false }` otherwise. `search` is an alias for `lookup`. 

### Select
`select (k)` searches for a key `k` and returns a `Cursor` object.
Cursor objects have methods to step through key-value pairs and to create
new AATree objects by setting, and/ or remove key-value pairs from their
their associated AATree.
Cursor objects have members `found:boolean`, `key`, `value`
and methods `previous`, `next`, `set` and `unset`.

### Insert
`insert (k1, v1, ... kn, vn)` inserts an arbitrary number of
key value pairs at once and returns a new AATree object.
Note that for a single pair, `t.insert (k1, v1)` is equivalent to
`t.select (k1) .set (v1)`.

### Remove, Delete
`remove (k1, ... kn)` returns a new AATree object by removing the 
key-value pairs with the specified keys. Note that `t.remove (k1)` is 
equivalent to `t.select (k1) .unset ()`. The method `delete`
is an alias for `remove`.

### Each
`each (fn)` calls a function `fn (v, k)` for each of the
key-value pairs `(k, v)` in the AATree in ascending key order.

### Entries, [Symbol.iterator]
`entries ()` returns a javascript ES6 style iterator object. 
In an ES6 environment, the method is also exposed as `[Symbol.iterator]`.
The key value pairs are iterated as pairs, e.g. arrays `[key, value]`
in ascending order by key. 

### Stream
`stream ()` returns a stateful lazy stream object, an object with
a single method `next`. Each call of `next()` returns
the next key-value pair in the AATree as an object `{ key, value }`
in ascending order by key, or `null` if
the end of the stream has been reached.

## Cursor constructor
The Cursor constructor is private.
Cursor objects can be obtained via the public method `select`
on an AATree object. However, cursors do have public members
`found:boolean`, `key`, `value` and methods
`previous`, `next`, `set` and `unset`.

### Previous
`previous ()` returns a new Cursor object by moving the cursor
to the previous key-value pair in its associated AATree, or
`null` if no such pair exists. 

### Next
`next ()` returns a new Cursor object by moving the cursor
to the next key-value pair in its associated AATree, or
`null` if no such pair exists. 

### Unset
`unset()` returns a new AATree object by removing the key-value pair
that the cursor is pointed at from its associated AATree. 
If `cursor.found` is `false` the original associated AATree is returned. 

### Set
`set (value)` returns a new AATree object by inserting or updating the
the key-value pair that the cursor is pointing at in its associated AATree.
