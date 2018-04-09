(function(){ "use strict";

// # AA trees
// This is an implementation of [persistent][1]
// ordered dictinaries via [AA trees][2]
//
// [1]: (https://en.wikipedia.org/wiki/Persistent_data_structure)
// [2]: (https://en.wikipedia.org/wiki/AA_tree)

// I'm messing around with the closure pattern. 
// I'd like the internals to be properly private. 
// If I'd not export _fromInternal, then they would be!

var _fromInternal = {}

AATree.defaultCompare = function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0 }

// ## Public AATree construtor
// Given a comparison function `cmp` for keys,
// the constructor `AATree (cmp)` returns an empty AA tree, an object
// with (pure) methods `{ lookup, select, insert, stream, each }`.

function AATree (cmp) {
  // private
  var cmp = cmp
  var store = EMPTY

  // public
  this.lookup = lookup
  this.select = select
  this.insert = insert
  this.stream = stream
  this.each = each
  this._reify = function () { return store }

  // init
  if (typeof cmp !== 'function')
    throw new Error ('First argument to AATree must be a comparison function.')

  if (arguments[1] === _fromInternal)
    store = arguments[2]

// ## Lookup 
// Search for a key `k`, returns an object `{ found:true, key, value }` if found,
// or `{ found:false }` otherwise. 

function lookup (k) {
  var n = store
  while (n !== EMPTY) {
    c = cmp(k, n.k)
    if (c === 0) return { found:true, key:k, value:n.v }
    else n = (c < 0) ? n.l : n.r }
  return { found:false } }

// ## Select
// Lookup a key `k`, but trace the path to return a `Cursor` object. 
// Cursor objects have methods to step through-, to set and/ or remove key-value pairs,
// depending on whether the key was found or not. 

function select (k) {
  var n = store, p = null, c
  while (n !== EMPTY) {
    c = cmp (k, n.k)
    p = { branch:c, node:n, tail:p }
    if (c === 0) return new Cursor (cmp, p, n.k)
    else n = (c < 0) ? n.l : n.r }
  return new Cursor (cmp, p, k)
}

// ## Insert
// Insert an arbitrary number of key value pairs at once. 
// Note that for a single pair, `t.insert(k, v)` is equivalent to `t.select(k).set(v)`.

function insert (k1, v1, k2, v2, _) {
  var r = self
  for (var i=0,l=arguments.length; i<l; i+=2)
    r = r.select(arguments[i]).set(arguments[i+1])
  return r }

// ## Each
// Execute a function `fn (k, v)` for each of the 
// key-value pairs `(k, v)` in the AATree in ascending key order. 

function each (fn) {
  var ps = stream(), p = ps.next()
  while (p !== null) {
    fn(p.value, p.key)
    p = ps.next() } }

// ## Stream
// Returns a stateful lazy stream object `{ next }`.
// Each call of `next()` returns the subsequent key-value pair as 
// an object `{ key, value }` in ascending order by key, or `null` if
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
// `path` is an internal cursor structure. 

AATree.Cursor = Cursor
function Cursor (cmp, path, key) {
  this.found = (path != null && path.branch === 0)
  this.key = this.found ? path.node.k : key
  this.value = this.found ? path.node.v : undefined
  this.previous = previous
  this.next = next
  this.set = _set
  this.unset = this.found ? _unset : undefined

  function previous () {
    var path2 = _prev (path)
    return path2 ? new Cursor (cmp, path2) : null }

  function next () {
    var path2 = _next (path)
    return path2 ? new Cursor (cmp, path2) : null }

  function _unset () {
    return new AATree (cmp, _fromInternal, unset (path)) }

  function _set (value) {
    return new AATree (cmp, _fromInternal, set (path, key, value)) }
}


// ## Internal tree structure
// A constructor function `Node`, the `copy`- and 
// the AA tree's `skew` and `split` functions. 

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


// ## Internal cursor structure
// Cursors (paths) are represented internally as a linked list of nodes,
// `path := null | { node, branch:-1|0|1, tail:path }`, representing a pointer
// at the left branch (-1), right branch (1), or the node itself (0).

const log = console.log.bind (console)

// ## Cursor navigation methods

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



// ## Set
// `set (p, n0, k, v)` reconstructs an (internal) AA tree from a path `p`,
// but with the value of the selected node `n0` set to 'v'. 

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


// ## Unset
// `unset(p, n0)` reconstructs an (internal) AA tree from a path `p`,
// but with the selected node `n0` removed. 

// Assumes path !== null && path.branch === 0 && path.node !== EMPTY

function unset (path) {
  var n0 = path.node
    , p = path.tail

  // If n0 is not a leaf node, copy it for swapping its value with
  // a leaf node and extend the path upto just above a leaf node
  // by going left.right* and swap the values

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

  // Then, reconstruct a tree from the path. 
  // Make sure to copy nodes on the path, decrease and rebalance on the way. 
  // TODO don't copy more than strictly necessary!

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

AATree._private = { Node:Node, EMPTY:EMPTY, _fromInternal:_fromInternal }
module.exports = AATree
})();