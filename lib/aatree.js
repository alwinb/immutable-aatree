"use strict"
const log = console.log.bind (console)
const _fromInternal = {}


// Default comparison

AATree.defaultCompare = function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0 }

// AATree

function AATree (cmp, _from, store) {
  /* private */
  cmp = arguments.length ? cmp : AATree.defaultCompare
  store = _from === _fromInternal ? store : EMPTY
  const self = this

  /* public */
  this.lookup = this.search = lookup
  this.select = select
  this.insert = insert
  this.remove = this['delete'] = remove
  this.stream = stream
  this.forEach = forEach
  this.__reify = function () { return store }

  /* init */
  if (typeof cmp !== 'function')
    throw new Error ('First argument to AATree must be a comparison function.')


function lookup (k) {
  let n = store
  while (n !== EMPTY) {
    const c = cmp (k, n.k)
    if (c === 0) return { found:true, key:k, value:n.v }
    else n = (c < 0) ? n.l : n.r }
  return { found:false } }


function select (k) {
  let n = store, p = null
  while (n !== EMPTY) {
    const c = cmp (k, n.k)
    p = { branch:c, node:n, tail:p }
    if (c === 0) return new Cursor (cmp, self, p, n.k)
    else n = (c < 0) ? n.l : n.r }
  return new Cursor (cmp, self, p, k) }


function remove (k) {
  let r = self
  for (let i=0,l=arguments.length; i<l; i++)
    r = r.select (arguments[i]) . unset ()
  return r }


function insert (k1, v1, k2, v2, _) {
  let r = self
  for (let i=0,l=arguments.length; i<l; i+=2)
    r = r.select (arguments[i]) . set (arguments[i+1])
  return r }


function forEach (fn, thisArg) {
  const pairs = stream ()
  let p = pairs.next ()
  while (p !== null) {
    fn.call (thisArg, p.value, p.key, self)
    p = pairs.next () } }


function stream () {
  let n = store
  const stack = []
  return { next:next }
  /* where */
  function next () {
    while (n !== EMPTY) {
      stack.push(n)
      n = n.l }
    if (stack.length) {
      const n_ = stack.pop()
      n = n_.r
      return { key:n_.k, value:n_.v } }
    return null } }

}

// Cursor

function Cursor (cmp, owner, path, key) {
  const found = path != null && path.branch === 0

  this.found = found
  this.key = found ? path.node.k : key
  this.value = found ? path.node.v : this.value
  this.previous = _previous
  this.next = _next
  this.set = _set
  this.unset = _unset

  function _previous () {
    const path2 = previous (path)
    return path2 ? new Cursor (cmp, owner, path2) : null }

  function _next () {
    const path2 = next (path)
    return path2 ? new Cursor (cmp, owner, path2) : null }

  function _unset () {
    if (!found) return owner
    return new AATree (cmp, _fromInternal, unset (path)) }

  function _set (value) {
    return new AATree (cmp, _fromInternal, set (path, key, value)) }
}


// AATree core, internal data structure and operations

const LEFT = -1
const RIGHT = 1
const EMPTY = Node (null, undefined, 0, null, null)
EMPTY.l = EMPTY.r = EMPTY

function Node (key, value, level, left, right) {
  return { l:left, lv:level, k:key, v:value, r:right } }

function skew (n) { // immutable
  if (!n.lv) return n
  const l = n.l
  return (l.lv === n.lv)
    ? Node (l.k, l.v, l.lv, l.l, Node (n.k, n.v, n.lv, l.r, n.r))
    : n }

function split (n) { // immutable
  if (!n.lv) return n
  const r = n.r
  return (r.r.lv === n.lv)
    ? Node (r.k, r.v, r.lv+1, Node (n.k, n.v, n.lv, n.l, r.l), r.r)
    : n }

function copy (n) {
  if (n === EMPTY) return n
  return { l:n.l, lv:n.lv, k:n.k, v:n.v, r:n.r } }


