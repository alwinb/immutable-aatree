"use strict"
const log = console.log.bind (console)

// # AA trees
// An implementation of [persistent][1]
// ordered dictinaries via [AA trees][2], 
// and exposing a Cursor API for stepping through and manipulating
// entries of AATrees. 
//
// [1]: (https://en.wikipedia.org/wiki/Persistent_data_structure)
// [2]: (https://en.wikipedia.org/wiki/AA_tree)

var _fromInternal = {}

// ## Comparison functions
// Since AATrees implement _ordered_ keyed dictionaries,
// they are parameterized by the order on keys. 
// This order is specified by a comparison function, a function
// `compare (k1, k2)` that returns 
// `-1` if `k1` is to be considered smaller than `k2`,
// `0` if `k1` and `k2` are to be considered equivalent, and
// `1` if `k1` is to be considered larger than `k2`. 

// The static method `AATree.defaultCompare` is a comparison function 
// that uses javascripts built-in comparison operators. 

AATree.defaultCompare = function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0 }

// ## AATree construtor
// Given a comparison function `cmp` for keys,
// `AATree (cmp)` returns an empty AATree object, an object with methods
// `lookup`, `select`, `insert`, `stream` and `each`.
// Note that none of these methods mutate their owner object, but 
// return new objects instead. 

function AATree (cmp) {
  /* private */
  var cmp = cmp
  var store = EMPTY
  var self = this

  /* public */
  this.lookup = lookup
  this.select = select
  this.insert = insert
  this.stream = stream
  this.each = each
  this._reify = function () { return store }

  /* init */
  if (typeof cmp !== 'function')
    throw new Error ('First argument to AATree must be a comparison function.')

  if (arguments[1] === _fromInternal)
    store = arguments[2]

// ### Lookup 
// `lookup (k)` searches for a key `k` and returns an object 
//`{ found:true, key:k, value }` if found,
// or `{ found:false }` otherwise. 

function lookup (k) {
  var n = store
  while (n !== EMPTY) {
    c = cmp(k, n.k)
    if (c === 0) return { found:true, key:k, value:n.v }
    else n = (c < 0) ? n.l : n.r }
  return { found:false } }

// ### Select
// `select (k)` searches for a key `k` and returns a `Cursor` object. 
// Cursor objects have methods to step through key-value pairs and to create 
// new AATree objects by setting, and/ or remove key-value pairs from their
// their associated AATree. 
// Cursor objects have members `found:boolean`, `key`, `value` 
// and methods `previous`, `next`, `set` and if found is true, `unset`. 

function select (k) {
  var n = store, p = null, c
  while (n !== EMPTY) {
    c = cmp (k, n.k)
    p = { branch:c, node:n, tail:p }
    if (c === 0) return new Cursor (cmp, p, n.k)
    else n = (c < 0) ? n.l : n.r }
  return new Cursor (cmp, p, k)
}

// ### Insert
// `insert (k1, v1, ... kn, vn)` inserts an arbitrary number of 
// key value pairs at once and returns a new AATree object.
// Note that for a single pair, `t.insert `(k1, v1)` is equivalent to
// `t.select(k1).set(v1)`.

function insert (k1, v1, k2, v2, _) {
  var r = self
  for (var i=0,l=arguments.length; i<l; i+=2)
    r = r.select(arguments[i]).set(arguments[i+1])
  return r }

// ### Each
// `each (fn)` calls a function `fn (v, k)` for each of the 
// key-value pairs `(k, v)` in the AATree in ascending key order. 

function each (fn) {
  var ps = stream(), p = ps.next()
  while (p !== null) {
    fn(p.key, p.value)
    p = ps.next() } }

// ### Stream
// `stream ()` returns a stateful lazy stream object, an object with
// a single method `next`. Each call of `next()` returns 
// the next key-value pair in the AATree as an object `{ key, value }` 
// in ascending order by key, or `null` if
// the end of the stream has been reached. 

function stream () {
  var n = store, p = []
  return { next:next }
  /* where */
  function next () {
    while (n !== EMPTY) {
      p.push(n)
      n = n.l }
    if (p.length) {
      var n_ = p.pop()
      n = n_.r
      return { key:n_.k, value:n_.v } }
    return null } }

}

// ## Cursor constructor
// The Cursor constructor is private. 
// Cursor objects can be obtained via the public method `select`
// on an AATree object. However, cursors do have public members 
// `found:boolean`, `key`, `value` and methods 
// `previous`, `next`, `set` and if found is true, `unset`. 

/* `new Cursor (cmp, path, key)` returns a new Cursor object for
  an internal internal cursor datastructure `path`, with associated
  comparison function `cmp` and key `key`. */

function Cursor (cmp, path, key) {
  this.found = (path != null && path.branch === 0)
  this.key = this.found ? path.node.k : key
  this.value = this.found ? path.node.v : undefined
  this.previous = previous
  this.next = next
  this.set = _set
  this.unset = this.found ? _unset : undefined

// ### previous
// `previous ()` returns a new Cursor object by moving the cursor
// to the previous key-value pair in its associated AATree. 

  function previous () {
    var path2 = _prev (path)
    return path2 ? new Cursor (cmp, path2) : null }

// ### next
// `next ()` returns a new Cursor object by moving the cursor
// to the next key-value pair in its associated AATree. 

  function next () {
    var path2 = _next (path)
    return path2 ? new Cursor (cmp, path2) : null }

// ### unset
// `unset()` returns a new AATree object by removing the key-value pair
// that the cursor is pointed at from its associated AATree. 

  function _unset () {
    return new AATree (cmp, _fromInternal, unset (path)) }

// ### set
// `set (value)` returns a new AATree object by either inserting a new 
// key-value pair, or updating the value of the the existing key-value pair
// that the cursor is pointing at in its associated AATree. 

  function _set (value) {
    return new AATree (cmp, _fromInternal, set (path, key, value)) }
}


