"use strict";

/**
 * This file is a reimplementation of the game written at:
 *
 * https://github.com/Quuxplusone/Advent/blob/master/POHL0350/
 *
 * Basically, it's the 350-point version of the Colossal Cave Adventure as
 * written by Jerry Pohl in 1984. (And of course based on the game created by
 * Will Crowther, and then extended by Don Woods.) It's mostly faithful to the
 * original, but I made a few changes here and there...
 */


const _ = require('lodash');
// const logger = require('../../logger');
const gu = require('./gameUtils');


const DEF = require('./vars/defs.json');
const STRINGS = _.assign({},
  require('./vars/shortCave.json'),
  require('./vars/longCave.json'),
  require('./vars/items.json'),
  require('./vars/dialogue.json'),
  require('./vars/travel.json'),
  require('./vars/vocab.json')
);

const MAXOBJ   = 100;  // max # of objects in cave
// const MAXWC    = 301;  // max # of adventure words
const MAXLOC   = 145;  // max # of cave locations
// const WORDSIZE = 20;   // max # of chars in commands
// const MAXMSG   = 201;  // max # of action messages

// const MAXTRAV  = 16+1; // max # of travel directions from loc
const DWARFMAX = 7;    // max # of nasty dwarves
const MAXDIE   = 3;    // max # of deaths before close
const MAXTRS   = 79;   // max # of treasures in cave


// API:
exports.state = state;


function state(obj) {
  return new GameState(obj || {});
}

function GameState(prev) {
  _(this)
    .assign(prev)
    .defaults({
      __v: 0,
      state: "init",
      done: false,
      stopEarly: false,
      loopAgain: false,
      bug: null,
      lines: [],

      word1: null,
      word2: null,
      wordRest: null,

      forcePlugh: false,

      verb: 0,
      object: 0,
      motion: 0,

      turns: 0,
      loc: 2,
      oldloc: 2,
      oldloc2: 2,
      newloc: 1,
      cond: [
        0,5,1,5,5,1,1,5,17,1,1,0,0,32,0,0,2,0,0,64,2,2,2,0,6,0,2,0,0,0,0,2,2,0,
        0,0,0,0,4,0,2,0,128,128,128,128,136,136,136,128,128,128,128,128,136,128,
        136,0,8,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,128,136,136,0,0,8,136,
        128,0,2,2,0,0,0,0,4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1,1,0,0,0,0,0,
        8,8,8,8,8,8,8,8,8,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3
      ],
      place: [
        0,3,3,8,10,11,0,14,13,94,96,19,17,101,103,0,106,0,0,3,3,0,0,109,25,23,
        111,35,0,97,0,119,117,117,0,130,0,126,140,0,96,0,0,0,0,0,0,0,0,0,18,27,
        28,29,30,0,92,95,97,100,101,0,119,127,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
      ],
      fixed: [
        0,0,0,9,0,0,0,15,0,-1,0,-1,27,-1,0,0,0,-1,0,0,0,0,0,-1,-1,67,-1,110,0,
        -1,-1,121,122,122,0,-1,-1,-1,-1,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,121,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0
      ],
      visited: new Array(MAXLOC + 1).fill(0),
      prop: new Array(MAXOBJ/2).fill(0)
        .concat(new Array(MAXOBJ/2).fill(-1)),
      tally: 15,
      tally2: 0,
      limit: 330,
      lmwarn: 0,
      wzdark: 0,
      closing: 0,
      closed: 0,
      holding: 0,
      detail: 0,
      knfloc: 0,
      clock: 30,
      clock2: 50,
      panic: 0,
      dloc: [0,19,27,33,44,64,114],
      dflag: 0,
      dseen: [0,0,0,0,0,0,0],
      odloc: [0,0,0,0,0,0,0],
      daltloc: 18,
      dkill: 0,
      chloc: 114,
      chloc2: 140,
      bonus: 0,
      numdie: 0,
      object1: 0,
      gaveup: 0,
      foobar: 0,
      saveflg: 0,
      dbugflg: 0
    })
    .value();
  Object.seal(this);
}

// Copy in methods from other files:
_.assign(GameState.prototype, require('./methods/movement'));
_.assign(GameState.prototype, require('./methods/verbs'));

GameState.prototype.advance = function advance(msg) {
  msg = String(msg || "");
  this.lines = [];

  if (this.done) { return this.lines; }
  this.stopEarly = false;

  var state_fn = "_state_" + this.state;
  if (_.isFunction(this[state_fn])) {
    this[state_fn](msg);
  } else {
    this._bug("Invalid state encountered: " + this.state);
  }

  return this.lines;
};

