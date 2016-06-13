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
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const logger = require('../../logger');
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
      dbugflg: 0,
    })
    .value();
}
util.inherits(GameState, EventEmitter);


GameState.prototype.advance = function advance(msg) {
  msg = String(msg || "");

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
  if (!msg.trim()) { return this; }
  if (!/^n/i.test(msg)) { this._rspeak(1); }
  this.state = "playing";
  return this._gameTick();
};


GameState.prototype._state_playing = function (msg) {
  if (!this._handleInputs(msg)) { return this; }
  if (this.done) { return this; }
  return this._gameTick();
};

GameState.prototype._state_death_query = function (msg) {
  if (!msg.trim()) { return this; }

  if (/^n/i.test(msg)) {
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

  return this._gameTick();
}

// The the actions that make up a turn, minus input parsing. This is so some
// game states can skip input parsing themselves...
GameState.prototype._gameTick = function () {
  this._handleDwarves();
  this._handleMovement();
  this._handleDescription();
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
    console.log("-- doobj()");
  } else {
    console.log("-- itverb()");
  }

  return true;
};

GameState.prototype._doMove = function () {
  switch (this.motion) {
    case DEF.verb.NULLX:
      break;
    case DEF.verb.BACK:
      this._goBack();
      break;
    case DEF.verb.LOOK:
      if (this.detail++ < 3) {
        this._rspeak(15);
      }
      this.wzdark = 0;
      this.visited[this.loc] = 0;
      this.newloc = this.loc;
      this.loc = 0;
      break;
    case DEF.verb.CAVE:
      this._rspeak( (this.loc<8) ? 57 : 58 );
      break;
    default:
      this.oldloc2 = this.oldloc;
      this.oldloc = this.loc;
      this._doTravel();
  }
};

GameState.prototype._goBack = function () {
  var want = gu.forced(this, this.oldloc)
    ? this.oldloc2
    : this.oldloc;

  this.oldloc2 = this.oldloc;
  this.odloc = this.loc;
  var k2 = -1;

  if (want === this.loc) {
    this._rspeak(91);
    return;
  }

  var travels = gu.travels(this.loc);
  for (var i=0; i<travels.length; i++) {
    var cur = travels[i];
    if (!cur.tcond && cur.tdest === want) {
      this.motion = cur.tverb;
      this._doTravel();
      return;
    }
    if (!cur.tcond) {
      var remote = gu.travels(i);
      if (gu.forced(this, cur.tdest) && remote[0].tdest === want) {
        k2 = i;
      }
    }
  }

  if (k2 !== -1) {
    this.motion = travels[k2].tverb;
    this._doTravel();
  } else {
    this._rspeak(140);
  }
};

GameState.prototype._doTravel = function () {
  var mvflag = 0, hitflag = 0;

  this.newloc = this.loc;
  var pctt = gu.randint(100);
  var cur;

  var travels = gu.travels(this.loc);
  for(var i=0; i<travels.length && !mvflag; i++) {
    cur = travels[i];
    
    var div = Math.floor(cur.tcond / 100);
    var robj = cur.tcond % 100;

    if (cur.tverb !== 1 && cur.tverb !== this.motion && !hitflag) {
      continue;
    }
    hitflag++;
    switch (div) {
      case 0:
        if (cur.tcond === 0 || pctt < cur.tcond) {
          mvflag ++;
        }
        break;
      case 1:
        if (robj === 0 || gu.toting(this, robj)) {
          mvflag ++;
        }
        break;
      case 2:
        if (gu.toting(this, robj) || gu.at(this, robj)) {
          mvflag ++;
        }
      case 3:
      case 4:
      case 5:
      case 7:
        if (this.prop[robj] !== div-3) {
          mvflag ++;
        }
        break;
      default:
        return this._bug(37);
    }
  }
  if (!mvflag) {
    this._badMove();
  } else if (cur.tdest > 500) {
    this._rspeak(cur.rdest - 500);
  } else if (cur.tdest > 300) {
    this._spcMove(cur.tdest);
  } else {
    this.newloc = cur.tdest;
  }
};

GameState.prototype._badMove = function () {
  var msg = 12;
  if (this.motion >= 43 && this.motion <= 50) { msg = 9; }
  if (this.motion == 29 || this.motion == 30) { msg = 9; }
  if (this.motion == 7 || this.motion == 36 || this.motion == 37) { msg = 10; }
  if (this.motion == 11 || this.motion == 19) { msg = 11; }
  if (this.verb == DEF.averb.FIND) { msg = 59; }
  if (this.verb == DEF.averb.INVENTORY) { msg = 59; }
  if (this.motion == 62 || this.motion == 65) { msg = 42; }
  if (this.motion == 17) { msg = 80; }
  this._rspeak(msg);
};

