# Immutable/ Persistent AATree Datastructure

 ![Size][size-image] ![Size gzip][size-gzip-image] [![Dependencies][deps-image]][deps-url] [![NPM version][npm-image]][npm-url]

An implementation of [Persistent][1] ordered dictionaries via [AA trees][2], 
with a Cursor API for stepping through and manipulating entries.

**Note** that this is an implementation of ordered dictionaries, where key-value pairs are sorted by a given comparison function on the keys. 
This is different from ES6 Map objects in several ways, and it has other use cases. 

[1]: https://en.wikipedia.org/wiki/Persistent_data_structure
[2]: https://en.wikipedia.org/wiki/AA_tree

# Example

```javascript
const AATree = require ('immutable-aatree')
const log = console.log.bind (console)

const empty = new AATree (AATree.defaultCompare)
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
```

# API

## Comparison functions
Since AATrees implement _ordered_ keyed dictionaries,
they are parameterized by the order on keys.
This order is specified by a comparison function, a function
`compare (k1, k2)` that returns:

- `-1` if `k1` is to be considered smaller than `k2`,
- `0` if `k1` and `k2` are to be considered equivalent, and
- `1` if `k1` is to be considered larger than `k2`.

This is the same kind of comparison functions that JavaScript's built-in `Array.sort` method expects. 
The static method `AATree.defaultCompare` is a comparison function
that compares values on their type first and uses javascripts built-in
comparison operators id the type is equal. 

```javascript
const defaultCompare = function (a, b) {
  const ta = typeof a, tb = typeof b
  return ta < tb ? -1 : ta > tb ? 1 : a < b ? -1 : a > b ? 1 : 0 }
```

## AATree constructor
Given a comparison function `cmp` for keys,
`new AATree (cmp)` returns an empty AATree object, an object with a single property `size`, reflecting the number of key-value pairs stored in the tree; and the following methods:

- `has (key)`
- `get (key)`
- `lookup (key)`
- `select (key)`
- `insert (key, value)`
- `remove (key)`
- `entries ()`
- `keys ()`
- `values ()`
- `[Symbol.iterator] ()`
- `forEach (fn)`

**Note** that none of these methods mutate their owner object. 
The methods `insert` and `remove` return new AATree objects instead. 

### Has, Get
These methods were added to align the API with the built-in Map object of ES6. `has (k)` searches for a key `k` and returns `true` if found and `false` otherwise. `get (k)` searches for a key `k` and returns its value if found, and `undefined` otherwise. If for some reason you store `undefined` values under certain keys you can use the `lookup` method instead to disambiguate. 

### Lookup, Search
`lookup (k)` searches for a key `k` and returns an object
`{ found:true, key:k, value }` if found,
or `{ found:false }` otherwise. `search` is an alias for `lookup`. 

### Select
`select (k)` searches for a key `k` and returns a `Cursor` object.
Cursor objects have methods to step through key-value pairs and to create new AATree objects by setting, and/ or remove key-value pairs from their associated AATree.
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
equivalent to `t.select (k1) .unset ()`.

### ForEach
`forEach (fn)` calls a function `fn (v, k)` for each of the
key-value pairs `(k, v)` in the AATree in ascending key order.

### Entries, [Symbol.iterator]
`entries ()` returns a javascript ES6 style iterator object. 
The key value pairs are iterated as tuples, e.g. arrays `[key, value]`
in ascending order by key. 

### Keys
`keys ()` returns a javascript ES6 style iterator object for the
keys in the AATree in ascending order. 

### Values
`values ()` returns a javascript ES6 style iterator object for the
_values_ in the AATree in ascending order of the key under which they are stored. 

## Cursor constructor
The Cursor constructor is private.
Cursor objects can be obtained via the public method `select`
on an AATree object. However, cursors do have public members
`found:boolean`, `key`, `value` and methods
`previous`, `next`, `set` and `unset`.

### Previous, Prev
`previous ()` returns a new Cursor object by moving the cursor
to the previous key-value pair in its associated AATree, or
`null` if no such pair exists. `prev` is an alias for `previous`. 

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


# Changelog

- Version 1.0.0-alpha:
  - Switched to ES6. 
  - Changed the default compare function to compare on the type first, the value next. 
  - Added methods `has` and `get` to align with the ES6 `Map` API.
  - Removed the `delete` alias to avoid confusion with the ES6 API, where it is a mutating method. 

- Version 0.10.0, changes since 0.9.0:
  - Added `AATree` methods `keys` and `values`
  - Made the iterator objects returned from `entries`, `keys` and `values` iterable themselves. 
  - Added an alias `prev` for the `previous` method on `Cursor`. 


# License

MIT License.  
Enjoy!


[npm-image]: https://img.shields.io/npm/v/immutable-aatree.svg
[npm-url]: https://npmjs.org/package/immutable-aatree
[deps-image]: https://img.shields.io/david/alwinb/immutable-aatree.svg
[deps-url]: https://david-dm.org/alwinb/immutable-aatree
[size-image]: http://img.badgesize.io/alwinb/immutable-aatree/master/lib/aatree.js
[size-gzip-image]: http://img.badgesize.io/alwinb/immutable-aatree/master/lib/aatree.js?compression=gzip