GameState.prototype.isDone = function () {
  return Boolean(this.done);
};


/**
 * These methods are called when an advance is done when the game is is various
 * states:
 */
GameState.prototype._state_init = function () {
  this.state = "init_yesno";
  this._rspeak(65);
};


GameState.prototype._state_init_yesno = function (msg) {
  var yesno = this._parseYesNo(msg);
  if (!yesno) { return; }
  if (yesno === 'y') { this._rspeak(1); }
  this.state = "playing";
  this._gameTick();
};


GameState.prototype._state_playing = function (msg) {
  if (!this._handleInputs(msg)) { return; }
  if (this.done) { return; }
  this._gameTick();
};

GameState.prototype._state_death_query = function (msg) {
  var yesno = this._parseYesNo(msg);
  if (!yesno) { return; }

  if (yesno === 'n') {
    this._rspeak(54);
    this.gaveup = 1; // Set the gaveup flag to avoid bonuses during scoring.
    return this._gameOver();
  }

  // Else, the person is begging for resurrection:
  this._rspeak(82 + (this.numdie) * 2);

  if (++this.numdie >= MAXDIE) {
    // This person's died too many times...
    return this._gameOver();
  }

  this.place[DEF.obj.WATER] = 0;
  this.place[DEF.obj.OIL] = 0;
  if (gu.toting(this, DEF.obj.LAMP)) {
    this.prop[DEF.obj.LAMP] = 0;
  }

  // Drop all items either on the ground or (for the lamp) in room 1:
  for (var j=1; j<MAXOBJ; j++) {
    var i = MAXOBJ - j;
    if (gu.toting(this, i)) {
      var drop_room = (i === DEF.obj.LAMP) ? 1 : this.oldloc2;
      gu.drop(this, i, drop_room);
    }
  }

  this.state = "playing";
  this.newloc = 3;
  this.oldloc = this.loc;

  this._gameTick();
};

GameState.prototype._state_dragon_yesno = function (msg) {
  var yesno = this._parseYesNo(msg);
  if (!yesno) { return; }

  this.state = 'playing';

  if (yesno === 'y') {
    this._pspeak(DEF.obj.DRAGON, 1);
    this.prop[DEF.obj.DRAGON] = 2;
    this.prop[DEF.obj.RUG] = 0;
    gu.move(this, DEF.obj.DRAGON+MAXOBJ, -1);
    gu.move(this, DEF.obj.RUG+MAXOBJ, 0);
    gu.move(this, DEF.obj.DRAGON, 120);
    gu.move(this, DEF.obj.RUG, 120);

    for(var i=1; i<MAXOBJ; i++) {
      if (this.place[i] === 119 || this.place[i] === 121) {
        gu.move(this, i, 120);
      }
    }
    this.newloc = 120;
  } else {
    this._rspeak(54);
  }

  this._gameTick();
};

GameState.prototype._state_giveup_yesno = function (msg) {
  var yesno = this._parseYesNo(msg);
  if (!yesno) { return; }

  this._rspeak(54);

  if (yesno === 'n') {
    this.state = "playing";
    this._gameTick();
    return;
  }

  this.gaveup = true;
  this._gameOver();
};

GameState.prototype._state_read_oyster_yesno = function (msg) {
  var yesno = this._parseYesNo(msg);
  if (!yesno) { return; }

  // Note: I can find no evidence in the original source code that the user was
  // ever ACTUALLY penalized for reading this hint...

  this._rspeak((yesno === 'y') ? 193 : 54);
  this.state = "playing";
  this._gameTick();
};

// The the actions that make up a turn, minus input parsing. This is so some
// game states can skip input parsing themselves...
GameState.prototype._gameTick = function () {
  do {
    if (this.done || this.stopEarly) { return; }
    this.loopAgain = false;
    this._handleClosingLogic();
    this._handleDwarves();
    this._handleMovement();
    this._handleTimers();
  } while (this.loopAgain);
};

GameState.prototype._inTwistyMaze = function () {
  return (this.loc >= 42 && this.loc <= 58) || (this.loc >= 80 && this.loc <= 87);
};

GameState.prototype._handleClosingLogic = function () {
  if (this.newloc < 9 && this.newloc !== 0 && this.closing) {
    this._rspeak(130);
    this.newloc = this.loc;
    if (!this.panic) {
      this.clock2 = 15;
    }
    this.panic = 1;
  }
};