// # AATree core, private, internal datastructures and operations. 

// ## Internal tree structure and operations
// A constructor function `Node`, `copy`, and 
// the AA tree's `skew` and `split` operations. 

var LEFT = -1, RIGHT = 1
var EMPTY = Node (null, undefined, 0, null, null)
EMPTY.l = EMPTY.r = EMPTY

function Node (key, value, level, left, right) {
  return { l:left, lv:level, k:key, v:value, r:right } }

function skew (n) { // immutable
  if (!n.lv) return n
  var l = n.l
  return (l.lv === n.lv)
    ? Node (l.k, l.v, l.lv, l.l, Node (n.k, n.v, n.lv, l.r, n.r))
    : n }

function split (n) { // immutable
  if (!n.lv) return n
  var r = n.r
  return (r.r.lv === n.lv)
    ? Node (r.k, r.v, r.lv+1, Node (n.k, n.v, n.lv, n.l, r.l), r.r)
    : n }

function copy (n) {
  if (n === EMPTY) return n
  return { l:n.l, lv:n.lv, k:n.k, v:n.v, r:n.r } }


// ## Internal cursor structure and operations
// Cursors (paths) are represented internally as a linked list of nodes,
// `path := null | { node, branch:-1|0|1, tail:path }`, representing a pointer
// at the left branch (-1), right branch (1), or at the node itself (0).

// ### next

function _next (path) {
  if (!path) return path
  if (path.branch < 0) {
    path = { branch:0, node:path.node, tail:path.tail }
  } 
  else if (path.node.r === EMPTY) { 
    while (path != null && path.branch >= 0)
      path = path.tail
    if (path)
      path = { branch:0, node:path.node, tail:path.tail }
  }
  else {
    path = { branch:LEFT, node:path.node.r, tail: { branch:1, node:path.node, tail:path.tail } }
    while (path.node.l !== EMPTY)
      path = { branch:LEFT, node:path.node.l, tail:path }
    path.branch = 0
  }
  return path
}

// ### previous

function _prev (path) {
  if (!path) return path
  if (path.branch > 0) {
    path = { branch:0, node:path.node, tail:path.tail }
  }
  else if (path.node.l === EMPTY) { 
    while (path != null && path.branch <= 0)
      path = path.tail
    if (path)
      path = { branch:0, node:path.node, tail:path.tail }
  }
  else {
    path = { branch:RIGHT, node:path.node.l, tail: { branch:-1, node:path.node, tail:path.tail } }
    while (path.node.r !== EMPTY)
      path = { branch:RIGHT, node:path.node.r, tail:path }
    path.branch = 0
  }
  return path
}


// ### set
// `set (p, k, v)` reconstructs an (internal) AA tree from a path `p`,
// but with the value of the head node of the path set to 'v'. 

function set (p, k, v) {
  if (p !== null && p.branch === 0) { // found
    var n = p.node
    var r = Node (k, v, n.lv, n.l, n.r)
    p = p.tail }
  else
    var r = Node (k, v, 1, EMPTY, EMPTY)
  while (p !== null) {
    var n = p.node
    r = (p.branch === RIGHT)
      ? Node (n.k, n.v, n.lv, n.l, r)
      : Node (n.k, n.v, n.lv, r, n.r)
    r = split (skew (r))
    p = p.tail }
  return r }


// ### unset
// `unset(path)` reconstructs an (internal) AA tree structure from a path `p`,
// but with the head node of the path removed. 

/* Assumes path !== null && path.branch === 0 && path.node !== EMPTY */

function unset (path) {
  var n0 = path.node
    , p = path.tail

  /* If n0 is not a leaf node, copy it for swapping its value with
    a leaf node and extend the path upto just above a leaf node
    by going left.right* and swap the values */

  if (n0.l !== EMPTY) {
    n0 = copy (n0)
    p = { branch:LEFT, node:n0, tail:p }
    n = n0.l
    while (n.r !== EMPTY) {
      p = { branch:RIGHT, node:n, tail:p }
      n = n.r }
    n0.k = n.k
    n0.v = n.v }

  else if (n0.r !== EMPTY) {
    p = { branch:RIGHT, node:n0.r, tail:p } }

  /* Then, reconstruct a tree from the path. 
    Make sure to copy nodes on the path, decrease and rebalance on the way. 
    NB, could optimized to ensure that nothing more is copied
    than strictly necessary! */

  var t = EMPTY
  while (p !== null) {
    var n = p.node
    t = (p.branch === RIGHT)
      ? Node (n.k, n.v, n.lv, n.l, t)
      : Node (n.k, n.v, n.lv, t, n.r)

    if (t.l.lv < t.lv-1 || t.r.lv < t.lv-1) {
      t.lv--
      t.r = copy(t.r)
      if (t.r.lv > t.lv) t.r.lv = t.lv
      t = skew(t)
      t.r = skew(t.r)
      t.r.r = skew(copy(t.r.r))
      t = split(t)
      t.r = split(t.r)
    }
    p = p.tail
  }
  return t
}

// ## Exports

AATree.core = { Node:Node, EMPTY:EMPTY, _fromInternal:_fromInternal }
module.exports = AATree