const log = console.log.bind (console)
module.exports = { Canvas, viz }

// Geometry
// --------

const unitRect = { left:0, right:0, top:0, bottom:0 }

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
  	yield `<svg width="${_round(w)}" height="${_round(h)}">\n`
    yield `<g transform="translate(${_round(-bounds.left+.5)} ${(-bounds.top+.5)})">\n`
    yield* arcs
    yield `<g class="nodes">\n`
    yield* nodes
    yield `</g>\n<g class="labels">\n`
    yield* labels
    yield `</g>\n`
    yield `</svg>`
  }

  this.stub = function (x, y, w, h) {
  	bounds = grow (grow (bounds, {x,y}), {x:x+w, y:y+h})
  }

  this.rect = function rect (x, y, width, height) {
  	bounds = grow (grow (bounds, {x, y}), { x: x + width, y: y + height })
  	nodes.push (`\t<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`+'\n') }

  this.path = function path (name, p, d) {
  	nodes.push (`\t<path transform="translate(${_round(p.x)} ${_round(p.y)})" class="${name}" d="${d}"/>`+'\n') }

  this.line = function line (name, p1, p2) {
  	bounds = grow (grow (bounds, p1), p2)
  	var d = ['M', p1.x, p1.y, 'L', p2.x, p2.y].map(_round).join(' ')
  	arcs.push (`\t<path${name != null ? ` class="${name}"` : ''} d="${d}"/>` + '\n') }

  this.label = function label (name, p, text) { // FIXME escape text
  	labels.push (`\t<text${name != null ? ` class="${name}"` : ''} x="`+p.x+'" y="'+(p.y-1.3)+'">'+text+'</text>\n') }
}

function _round (n) {
	return typeof n === 'number' ? Math.round(10*n)/10 : n }


// Hacked - bottom up tree renderer,
// fold with slight context (for 2-nodes)

function fold (node, fn, isSecond = false) {
  if (node.level === 0) return fn (node)
  const { level, key, value } = node
  const l = fold (node.l, fn, false)
  const r = fold (node.r, fn, node.r.level === level)
  return fn ({l, level, key, value, r }, isSecond)
}

// Bounding box for a single node
// Width, Height, Depth
const W = 48
const H = 25
const D = 15
// Additional padding
const P = 4


const style = `<style>
  rect { stroke:#0ec6; fill:none; }
  path { fill:none; stroke:black; }
  text { text-anchor:middle; fill:black; }
  svg .node { fill:white; }
</style>\n`

function viz (aatree, out = process.stdout) {

  const C = new Canvas ()
  let _x = 0
  const dims = fold (aatree.store, render)

  function render (node, isSecond) {
    const { l, level, key, value, r } = node
    const extra = P * (2**level-2)
    const y = - (level * (H+D) + extra)

    if (level === 0)
      return { level, left:_x, right:_x, x:_x, y, lx:_x, rx:_x }

    let left = l.left
    let right = r.right
    let x = l.x + (r.x - l.x) /2

    if (level === 1) {
      if (r.level === level) {
        x = l.x; _x += 2 * W
      }
      else if (isSecond) x += W
      else _x += W
    }

    else if (level === r.level) {
      x = l.x + (r.rx - r.x)
    }

    drawPic (x, y, key)
    if (l.level)
      C.line (null, {x, y}, {x:l.x, y:l.y-20})
    if (r.level && r.level === level)
      C.line (null, {x, y:y-5}, {x:r.x, y:r.y-5})
    else if (r.level)
      C.line (null, {x, y}, {x:r.x, y:r.y-20})

    return { level, left, right, x, y, lx:l.x, rx:r.x }
  }

  function drawPic (x, y, label) {
    const r1 = [x-W/2, y-H, W, H]
    const r2 = [x-W/2, y, W, D]
    C.stub (...r1)
    C.stub (...r2)
    C.path ('node', {x, y}, 'M-16 -20 h32 v30 h-32 z')
    C.label (null, {x, y}, String (label))
  }

  out.write (style)
  for (let x of C.render())
    out.write (x)
}