// Parses the user message, and acts on it. Returns true IFF input was accepted.
GameState.prototype._handleInputs = function (msg) {
  if (!this._parseEnglish(msg)) {
    return false;
  }

  // logger.debug(
  //   "Adventure: Loc[%d] Verb[%d] Obj[%d] Motion[%d]",
  //   this.loc, this.verb, this.object, this.motion
  // );

  if (this.motion) {
    this._doMove();
  } else if (this.object) {
    this._doObject();
  } else {
    this._intransitiveVerb();
  }

  // TODO: This is a hack. Rewrite to not use a "global":
  if (this.stopEarly) {
    return false;
  }

  return true;
};

GameState.prototype._doObject = function () {
  var obj = this.object;
  var loc = this.loc;

  // Transitive object?
  if (this.fixed[obj] === this.loc || gu.here(this, obj)) {
    this._transitiveObject();
    return;
  }

  // Grate?
  if (obj === DEF.obj.GRATE) {
    if (loc === 1 || loc === 4 || loc === 7) {
      this.motion = DEF.verb.DEPRESSION;
      this._doMove();
    } else if (loc > 9 && loc < 15) {
      this.motion = DEF.verb.ENTRANCE;
      this._doMove();
    }
    return;
  }

  // Dwarf?
  if (gu.dcheck(this) && this.dflag >= 2) {
    this.object = DEF.obj.DWARF;
    this._transitiveObject();
    return;
  }

  // Liquid here?
  const liq_here = gu.liq(this) === obj;
  const bot_here = gu.here(this, DEF.obj.BOTTLE);
  const liq_loc = gu.liqloc(this) === obj;
  if ((liq_here && bot_here) || liq_loc) {
    this._transitiveObject();
    return;
  }

  // Plant?
  const is_plant = obj === DEF.obj.PLANT;
  const plant_here = gu.at(this, DEF.obj.PLANT2);
  const plant_prop = this.prop[DEF.obj.PLANT2] === 0;
  if (is_plant && plant_here && plant_prop) {
    this.object = DEF.obj.PLANT2;
    this._transitiveObject();
    return;
  }

  // Knife?
  if (obj === DEF.obj.KNIFE && this.knfloc === loc) {
    this._rspeak(116);
    this.knfloc = -1;
    return;
  }

  // Dynamite?
  if (obj === DEF.obj.ROD && gu.here(this, DEF.obj.ROD2)) {
    this.object = DEF.obj.ROD2;
    this._transitiveObject();
    return;
  }

  // Trying to say something?
  if (this.verb === DEF.averb.SAY) {
    this._transitiveObject();
    return;
  }

  // Else, give up:
  var n = this._wordNoun();
  var str = n ? `no ${n}` : "nothing like that";
  this._msg(`I see ${str} here.`);
};

// These w fns are used to pick words that match a type:

GameState.prototype._wordNoun = function () {
  var w1 = this.word1, w2 = this.word2;
  if (w1 && this._analyzeWord(w1).type === 1) { return w1; }
  if (w2 && this._analyzeWord(w2).type === 1) { return w2; }
  return null;
};

GameState.prototype._wordVerb = function () {
  var w1 = this.word1, w2 = this.word2;
  if (w1 && this._analyzeWord(w1).type === 2) { return w1; }
  if (w2 && this._analyzeWord(w2).type === 2) { return w2; }
  return null;
};

GameState.prototype._transitiveObject = function () {
  if (this.verb) {
    this._transitiveVerb();
  } else {
    var n = this._wordNoun();
    var str = n ? `the ${n}` : "that";
    this._msg(`What do you want to do with ${str}?`);
  }
};

