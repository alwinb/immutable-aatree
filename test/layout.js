const AATree = require ('../lib/aatree.js')
const log = console.log.bind (console)
module.exports = { Canvas, layout2, toSvg }

// Layered Graph Layout
// --------------------
// Takes a layered map of nodes and computes their (x,y) positions. 
// It horizontally spaces out the nodes in each row. 

class Row { // Non-placed; so; dimensions of a rect; with items

  constructor (width = 0, height = 0, depth = 0, items = []) {
    this.width = width
    this.height = height
    this.depth = depth
    this.items = items
  }

  add (item) {
    const { pic } = item
    this.width += pic.width
    this.height = Math.max (this.height, pic.height)
    this.depth = Math.max (this.depth, pic.depth)
    this.items.push (item)
    return this
  }

}

// picFor is a function that returns node 'pictures'
// for the nodes to be drawn; with a shape, width height, depth. 
// grouped; is a filled out table: 

function layout2 (layers, picFor, getSub = (o, k) => o[k]) {
  let positions = new Map ()
  let rows = []
  let width = 0
  let height = 0
  
  // layers are ordered from top to bottom
  // this is already given to us by the groupBy function

  // So first, fill each of the rows;
  // we cannot do actual layout yet, as we do not yet know the 
  // horizontal added space needed

	layers.forEach (function (row, row_key) { // row[i]:X
    var renderedRow = new Row ()
    renderedRow.y = height
    for (let item of row) {
      renderedRow.add ({ node:item, pic:picFor (item) })
    }
    rows.unshift (renderedRow)
    height += (renderedRow.height + renderedRow.depth)
    width = Math.max (width, renderedRow.width)
  })

  const C = new Canvas ({ left:0, right:width, top:-rows[rows.length-1].height, bottom:height  })
  //log (C.rect)

  // We now have the heights and withs of each of the rows
  // So .. continue, bottom up by computing the space between
  // and actually drawing the nodes

  for (let renderedRow of rows) {
    var items = renderedRow.items
    var space = (width - renderedRow.width) / items.length
    var w = 0, i=0
    
    // now moving bottom up
		for (let { node, pic } of items) { // id:X node:GX
      //log ('start actual layout, row', renderedRow, {id, node, pic})
      let x = (i+.5) * space + w + (pic.width)/2
      let pt = { x, y:renderedRow.y, pic }
      positions.set (node, pt)
      w += pic.width
      i++
      C.path ('node '+pic.class, pt, pic.shape)

      C.rect (pt.x - pic.width/2, pt.y-pic.height, pic.width, pic.height)
      C.rect (pt.x - pic.width/2, pt.y, pic.width, pic.depth)
    }
    
    // Third pass: draw the arcs
		for (let { node, pic } of items) {
      const pt = positions.get (node)
      //log ([pt.x, pt.y])
      if (pic.label != null)
        C.label ('label '+pic.class, pt, pic.label)
      for (let a of pic.anchors) {
        let to = positions.get (getSub (node, a.for))
        if (to){
          if (to.pic.anchor) to = { x: to.x + to.pic.anchor.x, y: to.y + to.pic.anchor.y }
          C.arc (a.class, addPt (pt, a.from), a.dir,  to, a.bend )
        }
      }
    }
    
  }
  return C
}


// Geometry
// --------

// Placed rect
const unitRect = { left:0, right:0, top:0, bottom:0 }

function distance (p1, p2) { // assuming all positive
	var w = p1.x > p2.x ? p1.x-p2.x : p2.x-p1.x
	var h = p1.y > p2.y ? p1.y-p2.y : p2.y-p1.y
	return Math.sqrt(w*w+h*h) }

function addPt ({x,y}, b = {x:0, y:0}) {
  return { x:x+b.x, y:y+b.y }
}

function mova (p, a, d) { // @return point at distance d from p in direction a (clockwise turns)
	var a_ = a * (Math.PI * 2)
	var dy = Math.cos (a_) * -d
	var dx = Math.sin (a_) * d
	return { x: p.x + dx, y: p.y + dy} }

function grow (rect, p) { // make rect include point p
	return { left: Math.min (rect.left, p.x)
		, right: Math.max (rect.right, p.x)
		, top: Math.min (rect.top, p.y)
		, bottom: Math.max (rect.bottom, p.y) } }


// Canvas/ svg generator
// ---------------------

function Canvas (rect_ = unitRect) {
	let nodes = []
    , arcs = []
    , labels = []
    , bounds = rect_

  this.bounds = bounds // bounding rectangle

  this.render = function* () {
    const { left, right, top, bottom } = bounds
  	const w = bounds.right - bounds.left
    const h = bounds.bottom - bounds.top
  	yield `<svg width="${_round(w)}" height="${_round(h)}">`
    yield `<g transform="translate(${_round(-bounds.left+.5)} ${(-bounds.top+.5)})">`
    yield* arcs
    yield `<g class="nodes">`
    yield* nodes
    yield `</g>`
    yield* labels
    yield `</g>`
    yield `</svg>`
  }

  this.rect = function rect (x, y, w, h) {
  	nodes.push (`<rect x="${x}" y="${y}" width="${w}" height="${h}" />`+'\n') }

  this.path = function path (name, p, d) {
  	nodes.push (`<path transform="translate(${_round(p.x)} ${_round(p.y)})" class="${name}" d="${d}" />`+'\n') }

  this.arc = function arc (name, p1, a, p2, _s = .5, _o = 3) {
  	var h1 = mova(p1, a, _o), h = mova(p1, a, distance(p1, p2)*_s)
  	bounds = grow (bounds, h)
  	var d = ['M', p1.x, p1.y, 'L', h1.x, h1.y, 'Q', h.x, h.y, p2.x, p2.y].map(_round).join(' ')
  	arcs.push (`<path ${name != null ? `class="${name}"` : ''} d="${d}" />` + '\n') }

  this.label = function label (name, p, text) { // FIXME escape text
  	labels.push ('<text class="'+name+'" x="'+p.x+'" y="'+(p.y-1.3)+'">'+text+'</text>\n') }
}

function _round (n) {
	return typeof n === 'number' ? Math.round(10*n)/10 : n }



////////////

const json = x => JSON.stringify (x, null, 2)

function picFor (node) {
  return {
    width:45,
    height:50,
    depth:35,
    anchor:{x:0, y:-20},
    class:'node',
    shape:'M-15 -20 h30 v30 h-30 z',
    label: json (node.key) + '',// + ': '+node.value,
    anchors:[
      { for:'l', from:{x:-15, y:0}, dir:-3/8, bend:0 },
      { for:'r', from:{x: 15 ,y:0}, dir: 3/8, bend:0 }
    ]
  }
}

function toSvg (tree, out) {

  let visited = new WeakSet ()
  let layers = new AATree ((a,b) => -AATree.defaultCompare(a,b))
  f (tree.store)

  function f (node) {
    if (visited.has (node)) return
    var p = layers.select (node.level)
    if (p.found) p.value.push (node)
    else layers = p.set ([node])
    visited.add (node)
    if (node.level === 1) return
    f (node.l)
    f (node.r)
  }

  const C = layout2 (layers, picFor)
  out.write ('<style>rect{stroke:#0ec6;fill:none;}path{fill:none;stroke:black;}text{text-anchor:middle;fill:black;}path.node{fill:white;}</style>')
  for (const chunk of C.render ())
    out.write (chunk)
}