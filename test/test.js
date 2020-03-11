const AATree = require('../lib/aatree')
  , log = console.log.bind (console)
  , assert = require ('assert')


class ReferenceDict {
  
  constructor (compare = AATree.defaultCompare) {
    this.compare = compare
    this.items = []
  }
  
  getPair (k) {
    const fn = ([k2]) => this.compare (k, k2) === 0
    return this.items.find (fn)
  }
  
  get (k) {
    let pair = this.getPair (k)
    return pair && pair[1]
  }

  insert (k, v) {
    let pair = this.getPair (k)
    if (pair) pair[1] = v
    else this.items.push ([k,v])
    return this
  }
  
  remove (k) {
    const fn = ([k2]) => this.compare (k, k2) !== 0
    this.items = this.items.filter (fn)
  }

  *[Symbol.iterator] () {
    this.items = this.items.sort (([k1],[k2]) => this.compare (k1, k2))
    yield* this.items
  }

}

// let ref = new ReferenceImplementation ()
// let pair = ref.insert ([4, '5'])
// assert.equal (ref.get (4), [])



let t = new AATree ()
let r = new ReferenceDict ()

const INSERTS = 1000
for (let i=0; i<INSERTS; i++) {
  let k = Math.round (Math.random () * 2000)
  let v = 'value for ' + k
  t = t.insert (k, v)
  r.insert (k, v)

  assert.strictEqual (t.has (k), true)
  assert.deepStrictEqual (r.get (k), v)
  assert.deepStrictEqual (t.get (k), v)
  assert.strictEqual (countSize (t), r.items.length)
}

assert.deepStrictEqual ([...t], [...r])

const REMOVES = 500
for (let i=0; i<REMOVES; i++) {
  let k = Math.round (Math.random () * 2000)
  let c = t.select (k)// .next ()
  if (c) t = c .unset ()
  r.remove (k)

  assert.equal (t.has (k), false)
  assert.deepStrictEqual (r.get (k), undefined)
  assert.deepStrictEqual (t.get (k), undefined)
  assert.deepStrictEqual (t.lookup (k), { found:false })
}

assert.deepStrictEqual ([...t], [...r])



function countSize (tree) {
  let c = 0
  t.forEach (_ => c++)
  return c
}

function isSorted (iterable, cmp = AATree.defaultCompare) {
  let prev = null
  for (let [k,_] of iterable) {
    if (!prev) prev = k
    else if (cmp (prev, k) >= 0) return false
  }
  return true
}

assert.strictEqual (isSorted (t), true)
assert.strictEqual (isSorted (r), true)
assert.strictEqual (countSize (t), r.items.length)

log ('All tests passed')