GameState.prototype._handleDwarves = function () {
  var i, j;

  // Handle dwarves restricting movement:
  const has_moved = this.newloc !== this.loc;
  const loc_forced = gu.forced(this, this.loc);
  const loc_pirate = !gu.locFlag(this, "NOPIRAT");
  if (has_moved && !loc_forced && loc_pirate) {
    for (i=0; i<DWARFMAX-1; i++) {
      if (this.odloc[i] === this.newloc && this.dseen[i]) {
        this.newloc = this.loc;
        this._rspeak(2);
        break;
      }
    }
  }

  // Are dwarves allowed here?
  const newloc_forced = gu.forced(this, this.newloc);
  const newloc_no_pirates = gu.roomFlag(this, this.newloc, "NOPIRAT");
  if (this.newloc === 0 || newloc_forced || newloc_no_pirates) {
    return;
  }

  // Have dwarves been activated?
  if (!this.dflag) {
    if (this.newloc >= 15) {
      this.dflag ++;
    }
    return;
  }

  // On first encounter, kill a random number of dwarves and drop an axe:
  if (this.dflag === 1) {
    // Hold off if user returned to safety, or if lucky:
    if (this.newloc < 15 || gu.pct(95)) { return; }

    this.dflag ++;
    for (i=1; i<3; i++) {
      if (gu.pct(50)) {
        this.dloc[ gu.randint(5) + 1] = 0;
      }
    }

    for(i=1; i<DWARFMAX-1; i++) {
      if (this.dloc[i] === this.newloc) {
        this.dloc[i] = this.daltloc;
      }
      this.odloc[i] = this.dloc[i];
    }

    this._rspeak(3);
    gu.drop(this, DEF.obj.AXE, this.newloc);
    return;
  }

  var dtotal = 0, attack = 0, stick = 0, attempt;
  for (i=1; i<DWARFMAX; i++) {
    if (this.dloc[i] === 0) {
      continue;
    }

    // Dwarves move randomly:
    for (attempt = 1; attempt<20; ++attempt) {
      j = gu.randint(107) + 15;

      var not_old = j !== this.odloc[i];
      var not_cur = j !== this.dloc[i];
      var last_dwarf = i === DWARFMAX-1;
      var no_pirates = gu.roomFlag(this, j, "NOPIRAT");

      if (not_old && not_cur && !(last_dwarf && no_pirates)) {
        break;
      }
    }

    // If couldn't move, just move to prior spot:
    if (attempt === 20) {
      j = this.odloc[i];
    }

    this.odloc[i] = this.dloc[i];
    this.dloc[i] = j;

    var already_seen_in_cave = this.dseen[i] && this.newloc >= 15;
    var cur_match = this.dloc[i] === this.newloc;
    var new_match = this.odloc[i] === this.newloc;

    // dseen is 1 iff already seen, and still in cave, or if location matches:
    this.dseen[i] = Number(already_seen_in_cave || cur_match || new_match);
    if (!this.dseen[i]) { continue; }

    this.dloc[i] = this.newloc;

    if (i === 6) {
      this._pirateLogic();
    } else {
      dtotal ++;
      if (this.odloc[i] === this.dloc[i]) {
        attack ++;
        if (this.knfloc >= 0) {
          this.knfloc = this.newloc;
        }
        if (gu.randint(1000) < 95*(this.dflag-2)) {
          stick ++;
        }
      }
    }
  }

  if (dtotal === 0) { return; }

  if (dtotal > 1) {
    this._msg(`There are ${dtotal} threatening little dwarves in the room with you!`);
    this._msg("");
  } else {
    this._rspeak(4);
  }

  if (attack === 0) {
    return;
  }

  if (this.dflag === 2) {
    this.dflag ++;
  }

  var k;
  if (attack > 1) {
    this._msg(`${attack} of them throw knives at you!!`);
    this._msg("");
    k = 6;
  } else {
    this._rspeak(5);
    k = 52;
  }

  if (stick <= 1) {
    this._rspeak(stick+k);
    if (stick === 0) {
      return;
    }
  } else {
    this._msg(`${stick} of them get you !!!`);
    this._msg("");
  }

  this.oldloc2 = this.newloc;
  this._death();
};

GameState.prototype._pirateLogic = function () {
  var k = 0;

  if (this.newloc === this.chloc || this.prop[DEF.obj.CHEST] >= 0) {
    return;
  }

  for (var j=50; j<=MAXTRS; j++) {

    var not_pyramid = j !== DEF.obj.PYRAMID;
    var not_with_pyramid = this.newloc !== this.place[DEF.obj.PYRAMID];
    var not_with_emerald = this.newloc !== this.place[DEF.obj.EMERALD];

    if (not_pyramid || (not_with_pyramid && not_with_emerald)) {
      if (gu.toting(this, j)) {
        return this._pirateStole();
      }
      if (gu.here(this, j)) {
        k ++;
      }
    }
  }

  const tally_match = this.tally === this.tally2 + 1;
  const chest_place = this.place[DEF.obj.CHEST] === 0;
  const lamp_here = gu.here(this, DEF.obj.LAMP);
  const lamp_on = this.prop[DEF.obj.LAMP] === 1;

  if (tally_match && k === 0 && chest_place && lamp_here && lamp_on) {
    this._rspeak(186);
    gu.move(this, DEF.obj.CHEST, this.chloc);
    gu.move(this, DEF.obj.MESSAGE, this.chloc2);
    this.dloc[6] = this.chloc;
    this.odloc[6] = this.chloc;
    this.dseen[6] = 0;
    return;
  }

  if (this.odloc[6] !== this.dloc[6] && gu.pct(20)) {
    this._rspeak(127);
  }
};

