const log = console.log.bind (console)
const { defineProperties:define } = Object

// AATree
// ======

const LEFT = -1
const RIGHT = 1
const EMPTY = Node (null, null, 0, null, null)
  EMPTY.l = EMPTY.r = EMPTY

class AATree {

  constructor (compare = AATree.defaultCompare, store = EMPTY, size = 0) {
    if (typeof compare !== 'function')
      throw new Error ('First argument to AATree must be a comparison function.')
    define (this, {
      size: { value: size, enumerable:true },
      store: { value: store },
      compare: { value: compare }
    })
  }

  static defaultCompare (a, b) {
    const ta = typeof a, tb = typeof b
    return ta < tb ? -1 : ta > tb ? 1 : a < b ? -1 : a > b ? 1 : 0
  }

  lookup (key) { 
    const { compare } = this
    let node = this.store
    while (node.level) {
      const branch = compare (key, node.key)
      if (branch === 0) return { found:true, key, value:node.value }
      else node = branch < 0 ? node.l : node.r }
    return { found:false }
  }

  has (key) {
    return this.lookup (key) .found
  }

  get (key) {
    return this.lookup (key) .value
  }

  select (key) {
    const { compare } = this
    let node = this.store, path = null
    while (node.level) {
      const branch = compare (key, node.key)
      path = { branch, node, parent:path }
      if (branch === 0) return new Cursor (this, path, key)
      else node = branch < 0 ? node.l : node.r }
    return new Cursor (this, path, key)
  }

  insert (...pairs) {
    let r = this
    const l = pairs.length
    for (let i = 0; i < l; i += 2)
      r = r.select (pairs [i]) .set (pairs [i + 1])
    return r
  }

  remove (...keys) {
    let r = this
    for (let key of keys) r = r.select (key) .unset ()
    return r
  }

  forEach (fn, thisArg) {
    const pairs = this._stream ()
    let pair = pairs.next ()
    while (pair !== null) {
      fn.call (thisArg, pair.value, pair.key, this)
      pair = pairs.next ()
    }
  }

  [Symbol.iterator] () {
    return this.entries ()
  }

  keys () {
    const fn = p => ({ value: p.key })
    return this._stream (fn, { done:true })
  }

  values () {
    const fn = p => ({ value: p.value })
    return this._stream (fn, { done:true })
  }

  entries () {
    const fn = p => ({ value: [p.key, p.value] })
    return this._stream (fn, { done:true })
  }

  _stream (_fn = x => x, done = null) {
    let n = this.store
    const stack = []
    const it = { next }
    it [Symbol.iterator] = () => it
    return it
    /* where */
    function next () {
      while (n !== EMPTY) {
        stack.push (n)
        n = n.l }
      if (stack.length) {
        const n_ = stack.pop ()
        n = n_.r
        return _fn (n_) }
      return done
    }
  }

}

AATree.prototype.seach = AATree.prototype.lookup


// Cursor

class Cursor {
  
  constructor (owner, path, key) {
    const found = path != null && path.branch === 0
    this.found = found
    this.key = found ? path.node.key : key
    this.value = found ? path.node.value : undefined
    define (this, { path: { value:path }, owner: { value:owner } })
  }

  previous () {
    const path2 = previous (this.path)
    return path2 ? new Cursor (this.owner, path2) : null }

  next () {
    const path2 = next (this.path)
    return path2 ? new Cursor (this.owner, path2) : null }

  unset () {
    if (!this.found) return this.owner
    return new AATree (this.owner.compare, unset (this.path), this.owner.size -1) }

  set (value) {
    const size = this.found ? this.owner.size : this.owner.size + 1
    return new AATree (this.owner.compare, set (this.path, this.key, value), size) }
}

Cursor.prototype.prev = Cursor.prototype.previous


// AATree core, internal data structure and operations

function Node (key, value, level, left, right) {
  return { l:left, level, key, value, r:right } }

function skew (n) { // immutable
  const { l, level } = n
  return (level && level === l.level) ?
    Node (l.key, l.value, l.level, l.l, Node (n.key, n.value, level, l.r, n.r)) :
    n }

