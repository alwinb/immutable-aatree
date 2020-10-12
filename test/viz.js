const AATree = require('../lib/aatree')
const viz = require('./layout').viz
const log = console.log.bind (console)

let t = new AATree ()

const INSERTS = 5000
for (let i=0; i<INSERTS; i++) {
  let k = Math.round (Math.random () * 2000)
  let v = 'value for ' + k
  t = t.insert (k, v)
}

const REMOVES = 1000
for (let i=0; i<REMOVES; i++) {
  let k = Math.round (Math.random () * 2000)
  let c = t.select (k)// .next ()
  if (c) t = c .unset ()
}

log ('<pre>')
viz (t, process.stdout)
// 205 tells TextMate to show the result as HTML
process.stdout.on ('close', _ => process.exit (205))
process.stdout.end ()
