/**
 * This file is a reimplementation of the game written at:
 * 
 * https://github.com/Quuxplusone/Advent/blob/master/POHL0350/
 * 
 * Basically, it's the 350-point version of the Colossal Cave Adventure as written by
 * Jerry Pohl in 1984. (And of course based on the game created by Will Crowther, and
 * extended by Don Woods.)
 *
 * This file exports a factory for new game objects. These objects should be passed
 * back into this file whenever we're trying to advance the game. These game objects
 * can be safely converted to and from JSON.
 */

const _ = require('lodash');

const STRINGS = _loadStrings();

const DEF = require('./defs.json');

const MAXOBJ   = 100;  // max # of objects in cave
const MAXWC    = 301;  // max # of adventure words
const MAXLOC   = 145;  // max # of cave locations 
const WORDSIZE = 20;   // max # of chars in commands
const MAXMSG   = 201;  // max # of action messages

const MAXTRAV  = 16+1; // max # of travel directions from loc 
const DWARFMAX = 7;    // max # of nasty dwarves
const MAXDIE   = 3;    // max # of deaths before close
const MAXTRS   = 79;   // max # of treasures in cave


function createGame() {

}

function GameState(prev) {
  _(this)
    .assign(prev)
    .defaults({
      done: false,
      bug: -1,

      turns: 0,
      loc: 0,
      oldloc: 0,
      oldloc2: 0,
      newloc: 0,
      cond: new Array(MAXLOC + 1).fill(0),
      place: new Array(MAXOBJ).fill(0),
      fixed: new Array(MAXOBJ).fill(0),
      visited: new Array(MAXLOC + 1).fill(0),
      prop: new Array(MAXOBJ).fill(0),
      tally: 0,
      tally2: 0,
      limit: 0,
      lmwarn: 0,
      wzdark: 0,
      closing: 0,
      closed: 0,
      holding: 0,
      detail: 0,
      knfloc: 0,
      clock: 0,
      clock2: 0,
      panic: 0,
      dloc: new Array(DWARFMAX).fill(0),
      dflag: 0,
      dseen: new Array(DWARFMAX).fill(0),
      odloc: new Array(DWARFMAX).fill(0),
      daltloc: 0,
      dkill: 0,
      chloc: 0,
      chloc2: 0,
      bonus: 0,
      numdie: 0,
      object1: 0,
      gaveup: 0,
      foobar: 0,
      saveflg: 0,
      dbugflg: 0,
    })
    .value();
}

function advance() {

}


/*
 * Will exit a state object, and give a bug value:
 */
function _bug(state, code) {
  state.done = true;
  state.bug = 
}

function _loadStrings() {
  return _.assign({},
    require('./shortCave.json'),
    require('./longCave.json'),
    require('./items.json'),
    require('./dialogue.json'),
    require('./travel.json')
  );
}