GameState.prototype._pirateStole = function () {
  this._rspeak(128);

  if (this.place[DEF.obj.MESSAGE] === 0) {
    gu.move(this, DEF.obj.CHEST, this.chloc);
  }

  gu.move(this, DEF.obj.MESSAGE, this.chloc2);

  for (var j=50; j<=MAXTRS; j++) {

    var is_pyramid = j === DEF.obj.PYRAMID;
    var is_with_pyramid = this.newloc === this.place[DEF.obj.PYRAMID];
    var is_with_emerald = this.newloc === this.place[DEF.obj.EMERALD];

    if (is_pyramid && (is_with_pyramid || is_with_emerald)) { continue; }

    if (gu.at(this, j) && this.fixed[j] === 0) {
      gu.carry(this, j);
    }

    if (gu.toting(this, j)) {
      gu.drop(this, j, this.chloc);
    }
  }
  this.dloc[6] = this.chloc;
  this.odloc[6] = this.chloc;
  this.dseen[6] = 0;
};


GameState.prototype._handleMovement = function () {
  if (this.loc === this.newloc) { return; }

  this.turns ++;
  this.loc = this.newloc;

  if (this.loc === 0) {
    return this._death();
  }

  if (gu.forced(this, this.loc)) {
    this._handleDescription();
    this._doMove();
    this.loopAgain = true;
    return;
  }

  // Wandering in the dark === 35% chance of death / movement:
  if (this.wzdark && gu.dark(this) && gu.pct(35)) {
    this._rspeak(23);
    this.oldloc2 = this.loc;
    return this._death();
  }

  this._handleDescription();
};


GameState.prototype._handleDescription = function () {
  var desc;

  if (gu.toting(this, DEF.obj.BEAR)) { this._rspeak(141); }

  const is_dark = gu.dark(this);
  if (is_dark) {
    this._rspeak(16);
  } else if (this.visited[this.loc]) {
    desc = STRINGS.shortDescriptions[this.loc] || [];
  } else {
    desc = STRINGS.longDescriptions[this.loc] || [];
  }

  if (desc) {
    desc.forEach(line => this._msg(line));
    this._msg("");
  }

  if (this.loc === 33 && (gu.pct(25) || this.forcePlugh) && !this.closing) {
    this.forcePlugh = false;
    this._rspeak(8);
  }

  if (is_dark) { return; }

  // Else, we can see...

  this.visited[this.loc] ++;

  for (var i=1; i<MAXOBJ; i++) {
    if (gu.at(this, i)) {
      if (i === DEF.obj.STEPS && gu.toting(this, DEF.obj.NUGGET)) {
        continue;
      }
      if (this.prop[i] < 0) {
        if (this.closed) { continue; }
        this.prop[i] = 0;
        if (i === DEF.obj.RUG || i === DEF.obj.CHAIN) {
          this.prop[i] ++;
        }
        this.tally --;
      }

      var is_steps = i === DEF.obj.STEPS;
      var steps_here = this.loc === this.fixed[DEF.obj.STEPS];
      var state = (is_steps && steps_here) ? 1 : this.prop[i];

      this._pspeak(i, state);
    }
  }

  if (this.tally === this.tally2 && this.tally !== 0 && this.limit > 35) {
    this.limit = 35;
  }

  if (this._inTwistyMaze()) {
    this._dumpPaths();
  }

  return;
};

GameState.prototype._dumpPaths = function () {
  var paths = gu.paths(this.loc);
  var tot = paths[0].length + paths[1].length;
  if (!tot) { return; }

  var str = (tot === 1)
    ? "There is a path"
    : "There are paths";

  if (paths[0].length === 1) {
    str += " " + paths[0][0];
  } else if (paths[0].length === 2) {
    str += " both " + paths[0].join(" and ");
  }

  if (paths[1].length) {
    if (paths[0].length) {
      str += ", and";
    }
    str += " to the";
    if (paths[1].length === 1) {
      str += " " + paths[1][0];
    } else {
      var len = paths[1].length;
      paths[1][len-1] = "and " + paths[1][len-1];
      str += " " + paths[1].join(", ");
    }
  }

  this._msg(str + ".");
  this._msg("");
};

