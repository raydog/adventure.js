/**
 * This file is a reimplementation of the game written at:
 * 
 * https://github.com/Quuxplusone/Advent/blob/master/POHL0350/
 * 
 * Basically, it's the 350-point version of the Colossal Cave Adventure as
 * written by Jerry Pohl in 1984. (And of course based on the game created by
 * Will Crowther, and then extended by Don Woods.)
 */


const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
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
const MAXWC    = 301;  // max # of adventure words
const MAXLOC   = 145;  // max # of cave locations 
const WORDSIZE = 20;   // max # of chars in commands
const MAXMSG   = 201;  // max # of action messages

const MAXTRAV  = 16+1; // max # of travel directions from loc 
const DWARFMAX = 7;    // max # of nasty dwarves
const MAXDIE   = 3;    // max # of deaths before close
const MAXTRS   = 79;   // max # of treasures in cave


const actmsg = [
  0,24,29,0,33,0,33,38,38,42,14,43,110,29,110,73,75,29,13,59,59,174,109,67,13,
  147,155,195,146,110,13,13,13
];


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
      bug: null,

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
        .concat(new Array(MAXOBJ/2).fill(0xff)),
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
      dbugflg: 0,
    })
    .value();
}
util.inherits(GameState, EventEmitter);


GameState.prototype.advance = function advance(msg) {
  if (this.done) { return this; }

  var state_fn = "_state_" + this.state;
  if (_.isFunction(this[state_fn])) {
    return this[state_fn](msg);
  }

  return this._bug("Invalid state encountered: " + this.state);
};

GameState.prototype.isDone = function () {
  return Boolean(this.done);
};


/**
 * These methods are called when an advance is done when the game is is various
 * states:
 */
GameState.prototype._state_init = function (msg) {
  this.state = "init_yesno";
  this._rspeak(65);
  return this;
};


GameState.prototype._state_init_yesno = function (msg) {
  if (!/^n/i.test(msg)) { this._rspeak(1); }
  this.state = "playing";
  this._handleMovement();
  return this;
};


GameState.prototype._state_playing = function (msg) {
  // TODO: Maybe cave hours logic?
  
  this._handleDwarves();
  this._handleMovement();
  return this;
};

GameState.prototype._handleDwarves = function () {
  var i;

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

  // dtotal = attack = stick = 0;
  // for (i = 1; i<DWARFMAX; ++i) {
  //   if (dloc[i] == 0)
  //     continue;
  //   /*
  //     move a dwarf at random.  we don't
  //     have a matrix around to do it
  //     as in the original version...
  //   */
  //   for (try = 1; try<20; ++try) {
  //     j = rand()%107+15; /* allowed area */
  //     if (j != odloc[i] && j != dloc[i] &&
  //         !(i == (DWARFMAX-1) && cond[j]&NOPIRAT))
  //       break;
  //   }
  //   if (try == 20)
  //     j = odloc[i];
  //   odloc[i] = dloc[i];
  //   dloc[i] = j;
  //   if ((dseen[i] && newloc >= 15) ||
  //       dloc[i] == newloc || odloc[i] == newloc)
  //     dseen[i] = 1;
  //   else
  //     dseen[i] = 0;
  //   if (!dseen[i])
  //     continue;
  //   dloc[i] = newloc;
  //   if (i == 6)
  //     dopirate();
  //   else {
  //     ++dtotal;
  //     if (odloc[i] == dloc[i]) {
  //       ++attack;
  //       if (knfloc >= 0)
  //         knfloc = newloc;
  //       if (rand()%1000 < 95*(dflag-2))
  //         ++stick;
  //     }
  //   }
  // }
  // if (dtotal == 0)
  //   return;
  // if (dtotal > 1)
  //   printf("There are %d threatening little dwarves in the room with you!\n", dtotal);
  // else
  //   rspeak(4);
  // if (attack == 0)
  //   return;
  // if (dflag == 2)
  //   ++dflag;
  // if (attack > 1) {
  //   printf("%d of them throw knives at you!!\n", attack);
  //   k = 6;
  // }
  // else {
  //   rspeak(5);
  //   k = 52;
  // }
  // if (stick <= 1) {
  //   rspeak(stick+k);
  //   if (stick == 0)
  //     return;
  // }
  // else
  //   printf("%d of them get you !!!\n", stick);
  // oldloc2 = newloc;
  // death();

};


GameState.prototype._handleMovement = function () {
  if (this.loc === this.newloc) { return; }
  
  this.turns ++;
  this.loc = this.newloc;

  if (this.loc === 0) {
    // death();
    return;
  }

  if (gu.forced(this, this.loc)) {
    this._handleDescription();
    // domove();
    return;
  }

  /* check for wandering in dark */
  if (this.wzdark && gu.dark(this) && gu.pct(35)) {
    this._rspeak(23);
    this.oldloc2 = this.loc;
    // death();
    return;
  }

  /* describe his situation */
  this._handleDescription();
};


GameState.prototype._handleDescription = function () {
  
  if (gu.toting(this, DEF.obj.BEAR)) { this._rspeak(141); }
  
  const is_dark = gu.dark(this);
  if (is_dark) {
    this._rspeak(16);
  } else if (this.visited[this.loc]) {
    this._msg(STRINGS.shortDescriptions[this.loc]);
  } else {
    this._msg(STRINGS.longDescriptions[this.loc]);
  }

  if (this.loc === 33 && gu.pct(25) && !this.closing) {
    this._rspeak(8);
  }

  if (!gu.dark(this)) {
    this.visited[this.loc] ++;
    //descitem();
  }
};


/**
 * Methods for talking / querying user:
 */

GameState.prototype._parseEnglish = function (msg) {
  var out = "bad grammar...";
  this.verb = this.object = this.motion = 0;

  var split = msg.trim().toLowerCase().split(/\s+/, 2);
  var match1 = _.find(STRINGS.vocab, {word: split[0]});
  
};

GameState.prototype._rspeak = function (msg_id) {
  if (!msg_id) { return this; }

  if (msg_id === 54) { return this._msg("ok."); }

  var messages = STRINGS.dialogue[msg_id] || [];
  messages.forEach(msg => this._msg(msg));

  return this;
}

GameState.prototype._msg = function (str) {
  this.emit('message', String(str));
  return this;
};

/*
 * Will exit a state object, and give a bug value:
 */
GameState.prototype._bug = function _bug(code) {
  state.done = true;
  state.bug = code;
  return this;
};


// Allow us to execute this file as a program, for testing:
if (require.main === module) {
  (function () {
    var rl = require('readline');
    var app = new GameState();
    app.on('message', (msg) => console.log(": %s", msg));
    app.advance();

    var _input = rl.createInterface(process.stdin, process.stdout);
    _input.setPrompt('> ');
    _input.prompt();
    _input.on('line', (l) => {
      app.advance(l);
      if (app.isDone()) {
        process.exit(0);
      }
      _input.prompt();
    });
  })();
}
