;(function(){ "use strict";

// # AA trees. 
// This is a minimalistic implementation of [persistent][1]
// ordered dictinaries via [AA trees][2]
//
// [1]: (https://en.wikipedia.org/wiki/Persistent_data_structure)
// [2]: (https://en.wikipedia.org/wiki/AA_tree)

// ## Public construtor
// Given a comparison function `cmp` for keys,
// the constructor `AATree (cmp)` returns an empty AA tree, an object
// with four pure functions `{ lookup, insert, stream, each }`.

function AATree (cmp) { /* public constructor */
  if (typeof cmp !== 'function')
    throw new Error('First argument to AATree must be a comparison function.')
  return _AATree(cmp, EMPTY) }

function _AATree (cmp, store) { /* private constructor */
  var self = { lookup:lookup, insert:insert, stream:stream, each:each }
	self._reify = function () { return store }
	self._dereify = function (store2) { store = store2 }
  return self

// ## Lookup
//  Lookup a key `k`, returns a 'cursor' object  
// `{ found:false, key:k, set }` if the key was not found or  
// `{ found:true,  key:k, value:v, set }` if it was found and has value `v`.
//  Cursor objects have a function `set(v)` that returns the AA Tree
//  obtained by setting `k` to have value `v`. 

function lookup (k) {
  var n = store, p = null, c
  /* p is an internal cursor object;
   a path of nodes: path := null | { node, branch:-1|1, tail:path } */
  while (true) {
    if (n === EMPTY)
      return { found:false, key:k, set:setter(cmp, p, n, k) }
    c = cmp(k, n.k)
    if (c === 0)
      return { found:true, key:k, value:n.v, set:setter(cmp, p, n, k), unset:unsetter(cmp, p, n) }
    p = { branch:c, node:n, tail:p } // branch: -1 = left, 1 = right
    n = (c < 0) ? n.l : n.r } }

// ## Insert
// Insert an arbitrary number of key value pairs at once. 
// Note that for a single pair, `t.insert(k, v)` is equivalent to `t.lookup(k).set(v)`.

function insert (k1, v1, k2, v2, _) {
  var r = self
  for (var i=0,l=arguments.length; i<l; i+=2)
    r = r.lookup(arguments[i]).set(arguments[i+1])
  return r }

// ## Each
// Execute a function `fn (k, v)` for each of the 
// key-value pairs `(k, v)` in the AATree in ascending key order. 

function each (fn) { /* Q: should I add a non-lazy- each for speed? */
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

// ## Private
// A constructor function `node` for the internal node structure,
// and the AA tree's `skew` and `split` functions and 
// the `set`-function constructor `setter`. 

var LEFT = -1, RIGHT = 1
var EMPTY = Node (null, null, 0, null, null)
EMPTY.l = EMPTY.r = EMPTY

function Node (key, value, level, left, right) {
  return { l:left, lv:level, k:key, v:value, r:right } }

function copy (n) {
	if (n === EMPTY) return n
  return { l:n.l, lv:n.lv, k:n.k, v:n.v, r:n.r } }

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

function setter (cmp, p, n0, k) {
  return function set (v) {
    var r = (n0 === EMPTY)
      ? Node (k, v, 1, EMPTY, EMPTY)
      : Node (k, v, n0.lv, n0.l, n0.r)
    while (p !== null) {
      var n = p.node
      r = (p.branch === RIGHT)
        ? Node (n.k, n.v, n.lv, n.l, r)
        : Node (n.k, n.v, n.lv, r, n.r)
      r = split(skew(r))
      p = p.tail }
    return _AATree(cmp, r) } }


// Initially `path` is the path up to, but *excluding* the 
// found node `n0` that is to be removed

function unsetter (cmp, p, n0) {
	return function remove () {

		// If n0 is not a leaf node, copy it for swapping its value with
		// a leaf node and extend the path upto just above a leaf node
		// by going left.right* and swap the values

		if (n0.l !== EMPTY) {
			n0 = copy(n0)
	    p = { branch:LEFT, node:n0, tail:p }
			n = n0.l
			while (n.r !== EMPTY) {
		    p = { branch:RIGHT, node:n, tail:p }
				n = n.r }
			n0.k = n.k
			n0.v = n.v
		}
		else if (n0.r !== EMPTY) {
	  	p = { branch:RIGHT, node:n0.r, tail:p }
		}

		// Then, reconstruct a tree from the path; make sure to copy
		// all nodes on the path, and rebalance on the way. 

		var t = EMPTY
		while (p !== null) {
      var n = p.node
      t = (p.branch === RIGHT)
        ? Node (n.k, n.v, n.lv, n.l, t)
        : Node (n.k, n.v, n.lv, t, n.r)

			// Decrease and rebalance, make sure to
			// copy and not mutate nodes
			// TODO don't copy more than necessary!

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
		return _AATree(cmp, t) } }

AATree._private = { Node:Node, EMPTY:EMPTY }
module.exports = AATree
})();