GameState.prototype._handleTimers = function () {
  if (this.done || this.stopEarly || this.loopAgain) { return; }

  // Closing time logic:
  if (this.closed) {
    if (this.prop[DEF.obj.OYSTER] < 0 && gu.toting(this, DEF.obj.OYSTER)) {
      this._pspeak(DEF.obj.OYSTER, 1);
    }
    for (var i=1; i<MAXOBJ; i++) {
      if (gu.toting(this, i) && this.prop[i] < 0) {
        this.prop[i] = -1-this.prop[i];
      }
    }
  }

  // Store darkness here so that we can detect dark -> dark movement:
  this.wzdark = gu.dark(this);

  // ??
  if (this.knfloc > 0 && this.knfloc !== this.loc) {
    this.knfloc  =  0;
  }

  // As the grains of sand slip by...
  if (this._timer()) {
    this.loopAgain = true;
  }
};

GameState.prototype._timer = function () {
  var i;

  this.foobar = this.foobar > 0
    ? -this.foobar
    : 0;

  if (this.tally === 0 && this.loc >= 15 && this.loc !== 33) {
    this.clock--;
  }
  if (this.clock < 0) { this.clock2 --; }

  // Should we start closing the cave?
  if (this.clock === 0) {
    this.prop[DEF.obj.GRATE] = 0;
    this.prop[DEF.obj.FISSURE] = 0;
    for (i=1; i<DWARFMAX; i++) {
      this.dseen[i] = 0;
    }
    gu.move(this, this.TROLL, 0);
    gu.move(this, this.TROLL+MAXOBJ, 0);
    gu.move(this, this.TROLL2, 117);
    gu.move(this, this.TROLL2+MAXOBJ, 122);

    if (this.prop[DEF.obj.BEAR] !== 3) {
      gu.destroy(this, DEF.obj.BEAR);
    }

    this.prop[DEF.obj.CHAIN] = 0;
    this.fixed[DEF.obj.CHAIN] = 0;
    this.prop[DEF.obj.AXE] = 0;
    this.fixed[DEF.obj.AXE] = 0;

    this._rspeak(129);
    this.clock = -1;
    this.closing = 1;

    return false;
  }

  // Actually close the cave:
  if (this.clock2 === 0) {
    this.prop[DEF.obj.BOTTLE] = gu.put(this, DEF.obj.BOTTLE, 115, 1);
    this.prop[DEF.obj.PLANT] = gu.put(this, DEF.obj.PLANT, 115, 0);
    this.prop[DEF.obj.OYSTER] = gu.put(this, DEF.obj.OYSTER, 115, 0);
    this.prop[DEF.obj.LAMP] = gu.put(this, DEF.obj.LAMP, 115, 0);
    this.prop[DEF.obj.ROD] = gu.put(this, DEF.obj.ROD, 115, 0);
    this.prop[DEF.obj.DWARF] = gu.put(this, DEF.obj.DWARF, 115, 0);

    this.loc = 115;
    this.oldloc = 115;
    this.newloc = 115;

    gu.put(this, DEF.obj.GRATE, 116, 0);
    this.prop[DEF.obj.SNAKE] = gu.put(this, DEF.obj.SNAKE, 116, 1);
    this.prop[DEF.obj.BIRD] = gu.put(this, DEF.obj.BIRD, 116, 1);
    this.prop[DEF.obj.CAGE] = gu.put(this, DEF.obj.CAGE, 116, 0);
    this.prop[DEF.obj.ROD2] = gu.put(this, DEF.obj.ROD2, 116, 0);
    this.prop[DEF.obj.PILLOW] = gu.put(this, DEF.obj.PILLOW, 116, 0);
    this.prop[DEF.obj.MIRROR] = gu.put(this, DEF.obj.MIRROR, 115, 0);
    this.fixed[DEF.obj.MIRROR] = 116;

    for (i=1; i<MAXOBJ; i++) {
      if (gu.toting(this, i)) {
        gu.destroy(this, i);
      }
    }

    this._rspeak(132);
    this.closed = 1;

    this._handleDescription();

    return true;
  }

  // Lamp batteries degrade:
  if (this.prop[DEF.obj.LAMP] === 1) { this.limit --; }

  const lamp_low = this.limit <= 30;
  const have_batteries = gu.here(this, DEF.obj.BATTERIES);
  const not_used = this.prop[DEF.obj.BATTERIES] === 0;
  const have_lamp = gu.here(this, DEF.obj.LAMP);

  // Batteries getting low, but have replacements:
  if (lamp_low && have_batteries && not_used && have_lamp) {
    this._rspeak(188);
    this.prop[DEF.obj.BATTERIES] = 1;
    if (gu.toting(this, DEF.obj.BATTERIES)) {
      gu.drop(this, DEF.obj.BATTERIES, this.loc);
    }
    this.limit += 2500;
    this.lmwarn = 0;
    return false;
  }

  // Batteries are dead:
  if (this.limit === 0) {
    this.limit --;
    this.prop[DEF.obj.LAMP] = 0;
    if (gu.here(this, DEF.obj.LAMP)) {
      this._rspeak(184);
    }
    return false;
  }

  // After batteries died, did person run outside:
  if (this.limit < 0 && this.loc <= 8) {
    this._rspeak(185);
    this.gaveup = 1;
    this._gameOver();
    return false;
  }

  // Low battery warning:
  if (this.limit <= 30) {
    if (this.lmwarn || !gu.here(this, DEF.obj.LAMP)) {
      return false;
    }
    this.lmwarn = 1;
    i = 187;
    if (this.place[DEF.obj.BATTERIES] === 0) {
      i = 183;
    }
    if (this.prop[DEF.obj.BATTERIES] === 1) {
      i = 189;
    }
    this._rspeak(i);
    return false;
  }

  return false;
};


