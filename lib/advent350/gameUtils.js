/**
 * A bunch of minimalist util functions that apply to state objects.
 */

const DEF = require('./vars/defs.json');
const stat = DEF.status;
const obj = DEF.obj;

const MAXOBJ   = 100;  // max # of objects in cave
const DWARFMAX = 7;    // max # of nasty dwarves

const roomFlag = (s, room, prop) => Boolean(s.cond[room] & stat[prop]);
const locFlag = (s, prop) => roomFlag(s, s.loc, prop);
const isLight = (s, obj) => locFlag(s, "LIGHT") || s.prop[obj.LAMP] || s.here[obj.LAMP];

exports.roomFlag = roomFlag;
exports.locFlag = locFlag;
exports.dark    = (s) => !isLight(s);
exports.here    = (s, item) => s.place[item] === s.loc || exports.toting(item);
exports.toting  = (s, item) => s.place[item] === -1;
exports.forced  = (s, here) => s.cond[here] === 2 || s.cond[here] === 3;
exports.pct     = (x) => Math.random() * 100 < x;
exports.at      = (s, item) => s.place[item] === s.loc || s.fixed[item] === s.loc;
exports.destroy = (s, obj) => move(s, obj, 0);
exports.move    = move;
exports.carry   = carry;
exports.drop    = drop;
exports.put     = put;
exports.dcheck  = dcheck;
exports.liq     = liq;
exports.liqloc  = liqloc;
exports.liq2    = liq2;


function move(s, obj, dest) {
  var from = (obj < MAXOBJ)
    ? s.place[obj]
    : s.fixed[obj - MAXOBJ];
  if (from > 0 && from <= 300) {
    carry(s, obj);
  }
  drop(s, obj, dest);
}

function carry(s, obj) {
  if (obj >= MAXOBJ || s.place[obj] === -1) { return; }
  s.place[obj] = -1;
  s.holding ++;
}

function drop(s, obj, dest) {
  if (obj < MAXOBJ) {
    if (s.place[obj] === -1) {
      holding--;
    }
    s.place[obj] = dest;
  } else {
    s.fixed[obj-MAXOBJ] = dest;
  }
}

function put(s, obj, dest, pval) {
  move(s, obj, dest);
  return (-1) - pval;
}

function dcheck(s) {
  for (var i=1; i<DWARFMAX-1; i++) {
    if (s.dloc[i] === s.loc) {
      return i;
    }
  }
  return 0;
}

function liq(s) {
  var i = s.prop[obj.BOTTLE];
  var j = (-1) - i;
  return liq2(Math.max(i, j));
}

function liqloc(s) {
  if (locFlag(s, "LIQUID")) {
    return liq2(s, locFlag(s, "WATOIL"));
  } else {
    return liq2(s, 1);
  }
}

function liq2(s, pbottle) {
  return (1 - pbottle) * obj.WATER + (pbottle >> 1) * (obj.WATER + obj.OIL);
}
