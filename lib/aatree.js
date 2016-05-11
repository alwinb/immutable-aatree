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
  return _AATree(cmp, empty) }

function _AATree (cmp, store) { /* private constructor */
  var self = { lookup:lookup, insert:insert, stream:stream, each:each }
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
    if (n === empty)
      return { found:false, key:k, set:setter(cmp, p, n, k) }
    c = cmp(k, n.k)
    if (c === 0)
      return { found:true, key:k, value:n.v, set:setter(cmp, p, n, k) }
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
    while (n !== empty) {
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

var empty = node (null, null, 0, null, null)

function node (key, value, level, left, right) {
  return { l:left, lv:level, k:key, v:value, r:right } }

function skew (n) { // immutable
  var l = n.l
  return (l.lv === n.lv)
    ? node (l.k, l.v, l.lv, l.l, node (n.k, n.v, n.lv, l.r, n.r))
    : n }

function split (n) { // immutable
  var r = n.r
  return (r.r.lv === n.lv)
    ? node (r.k, r.v, r.lv+1, node (n.k, n.v, n.lv, n.l, r.l), r.r)
    : n }

function setter (cmp, p, n0, k) {
  return function set (v) {
    var r = (n0 === empty)
      ? node(k, v, 1, empty, empty)
      : node(k, v, n0.lv, n0.l, n0.r)
    while (p !== null) {
      var n = p.node
      r = (p.branch === 1)
        ? node (n.k, n.v, n.lv, n.l, r)
        : node (n.k, n.v, n.lv, r, n.r)
      r = split(skew(r))
      p = p.tail }
    return _AATree(cmp, r) } }

module.exports = AATree
})();