// AATree Cursor core, internal data structure and operations
// Cursors (paths) are stored as a linked list of nodes,
// `path := null | { branch:-1|0|1, node, tail:path }`, representing a pointer
// at the left branch (-1), right branch (1), or at the node itself (0).

function next (p) {
  if (!p)
    return p

  if (p.branch < 0)
    return { branch:0, node:p.node, tail:p.tail }

  if (p.node.r === EMPTY) { 
    while (p != null && p.branch >= 0)
      p = p.tail
    if (p)
      p = { branch:0, node:p.node, tail:p.tail }
  }
  else {
    p = { branch:LEFT, node:p.node.r, tail: { branch:1, node:p.node, tail:p.tail } }
    while (p.node.l !== EMPTY)
      p = { branch:LEFT, node:p.node.l, tail:p }
    p.branch = 0
  }
  return p
}


function previous (p) {
  if (!p)
    return p

  if (p.branch > 0)
    return { branch:0, node:p.node, tail:p.tail }

  if (p.node.l === EMPTY) { 
    while (p != null && p.branch <= 0)
      p = p.tail
    if (p)
      p = { branch:0, node:p.node, tail:p.tail }
  }
  else {
    p = { branch:RIGHT, node:p.node.l, tail: { branch:-1, node:p.node, tail:p.tail } }
    while (p.node.r !== EMPTY)
      p = { branch:RIGHT, node:p.node.r, tail:p }
    p.branch = 0
  }
  return p
}


// `set (p, k, v)` reconstructs an (internal) AA tree from a path `p`,
// but with the value of the head node of the path set to 'v'. 

function set (p, k, v) {
  let n, r
  if (p !== null && p.branch === 0) { // found
    n = p.node
    r = Node (k, v, n.lv, n.l, n.r)
    p = p.tail }
  else
    r = Node (k, v, 1, EMPTY, EMPTY)
  while (p !== null) {
    n = p.node
    r = (p.branch === RIGHT)
      ? Node (n.k, n.v, n.lv, n.l, r)
      : Node (n.k, n.v, n.lv, r, n.r)
    r = split (skew (r))
    p = p.tail }
  return r }

// `unset(path)` reconstructs an (internal) AA tree structure from a path `p`,
// but with the head node of the path removed. 

/* Assumes path !== null && path.branch === 0 && path.node !== EMPTY */

function unset (path) {
  let n0 = path.node
    , p = path.tail

  /* If n0 is not a leaf node, copy it for swapping its value with
    a leaf node and extend the path upto just above a leaf node
    by going left.right* and swap the values */

  if (n0.l !== EMPTY) {
    n0 = copy (n0)
    p = { branch:LEFT, node:n0, tail:p }
    let n = n0.l
    while (n.r !== EMPTY) {
      p = { branch:RIGHT, node:n, tail:p }
      n = n.r }
    n0.k = n.k
    n0.v = n.v }

  else if (n0.r !== EMPTY) {
    p = { branch:RIGHT, node:n0.r, tail:p } }

  /* Then, reconstruct a tree from the path. 
    Make sure to copy nodes on the path, decrease and rebalance on the way. 
    NB, could still be optimized further to ensure that nothing more is copied
    than strictly necessary */

  let t = EMPTY
  while (p !== null) {
    const n = p.node
    t = (p.branch === RIGHT)
      ? Node (n.k, n.v, n.lv, n.l, t)
      : Node (n.k, n.v, n.lv, t, n.r)

    if (t.l.lv < t.lv-1 || t.r.lv < t.lv-1) {
      t.lv--
      t.r = copy (t.r)
      if (t.r.lv > t.lv) t.r.lv = t.lv
      t = skew (t)
      t.r = skew (t.r)
      t.r.r = skew (copy (t.r.r))
      t = split (t)
      t.r = split (t.r)
    }
    p = p.tail
  }
  return t
}

// Exports

AATree.__internal = { Node:Node, EMPTY:EMPTY, from:_fromInternal }
module.exports = AATree