"use strict"
module.exports = { viz:dot, dot:dot }

// This is not pretty - in fact, it is horrible
//  and it's only still here because it's so useful for debugging
//  and I have just not found time to write something half decent to replace it

dot.defaultNode = defaultNode 

function dot (object, customNode) {
	var customNode = customNode != null ? customNode : function (x) {}
	var graph = new Graph ()
		, marked = []
		, idCount = 0
	graph.addNode('n_root', {'style':'invisible'})
	traverse('n_root', '', object)
	removeMarks()
	return graph.toString()

// where

function removeMarks () {
	for (var i=0,l=marked.length; i<l; i++)
		delete marked[i].__viz_id }

function traverse (from_id, key, to_object) {

	// if to_object is marked,
	// then just add an edge

	try { if ('__viz_id' in to_object) {
		graph.edges.push(new Edge(from_id, to_object.__viz_id))//, field))
		return
	} } catch (e) {}

	// otherwise create an id
	// and attempt to mark the object

	var to_id = 'n_'+(idCount++)
	try {
		to_object.__viz_id = to_id
		marked.push(to_object)
	} catch (e) {}

	// create a node using
	//  the custom / built-in functions

	var node = customNode(to_object)
	if (node == null) node = defaultNode (to_object)
	
	if (node.children != null) {
		function fn (key, i) { return '<f'+i+'>'+escape(key) }
		if (node.shape === 'record') {
			node = extend(node)
			node.label = '{'+node.label+'|{'+node.children.map(fn).join('|')+'}}'
		}
		graph.addNode(to_id, node)
		graph.edges.push(new Edge(from_id, to_id))//, field))
		for (var i=0,l=node.children.length; i<l; i++) {
			var key = node.children[i]
			traverse(to_id+':f'+i, key, to_object[key])
		}
	}
	else {
		graph.addNode(to_id, node)
		graph.edges.push(new Edge(from_id, to_id))//, field))
	}
}

}

function defaultNode (obj) {
	var t = typeof obj
	if (obj === null)
		return { label:'null', shape:'point' }

	if (obj === undefined)
		return { label:'null', style:'invisible' }

	if (obj === false || obj === true || obj instanceof Boolean)
		return { label: String (obj) }

	if (t === 'number' || obj instanceof Number)
		return { label: String (obj) }

	if (t === 'string' || obj instanceof String)
		return { label: String (obj) }

	if (typeof obj === 'function')
		return { label: obj.name != null ? '[function '+obj.name+']' : '[function]' }

	if (Array.isArray (obj)) {
		for (var children = [], i=0, l=obj.length; i<l; i++)
			children.push(i)
		return { shape:'record', label:'Array', children:children }
	}

	else {
		var children = []
		for (var a in obj) if (a[0] !== '_' && typeof obj[a] !== 'function')
			children.push(a)
		return { shape:'record', label:'Object', children:children }
	}
}


function extend (obj) {
	function fn () {}
	fn.prototype = obj
	return new fn ()
}

//----

function Node (id, atts = {}) {
	this.id = id;
	this.attributes = atts }

Node.prototype.toString = function () {
	var t = '\t' + this.id + ' ['
	if (!this.attributes.label) t += 'label="" ';
	for (var a in this.attributes)
		if (a !== 'children' && a !== 'rank') t += a + '=' + _escape(this.attributes[a])+' '
 	return t + '];\n' }



function Edge (from, to, label) {
  this.fromId = from
	this.toId = to
	this.label = label }

Edge.prototype.toString = function () {
  return "\t" + this.fromId + ' -> ' + 
  	this.toId + (this.label ? '[label='+_escape(this.label)+'];\n' : ';\n') }



function Graph (v = {}, e = []) {
	this.nodes = v
	this.edges = e
	this.ranks = {} }

Graph.prototype = {
  toString : function(from,to) {
	var t = 'digraph g{\n'
	+ '\trankdir=TB;\n'
	+ '\tedge [fontname="Lucida Grande",fontsize=9];\n'
	+ '\tnode [fontname="Lucida Grande",fontsize=9 height=0.1 width=0.1, shape=rect];\n\n'
	for (var a in this.ranks) t += '\t{rank=same; '+this.ranks[a].join('; ')+'}\n'
	t+= '\n'
	for (var a in this.nodes) t += this.nodes[a];
	for (var a in this.edges) t += this.edges[a];
	return t+ '}\n\n' }

, addNode : function(id, atts) {
		if ('rank' in atts)
			if (atts.rank in this.ranks)
				this.ranks[atts.rank].push(id)
			else 
				this.ranks[atts.rank] = [id]
  	this.nodes[id] = new Node(id,atts)
	}
}

function _escape (str) {
	return '"'+String (str).replace(/"/g, '\\"')+'"' }