function split (n) { // immutable
  const { level, r } = n
  return (n.level && n.level === r.r.level) ?
    Node (r.key, r.value, r.level+1, Node (n.key, n.value, n.level, n.l, r.l), r.r) : 
    n }

function copy (n) {
  if (n === EMPTY) return n
  return { l:n.l, level:n.level, key:n.key, value:n.value, r:n.r } }


// AATree Cursor core, internal data structure and operations
// Cursors (paths) are stored as a linked list of nodes,
// `path := null | { branch:-1|0|1, node, parent:path }`, representing a pointer
// at the left branch (-1), right branch (1), or at the node itself (0).

function next (p) {
  if (!p) return p

  if (p.branch < 0)
    return { branch:0, node:p.node, parent:p.parent }

  if (p.node.r.level === 0) { 
    while (p != null && p.branch >= 0)
      p = p.parent
    if (p)
      p = { branch:0, node:p.node, parent:p.parent }
  }
  else {
    p = { branch:LEFT, node:p.node.r, parent: { branch:1, node:p.node, parent:p.parent } }
    while (p.node.l.level)
      p = { branch:LEFT, node:p.node.l, parent:p }
    p.branch = 0
  }
  return p
}


function previous (p) {
  if (!p) return p

  if (p.branch > 0)
    return { branch:0, node:p.node, parent:p.parent }

  if (p.node.l.level === 0) { 
    while (p != null && p.branch <= 0)
      p = p.parent
    if (p)
      p = { branch:0, node:p.node, parent:p.parent }
  }
  else {
    p = { branch:RIGHT, node:p.node.l, parent: { branch:-1, node:p.node, parent:p.parent } }
    while (p.node.r.level)
      p = { branch:RIGHT, node:p.node.r, parent:p }
    p.branch = 0
  }
  return p
}


// `set (p, key, value)` reconstructs an (internal) AA tree from a path `p`,
// but with the value of the head node of the path set to 'value'. 

function set (p, key, value) {
  let n, r
  if (p !== null && p.branch === 0) { // found
    n = p.node
    r = Node (key, value, n.level, n.l, n.r)
    p = p.parent }
  else
    r = Node (key, value, 1, EMPTY, EMPTY)
  while (p !== null) {
    n = p.node
    r = (p.branch === RIGHT)
      ? Node (n.key, n.value, n.level, n.l, r)
      : Node (n.key, n.value, n.level, r, n.r)
    r = split (skew (r))
    p = p.parent }
  return r }


// `unset(path)` reconstructs an (internal) AA tree structure from a path `p`,
// but with the head node of the path removed. 

/* Assumes path !== null && path.branch === 0 && path.node !== EMPTY */

function unset (path) {
  let n0 = path.node
    , p = path.parent

  /* If n0 is not a leaf node, 
    copy it for swapping its value with
    a leaf node and extend the path upto just above a leaf node
    by going left.right* and swap the values */

  if (n0.l.level) {
    n0 = copy (n0)
    p = { branch:LEFT, node:n0, parent:p }
    let n = n0.l
    while (n.r.level) {
      p = { branch:RIGHT, node:n, parent:p }
      n = n.r }
    n0.key = n.key
    n0.value = n.value }

  else if (n0.r.level) {
    p = { branch:RIGHT, node:n0.r, parent:p } }

  /* Then, reconstruct a tree from the path. 
    Make sure to copy nodes on the path, decrease and rebalance on the way. 
    NB, could still be optimized further to ensure that nothing more is copied
    than strictly necessary */

  let t = EMPTY
  while (p !== null) {
    const n = p.node
    t = (p.branch === RIGHT)
      ? Node (n.key, n.value, n.level, n.l, t)
      : Node (n.key, n.value, n.level, t, n.r)

    if (t.l.level < t.level-1 || t.r.level < t.level-1) {
      t.level--
      t.r = copy (t.r)
      if (t.r.level > t.level) t.r.level = t.level
      t = skew (t)
      t.r = skew (t.r)
      t.r.r = skew (copy (t.r.r))
      t = split (t)
      t.r = split (t.r)
    }
    p = p.parent
  }
  return t
}


// Exports
// -------

const core = { Node, Empty:EMPTY }
define (AATree, { core: { value:core } })
export default AATree