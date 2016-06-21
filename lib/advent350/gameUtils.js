"use strict";

/**
 * A bunch of minimalist util functions that apply to state objects.
 */

const MT = require('mersenne-twister');

const DEF = require('./vars/defs.json');
const TRAV = require('./vars/travel.json');
const stat = DEF.status;
const obj = DEF.obj;

const MAXOBJ   = 100;  // max # of objects in cave
const DWARFMAX = 7;    // max # of nasty dwarves

// Create new Mersenne-Twister object for random values, and seed it
// by default with 4 bytes pulled from Node's crypto lib:
const crypto = require('crypto');
const seed = crypto.randomBytes(4).readInt32LE(0);
const gen = new MT(seed);

const roomFlag = (s, room, prop) => Boolean(s.cond[room] & stat[prop]);
const locFlag = (s, prop) => roomFlag(s, s.loc, prop);
const isLight = (s) => locFlag(s, "LIGHT") || (s.prop[obj.LAMP] && here(s, obj.LAMP));
const here = (s, item) => s.place[item] === s.loc || exports.toting(s, item);

exports.reseed  = (seed) => gen.init_seed(seed);
exports.roomFlag = roomFlag;
exports.locFlag = locFlag;
exports.travels = travels;
exports.dark    = (s) => !isLight(s);
exports.here    = here;
exports.toting  = (s, item) => s.place[item] === -1;
exports.forced  = (s, here) => s.cond[here] === 2 || s.cond[here] === 3;
exports.pct     = (x) => gen.random() * 100 < x;
exports.at      = (s, item) => s.place[item] === s.loc || s.fixed[item] === s.loc;
exports.destroy = (s, obj) => move(s, obj, 0);
exports.randint = (max) => Math.floor(gen.random() * max);
exports.move    = move;
exports.carry   = carry;
exports.drop    = drop;
exports.put     = put;
exports.dcheck  = dcheck;
exports.liq     = liq;
exports.liqloc  = liqloc;
exports.liq2    = liq2;


// Returns the travel array for a location:
function travels(loc) {
  return TRAV.travel[loc - 1]
    .map(x => parseInt(x, 10))
    .map(function (t) {
      var tcond = t % 1000;
      t = Math.floor(t / 1000);
      var tverb = t % 1000;
      t = Math.floor(t / 1000);
      var tdest = t % 1000;
      return { tcond, tverb, tdest };
    });
}

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
      s.holding--;
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
  }
  return liq2(s, 1);
}

function liq2(s, pbottle) {
  return (1 - pbottle) * obj.WATER + (pbottle >> 1) * (obj.WATER + obj.OIL);
}