/**
 * Methods for talking / querying user:
 */

const YES_RE = /^(y|yes|yeah|yarp|ya|yep|sure|ok|affirmative)$/i;
const NO_RE = /^(n|no|nope|nah|narp)$/i;

GameState.prototype._parseYesNo = function (msg) {
  msg = String(msg).trim();

  if (YES_RE.test(msg)) { return "y"; }
  if (NO_RE.test(msg)) { return "n"; }

  this._msg("Please say either 'yes' or 'no'");
  return null;
};

GameState.prototype._parseEnglish = function (msg) {
  const fail_msg = "bad grammar...";

  this.word1 = this.word2 = null;
  this.verb = this.object = this.motion = 0;

  var split = msg.trim().toLowerCase().split(/\s+/, 2);
  var w1 = this._analyzeWord(split[0]);
  if (!w1) { return false; }

  this.word1 = split[0];

  if (w1.type === 2 && w1.val === DEF.averb.SAY) {
    this.verb = DEF.averb.SAY;
    this.object = 1;
    this.wordRest = msg.trim().replace(/^say\s+/i, '');
    return true;
  }

  var w2 = { type: -1, val: -1 };
  if (split[1]) {
    w2 = this._analyzeWord(split[1]);
    if (!w2) { return false; }
  }

  this.word2 = split[1];

  // Hackish rewrite: Sometimes people want to do: "enter <location>", but
  // enter doesn't combo with locations. Rewrite them to support it:
  if (w1.word === "enter" && w2.type === 0) {
    w1 = w2;
    w2 = { type: -1, val: -1 };
  }

  if (w1.type === 3 && w2.type === 3 && w1.val === 51 && w2.val === 51) {
    this._outWords();
    return 0;

  } else if (w1.type === 3) {
    this._rspeak(w1.val);
    return 0;

  } else if (w2.type === 3) {
    this._rspeak(w2.val);
    return 0;

  } else if (w1.type === 0) {
    if (w2.type === 0) {
      this._msg(fail_msg);
      return 0;
    }
    this.motion = w1.val;

  } else if (w2.type === 0) {
    this.motion = w2.val;

  } else if (w1.type === 1) {
    this.object = w1.val;
    if (w2.type === 2) {
      this.verb = w2.val;
    }
    if (w2.type === 1) {
      this._msg(fail_msg);
      return 0;
    }

  } else if (w1.type === 2) {
    this.verb = w1.val;
    if (w2.type === 1) {
      this.object = w2.val;
    }
    if (w2.type === 2) {
      this._msg(fail_msg);
      return 0;
    }

  } else {
    this._bug(36);
    return 0;
  }

  return 1;
};

// List a lot of the useful words:
GameState.prototype._outWords = function () {
  var list = STRINGS.vocab
    .filter(e => (e.code < 1000 || (e.code < 3000 && e.code > 1999)))
    .filter(e => e.word !== 'xyzzy' && e.word !== 'plugh')
    .reduce(function (acc, e) {
      if (acc[acc.length-1].length >= 5) {
        acc.push([]);
      }
      acc[acc.length-1].push(_.pad(e.word, 12));
      return acc;
    }, [[]])
    .map(row => row.join(" "));

  list.forEach(x => this._msg(x));
};