GameState.prototype._spcMove = function (rdest) {
  switch(rdest - 300) {
    case 1:
      var hold = this.holding
      if (!hold || (hold === 1 && gu.toting(this, DEF.obj.EMERALD))) {
        this.newloc = 199 - this.loc;
      } else {
        this.rspeak(117);
      }
      break;
    case 2:
      gu.drop(this, DEF.obj.EMERALD, this.loc);
      break;
    case 3:
      if (this.prop[DEF.obj.TROLL] === 1) {
        this._pspeak(DEF.obj.TROLL, 1);
        this.prop[DEF.obj.TROLL] = 0;
        gu.move(this, DEF.obj.TROLL2, 0);
        gu.move(this, DEF.obj.TROLL2 + MAXOBJ, 0);
        gu.move(this, DEF.obj.TROLL, 117);
        gu.move(this, DEF.obj.TROLL + MAXOBJ, 122);
        this.newloc = this.loc;
      } else {
        this.newloc = (this.loc === 117) ? 122 : 117;
        if (this.prop[DEF.obj.TROLL] === 0) {
          this.prop[DEF.obj.TROLL] ++;
        }
        if (!gu.toting(this, DEF.obj.BEAR)) {
          return;
        }
        this._rspeak(162);
        this.prop[DEF.obj.CHASM] = 1;
        this.prop[DEF.obj.TROLL] = 2;
        gu.drop(this, DEF.obj.BEAR, this.newloc);
        this.fixed[DEF.obj.BEAR] = -1;
        this.prop[DEF.obj.BEAR] = 3;
        if (this.prop[DEF.obj.SPICES]<0) {
          this.tally2 ++;
        }
        this.oldloc2 = this.newloc;
        return this._death();
      }
      break;
    default:
      return this._bug(38);
  }
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
    return this._death();
  }

  if (gu.forced(this, this.loc)) {
    this._handleDescription();
    // domove();
    return this;
  }

  if (this.wzdark && gu.dark(this) && gu.pct(35)) {
    this._rspeak(23);
    this.oldloc2 = this.loc;
    return this._death();
  }
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

  if (is_dark) { return this; }

  // We can see:
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

  return this;
};


/**
 * Methods for talking / querying user:
 */

GameState.prototype._parseEnglish = function (msg) {
  const fail_msg = "bad grammar...";
  this.verb = this.object = this.motion = 0;

  var split = msg.trim().toLowerCase().split(/\s+/, 2);
  var w1 = this._analyzeWord(split[0]);
  if (!w1) { return false; }

  if (w1.type === 2 && w1.val === DEF.averb.SAY) {
    this.verb = DEF.averb.SAY;
    this.object = 1;
    return true;
  }

  var w2 = { type: -1, val: -1 };
  if (split[1]) {
    w2 = this._analyzeWord(split[1]);
    if (!w2) { return false; }
  }

  // Hackish rewrite: Sometimes people want to do: "enter <location>", but
  // enter doesn't combo with locations. Rewrite them to support it:
  if (w1.word === "enter" && w2.type === 0) {
    w1 = w2;
    w2 = { type: -1, val: -1 };
  }

  if (w1.type === 3 && w2.type === 3 && w1.val === 51 && w2.val === 51) {
    console.log("-- outwords()");
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
    } else {
      this.motion = w1.val;
    }

  } else if (w2.type === 0) {
    this.motion = w2.val;

  } else if (w1.type === 1) {
    this.object = w1.val;
    if (w2.type === 2) {
      this.verb = s2.val;
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

GameState.prototype._analyzeWord = function (word) {
  // TODO: Look into old behavior with "?" (3051)
  var m = _.find(STRINGS.vocab, { word });
  if (!m) {
    this._rspeak([60, 61, 13][gu.randint(3)]);
    return null;
  }

  var code = m.code, word = m.word;
  return {
    code, word,
    type: Math.floor(m.code / 1000),
    val: m.code % 1000
  };
};

GameState.prototype._pspeak = function (prop_id, state_id) {
  // TODO: Verify that state_id is being used correctly here...
  var msg = STRINGS.items[prop_id][state_id];
  this._msg(msg);
  return this;
};

GameState.prototype._rspeak = function (msg_id) {
  if (!msg_id) { return this; }

  if (msg_id === 54) { return this._msg("ok."); }

  var messages = STRINGS.dialogue[msg_id] || [];
  messages.forEach(msg => this._msg(msg));

  return this;
};

GameState.prototype._death = function () {
  if (this.closing) {
    // Sorry, but it's too close to closing time...
    this._rspeak(131);
    this.numdie ++;
    return this._gameOver();
  }

  this._rspeak(81 + (this.numdie) * 2);
  this.state = "death_query";
  return this;
};

GameState.prototype._gameOver = function () {
  this.done = true;

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
  if (t && !this.gaveup) {
    s += t;
    this._msg("Survival: " + t);
  }

  if (!this.gaveup) {
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

  return this;
};

GameState.prototype._msg = function (str) {
  this.emit('message', String(str));
  return this;
};

/*
 * Will exit a state object, and give a bug value:
 */
GameState.prototype._bug = function _bug(code) {
  this.done = true;
  this.bug = code;
  this._msg(`Fatal error. (Bug #${code}) :cry:`);
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