const ORDERED_WORDS = _.sortBy(STRINGS.vocab, "code");

GameState.prototype._analyzeWord = function (word, min) {
  min = min || 0;

  var matches = ORDERED_WORDS
    .filter(e => e.word === word)
    .filter(e => e.code >= min);

  if (!matches.length) {
    this._rspeak([60, 61, 13][gu.randint(3)]);
    return null;
  }

  var m = matches[0];
  var code = min ? m.code % 1000 : m.code;

  return {
    code, word,
    type: Math.floor(code / 1000),
    val: code % 1000
  };
};

GameState.prototype._pspeak = function (prop_id, state_id) {
  // TODO: Verify that state_id is being used correctly here...
  var msg = STRINGS.items[prop_id][state_id+1];
  if (msg) {
    this._msg(msg);
    this._msg("");
  }
  return;
};

GameState.prototype._rspeak = function (msg_id) {
  if (!msg_id) { return; }

  var messages = STRINGS.dialogue[msg_id] || [];
  messages.forEach(msg => this._msg(msg));
  this._msg("");

  return;
};

GameState.prototype._dwarfDeath = function () {
  this._rspeak(136);
  return this._death();
};

GameState.prototype._death = function () {
  if (this.closing || this.closed) {
    // Sorry, but it's too close to closing time...
    this._rspeak(131);
    this.numdie ++;
    return this._gameOver();
  }

  this._rspeak(81 + (this.numdie) * 2);
  this.state = "death_query";
  this.stopEarly = true;
  return;
};

GameState.prototype._gameOver = function () {
  this.done = true;
  this.stopEarly = true;

  this._msg("  * GAME OVER *");
  this._msg("");

  this._score();
  return;
};

GameState.prototype._score = function () {
  var t, i, k, s, extra;
  s = t = extra = 0;
  for (i=50; i<=MAXTRS; i++) {
    if (i === DEF.obj.CHEST) {
      k = 14;
    } else if (i > DEF.obj.CHEST) {
      k = 16;
    } else {
      k = 12;
    }
    if (this.prop[i] >= 0) {
      t += 2;
    }
    if (this.place[i] === 3 && this.prop[i] === 0) {
      t += k - 2;
    }
  }

  this._msg("Showing up: 2");
  s += 2;

  if (t) {
    s += t;
    this._msg("Treasures: " + t);
  }

  // No survival bonus if you gave up:
  t = (MAXDIE - this.numdie) * 10;
  if (t && !this.gaveup && this.done) {
    s += t;
    this._msg("Survival: " + t);
  }

  if (!this.gaveup && this.done) {
    extra += 4;
  }

  t = this.dflag ? 25 : 0;
  if (t) {
    s += t;
    this._msg("Getting well in: " + t);
  }

  t = this.closing ? 25 : 0;
  if (t) {
    s += t;
    this._msg("Masters section: " + t);
  }

  if (this.closed) {
    if (this.bonus === 0) {
      t = 10;
    } else if (this.bonus === 135) {
      t = 25;
    } else if (this.bonus === 134) {
      t = 30;
    } else if (this.bonus === 133) {
      t = 45;
    }
    s += t;
    this._msg("Bonus: " + t);
  }

  if (this.place[DEF.obj.MAGAZINE] === 108) {
    extra += 1;
  }

  if (extra) {
    s += extra;
    this._msg("Secrets: " + extra);
  }

  this._msg("SCORE: " + s);
};

GameState.prototype._msg = function (str) {
  this.lines.push(String(str));
  return;
};

/*
 * Will exit a state object, and give a bug value:
 */
GameState.prototype._bug = function _bug(code) {
  this.done = true;
  this.bug = code;
  this.stopEarly = true;
  this.loopAgain = false;
  if (_.isNumber(code)) {
    this._msg(`Fatal error. (Bug #${code}) :cry:`);
  } else {
    this._msg(`Fatal error. (${code}) :cry:`);
  }
  return;
};


// Allow us to execute this file as a program, for testing:

/* istanbul ignore if */
if (require.main === module) {

  /* eslint-disable no-console */

  (function () {
    var rl = require('readline');

    gu.reseed(123456);

    var app = new GameState();
    app.advance().forEach(line => console.log(line));

    var _input = rl.createInterface(process.stdin, process.stdout);
    _input.setPrompt('> ');
    _input.prompt();
    _input.on('line', (l) => {

      app.advance(l).forEach(line => console.log(line));

      if (app.isDone()) {
        process.exit(0);
      }

      _input.prompt();
    });
  })();
}
