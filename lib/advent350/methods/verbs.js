"use strict";

const DEF = require('../vars/defs.json');
const ACT = require('../vars/actionMessages.json');
const gu = require('../gameUtils');

const MAXOBJ   = 100;  // max # of objects in cave


exports._transitiveVerb = function () {
  switch (this.verb) {
    case DEF.averb.CALM:
    case DEF.averb.WALK:
    case DEF.averb.QUIT:
    case DEF.averb.SCORE:
    case DEF.averb.FOO:
    case DEF.averb.BRIEF:
    case DEF.averb.SUSPEND:
    case DEF.averb.HOURS:
    case DEF.averb.LOG:
      this._actionSpeak();
      break;

    case DEF.averb.TAKE:
      this._verbTake();
      break;

    case DEF.averb.DROP:
      this._verbDrop();
      break;

    case DEF.averb.OPEN:
    case DEF.averb.LOCK:
      this._verbOpen();
      break;

    case DEF.averb.SAY:
      this._verbSay();
      break;

    case DEF.averb.NOTHING:
      this._rspeak(54);
      break;

    case DEF.averb.ON:
      this._verbOn();
      break;

    case DEF.averb.OFF:
      this._verbOff();
      break;

    case DEF.averb.WAVE:
      this._verbWave();
      break;

    case DEF.averb.KILL:
      this._verbKill();
      break;

    case DEF.averb.POUR:
      console.log("vpour();");
      break;

    case DEF.averb.EAT:
      console.log("veat();");
      break;

    case DEF.averb.DRINK:
      this._verbDrink();
      break;

    case DEF.averb.RUB:
      if (this.object != DEF.obj.LAMP) {
        this._rspeak(76);
      } else {
        this._actionSpeak();
      }
      break;

    case DEF.averb.THROW:
      console.log("vthrow();");
      break;

    case DEF.averb.FEED:
      console.log("vfeed();");
      break;

    case DEF.averb.FIND:
    case DEF.averb.INVENTORY:
      console.log("vfind();");
      break;

    case DEF.averb.FILL:
      console.log("vfill();");
      break;

    case DEF.averb.READ:
      console.log("vread();");
      break;

    case DEF.averb.BLAST:
      this._verbBlast();
      break;

    case DEF.averb.BREAK:
      console.log("vbreak();");
      break;

    case DEF.averb.WAKE:
      console.log("vwake();");
      break;

    default:
      this._msg("This verb is not implemented yet.");
  }
};

exports._intransitiveVerb = function () {
  switch(this.verb) {
    case DEF.averb.DROP:
    case DEF.averb.SAY:
    case DEF.averb.WAVE:
    case DEF.averb.CALM:
    case DEF.averb.RUB:
    case DEF.averb.THROW:
    case DEF.averb.FIND:
    case DEF.averb.FEED:
    case DEF.averb.BREAK:
    case DEF.averb.WAKE:
      this._needObject();
      break;

    case DEF.averb.TAKE:
      this._intransitiveTake();
      break;

    case DEF.averb.OPEN:
    case DEF.averb.LOCK:
      this._intransitiveOpen();
      break;

    case DEF.averb.NOTHING:
      this._rspeak(54);
      break;

    case DEF.averb.ON:
    case DEF.averb.OFF:
    case DEF.averb.POUR:
      this._transitiveVerb();
      break;

    case DEF.averb.WALK:
      this._actionSpeak();
      break;

    case DEF.averb.KILL:
      this._intrasitiveKill();
      break;

    case DEF.averb.DRINK:
      this._intransitiveDrink();
      break;

    case DEF.averb.QUIT:
      this._intransitiveQuit();
      break;

    case DEF.averb.BLAST:
      this._verbBlast();
      break;

    case DEF.averb.SCORE:
      this._score();
      break;

    case DEF.averb.FOO:
      this._intrasitiveFoo();
      break;

    case DEF.averb.SUSPEND:
      this.saveflg = 1;
      break;

    case DEF.averb.INVENTORY:
      this._intransitiveInventory();
      break;

    default:
      this._msg("This intransitive verb not implemented yet");
  }
};

exports._actionSpeak = function () {
  if (this.verb < 1 || this.verb > 32) {
    return this._bug(39);
  }
  var i = ACT.actionMessages[this.verb];
  if (i) { this._rspeak(i); }
};

exports._needObject = function () {
  var n = this._wordVerb();
  this._msg(`${n || "do"} what?`);
};

exports._intransitiveTake = function () {
  var anobj = 0;
  for (var i=1; i<MAXOBJ; i++) {
    if (this.place[i] === this.loc) {
      if (anobj != 0) {
        return this._needObject();
      }
    }
  }
  if (anobj === 0 || (gu.dcheck() && this.dflag >= 2)) {
    return this._needObject();
  }
  this.object = anobj;
  this._verbTake();
};

exports._verbTake = function () {
  var obj = this.object, msg;
  if (gu.toting(this, obj)) {
    return this._actionSpeak();
  }

  // Special-case objects:
  if (this.fixed[obj]) {
    msg = 25;
    if (obj === DEF.obj.PLANT && this.prop[DEF.obj.PLANT] <= 0) {
      msg = 115;
    }
    if (obj === DEF.obj.BEAR && this.prop[DEF.obj.BEAR] === 1) {
      msg = 169;
    }
    if (obj === DEF.obj.CHAIN && this.prop[DEF.obj.BEAR] !== 0) {
      msg = 170;
    }
    return this._rspeak(msg);
  }

  // Liquids:
  if (obj == DEF.obj.WATER || obj == DEF.obj.OIL) {
    if (!gu.here(this, DEF.obj.BOTTLE) || gu.liq(this) !== obj) {
      this.object = obj = DEF.obj.BOTTLE;
      if (gu.toting(this, DEF.obj.BOTTLE) && this.prop[DEF.obj.BOTTLE] === 1) {
        console.log("vfill();");
        return;
      }
      if (this.prop[DEF.obj.BOTTLE] !== 1) {
        msg = 105;
      }
      if (!gu.toting(this, DEF.obj.BOTTLE)) {
        msg = 104;
      }
      this._rspeak(msg);
      return;
    }
    this.object = obj = DEF.obj.BOTTLE;
  }

  // Holding too much?
  if (this.holding >= 7) {
    this._rspeak(92);
    return;
  }

  // Bird:
  if (obj === DEF.obj.BIRD && this.prop[DEF.obj.BIRD] === 0) {
    if (gu.toting(this, DEF.obj.ROD)) {
      this._rspeak(26);
      return;
    }
    if (!gu.toting(this, DEF.obj.CAGE)) {
      this._rspeak(27);
      return;
    }
    this.prop[DEF.obj.BIRD] = 1;
  }

  // More bird stuff:
  const bird_or_cage = obj === DEF.obj.BIRD || obj === DEF.obj.CAGE;
  if ( bird_or_cage && this.prop[DEF.obj.BIRD] !== 0) {
    gu.carry(this, DEF.obj.BIRD + DEF.obj.CAGE - obj);
  }

  gu.carry(this, obj);
  
  // Also liquids:
  var i = gu.liq(this);
  if (obj === DEF.obj.BOTTLE && i != 0) {
    this.place[i] = -1;
  }
  
  this._rspeak(54);
};

exports._intransitiveInventory = function () {
  var msg = 98;
  for (var i=1; i<MAXOBJ; i++) {
    if (i === DEF.obj.BEAR || !gu.toting(this, i)) {
      continue;
    }
    if (msg) {
      this._rspeak(99);
    }
    msg = 0;
    this._pspeak(i, -1);
  }
  if (gu.toting(this, DEF.obj.BEAR)) {
    msg = 141;
  }
  if (msg) {
    this._rspeak(msg);
  }
};

exports._intransitiveOpen = function () {
  if (gu.here(this, DEF.obj.CLAM)) {
    this.object = DEF.obj.CLAM;
  }
  if (gu.here(this, DEF.obj.OYSTER)) {
    this.object = DEF.obj.OYSTER;
  }
  if (gu.at(this, DEF.obj.DOOR)) {
    this.object = DEF.obj.DOOR;
  }
  if (gu.at(this, DEF.obj.GRATE)) {
    this.object = DEF.obj.GRATE;
  }
  if (gu.here(this, DEF.obj.CHAIN)) {
    if (this.object !== 0) {
      this._needObject();
      return;
    }
    this.object = DEF.obj.CHAIN;
  }
  if (this.object === 0) {
    this._rspeak(28);
    return;
  }
  this._verbOpen();
};

exports._verbOpen = function () {
  var msg;

  const clam_num = Number(this.object === DEF.obj.OYSTER);

  switch (this.object) {
    case DEF.obj.CLAM:
    case DEF.obj.OYSTER:
      if (this.verb === DEF.averb.LOCK) {
        msg = 61;
      } else if (!gu.toting(this, DEF.obj.TRIDENT)) {
        msg = 122 + clam_num;
      } else if (gu.toting(this, this.object)) {
        msg = 120 + clam_num;
      } else {
        msg = 124 + clam_num;
        gu.destroy(this, DEF.obj.CLAM);
        gu.drop(this, DEF.obj.OYSTER, this.loc);
        gu.drop(this, DEF.obj.PEARL, 105);
      }
      break;

    case DEF.obj.DOOR:
      msg = this.prop[DEF.obj.DOOR] == 1
        ? 54
        : 111;
      break;

    case DEF.obj.CAGE:
      msg = 32;
      break;

    case DEF.obj.KEYS:
      msg = 55;
      break;

    case DEF.obj.CHAIN:
      if (!gu.here(this, DEF.obj.KEYS)) {
        msg = 31;
      } else if (this.verb === DEF.averb.LOCK) {
        if (this.prop[DEF.obj.CHAIN] !== 0) {
          msg = 34;
        } else if (this.loc !== 130) {
          msg = 173;
        } else {
          this.prop[DEF.obj.CHAIN] = 2;
          if (gu.toting(this, DEF.obj.CHAIN)) {
            gu.drop(this, DEF.obj.CHAIN, this.loc);
          }
          this.fixed[DEF.obj.CHAIN] = -1;
          msg = 172;
        }
      } else {
        if (this.prop[DEF.obj.BEAR] === 0) {
          msg = 41;
        } else if (this.prop[DEF.obj.CHAIN] === 0) {
          msg = 37;
        } else {
          this.prop[DEF.obj.CHAIN] = 0;
          this.fixed[DEF.obj.CHAIN] = 0;
          if (this.prop[DEF.obj.BEAR] !== 3) {
            this.prop[DEF.obj.BEAR] = 2;
          }
          this.fixed[DEF.obj.BEAR] = 2 - this.prop[DEF.obj.BEAR];
          msg = 171;
        }
      }
      break;

    case DEF.obj.GRATE:
      if (!gu.here(this, DEF.obj.KEYS)) {
        msg = 31;
      } else if (this.closing) {
        if (!this.panic) {
          this.clock2 = 15;
          this.panic ++;
        }
        msg = 130;
      } else {
        msg = 34 + this.prop[DEF.obj.GRATE];
        this.prop[DEF.obj.GRATE] = this.verb == DEF.obj.LOCK ? 0 : 1;
        msg += 2 * this.prop[DEF.obj.GRATE];
      }
      break;

    default:
      msg = 33;
  }
  this._rspeak(msg);
};

exports._intrasitiveKill = function () {
  this.object1 = 0;
  if (gu.dcheck(this) && this.dflag >= 2) {
    this.object = DEF.obj.DWARF;
  }
  if (gu.here(this, DEF.obj.SNAKE)) {
    this._addObject(DEF.obj.SNAKE);
  }
  if (gu.at(this, DEF.obj.DRAGON) && this.prop[DEF.obj.DRAGON]===0) {
    this._addObject(DEF.obj.DRAGON);
  }
  if (gu.at(this, DEF.obj.TROLL)) {
    this._addObject(DEF.obj.TROLL);
  }
  if (gu.here(this, DEF.obj.BEAR) && this.prop[DEF.obj.BEAR]==0) {
    this._addObject(DEF.obj.BEAR);
  }
  if (this.object1 !== 0) {
    this._needObject();
    return;
  }

  if (this.object !== 0) {
    this._verbKill();
    return;
  }

  if (gu.here(this, DEF.obj.BIRD) && this.verb !== DEF.obj.THROW) {
    this.object = DEF.obj.BIRD;
  }
  if (gu.here(this, DEF.obj.CLAM) || gu.here(this, DEF.obj.OYSTER)) {
    this._addObject(DEF.obj.CLAM);
  }
  if (this.object1 !== 0) {
    this._needObject();
    return;
  }
  this._verbKill();
};

exports._addObject = function (obj) {
  if (this.object1 !== 0) { return; }
  if (this.object !== 0) {
    this.object1 = -1;
    return;
  }
  this.object = obj;
};

exports._verbKill = function () {
  var msg;
  switch (this.object) {
    case DEF.obj.BIRD:
      if (this.closed) {
        msg = 137;
      } else {
        gu.destroy(this, DEF.obj.BIRD);
        this.prop[DEF.obj.BIRD] = 0;
        if (this.place[DEF.obj.SNAKE] === 19) {
          this.tally2 ++;
        }
        msg = 45;
      }
      break;

    case 0:
      msg = 44;
      break;

    case DEF.obj.CLAM:
    case DEF.obj.OYSTER:
      msg = 150;
      break;

    case DEF.obj.SNAKE:
      msg = 46;
      break;

    case DEF.obj.DWARF:
      if (this.closed) {
        console.log("dwarfend()");
      }
      msg = 49;
      break;

    case DEF.obj.TROLL:
      msg = 157;
      break;

    case DEF.obj.BEAR:
      msg = 165 + Math.floor(this.prop[DEF.obj.BEAR] + 1 / 2);
      break;

    case DEF.obj.DRAGON:
      if (this.prop[DEF.obj.DRAGON] != 0) {
        msg = 167;
        break;
      }
      this._rspeak(49);
      this.state = "dragon_yesno";
      this.stopEarly = true;
      return;

    default:
      this._actionSpeak();
      return;
  }
  this._rspeak(msg);
};

exports._intransitiveDrink = function () {
  const loc_no_water = gu.liqloc(this) !== DEF.obj.WATER;
  const no_water = gu.liq(this) !== DEF.obj.WATER;
  const no_bottle = !gu.here(this, DEF.obj.BOTTLE);
  if( loc_no_water && (no_water || no_bottle) ) {
    this._needObject();
  } else {
    this.object = DEF.obj.WATER;
    this._verbDrink();
  }
};

exports._verbDrink = function () {
  if (this.object !== DEF.obj.WATER) {
    this._rspeak(110);
  
  } else if (gu.liq(this) !== DEF.obj.WATER || !gu.here(this, DEF.obj.BOTTLE)) {
    this._actionSpeak();

  } else {
    this.prop[DEF.obj.BOTTLE] = 1;
    this.place[DEF.obj.WATER] = 0;
    this._rspeak(74);
  }
};

exports._verbDrop = function () {
  // Dynamite
  const toting_rod = gu.toting(this, DEF.obj.ROD);
  const toting_rod2 = gu.toting(this, DEF.obj.ROD2);
  const is_rod = this.object === DEF.obj.ROD;
  if (toting_rod2 && is_rod && !toting_rod) {
    this.object = DEF.obj.ROD2;
  }

  if (!gu.toting(this, this.object)) {
    this._actionSpeak();
    return;
  }

  // Snake / Bird:
  if (this.object === DEF.obj.BIRD && gu.here(this, DEF.obj.SNAKE)) {
    this._rspeak(30);
    if (this.closed) {
      console.log("dwarfend()");
    }
    gu.destroy(this, DEF.obj.SNAKE);
    this.prop[DEF.obj.SNAKE] = -1;
    this.prop[DEF.obj.BIRD] = 0;
    gu.drop(this, DEF.obj.BIRD, this.loc);
    return;
  }

  // Coins / Vending machine:
  if (this.object === DEF.obj.COINS && gu.here(this, DEF.obj.VEND)) {
    gu.destroy(this, DEF.obj.COINS);
    gu.drop(this, DEF.obj.BATTERIES, this.loc);
    this._pspeak(DEF.obj.BATTERIES, 0);
    return;
  }
  
  // Bird / Dragon:
  const is_bird = this.object === DEF.obj.BIRD;
  const at_dragon = gu.at(this, DEF.obj.DRAGON);
  const dragon_prop = this.prop[DEF.obj.DRAGON];
  if (is_bird && at_dragon && dragon_prop === 0) {
    this._rspeak(154);
    gu.destroy(this, DEF.obj.BIRD);
    this.prop[DEF.obj.BIRD] = 0;
    if (this.place[DEF.obj.SNAKE] !== 0) {
      this.tally2 ++;
    }
    return;
  }

  // Bear / Troll:
  if (this.object === DEF.obj.BEAR && gu.at(this, DEF.obj.TROLL)) {
    this._rspeak(163);
    gu.move(this, DEF.obj.TROLL, 0);
    gu.move(this, DEF.obj.TROLL+MAXOBJ, 0);
    gu.move(this, DEF.obj.TROLL2, 117);
    gu.move(this, DEF.obj.TROLL2+MAXOBJ, 122);
    this.prop[DEF.obj.TROLL] = 2;
    return;
  }

  // Vase:
  if (this.object === DEF.obj.VASE) {
    if (this.loc === 96) {
      this._rspeak(54);
    } else {
      this.prop[DEF.obj.VASE] = gu.at(this, DEF.obj.PILLOW) ? 0 : 2;
      this._pspeak(DEF.obj.VASE, this.prop[DEF.obj.VASE]+1);
      if (this.prop[DEF.obj.VASE] !== 0) {
        this.fixed[DEF.obj.VASE] = -1;
      }
    }
    return;
  }

  // Liquids and such:
  const liq = gu.liq(this);
  if (liq === this.object) {
    this.object = DEF.obj.BOTTLE;
  }
  if (this.object == DEF.obj.BOTTLE && liq !== 0) {
    this.place[liq] = 0;
  }

  // Bird / Cage:
  if (this.object === DEF.obj.CAGE && this.prop[DEF.obj.BIRD] !== 0) {
    gu.drop(this, DEF.obj.BIRD, this.loc);
  }
  if (this.object === DEF.obj.BIRD) {
    this.prop[DEF.obj.BIRD] = 0;
  }

  // Else, just drop it:
  gu.drop(this, this.object, this.loc);
};

exports._intransitiveQuit = function () {
  this._rspeak(22);
  this.state = "giveup_yesno";
  this.stopEarly = true;
};

exports._verbBlast = function () {
  if (this.prop[DEF.obj.ROD2] < 0 || !this.closed) {
    this._actionSpeak();
    return;
  }

  this.bonus = 133;
  if (this.loc === 115) {
    this.bonus = 134;
  }
  if (gu.here(this, DEF.obj.ROD2)) {
    this.bonus = 135;
  }
  this._rspeak(this.bonus);

  // TODO: Differentiate between good ending and death here:
  this._death();
};

exports._intrasitiveFoo = function () {
  var w1 = this._analyzeWord(this.word1, 3000);
  var mod = (w1 ? w1.code : -1) % 1000;
  var msg = 42;

  if (this.foobar !== 1-mod) {
    if (this.foobar !== 0) {
      msg = 151;
    }
    this._rspeak(msg);
    return;
  }

  this.foobar = k;
  if (k !== 4) { return; }

  this.foobar = 0;

  const egg_place = this.place[DEF.obj.EGGS];
  const troll_place = this.place[DEF.obj.TROLL];
  const troll_prop = this.prop[DEF.obj.TROLL];
  const have_eggs = gu.toting(this, DEF.obj.EGGS);

  if (egg_place === 92 || (have_eggs && this.loc === 92)) {
    this._rspeak(msg);
    return;
  }

  if (egg_place === 0 && troll_place === 0 && troll_prop === 0) {
    this.prop[DEF.obj.TROLL] = 1;
  }

  var k;
  if (gu.here(this, DEF.obj.EGGS)) {
    k = 1;
  } else if (this.loc === 92) {
    k = 0;
  } else {
    k = 2;
  }

  gu.move(this, DEF.obj.EGGS, 92);
  this._pspeak(DEF.obj.EGGS, k);
};

exports._verbSay = function () {
  var w = this.word1 == "say" ? this.wordRest : this.word1;
  this._msg(`Okay. \"${w}\"`);
};

exports._verbOn = function () {
  if (!gu.here(this, DEF.obj.LAMP)) {
    this._actionSpeak();
  
  } else if (this.limit < 0) {
    this._rspeak(184);
  
  } else {
    this.prop[DEF.obj.LAMP] = 1;
    this._rspeak(39);
    if (this.wzdark) {
      this.wzdark = 0;
      // TODO: Is this one needed?
      this._handleDescription();
    }
  }
};

exports._verbOff = function () {
  if (!gu.here(this, DEF.obj.LAMP)) {
    this._actionSpeak();

  } else {
    this.prop[DEF.obj.LAMP] = 0;
    this._rspeak(40);
  }
};

exports._verbWave = function () {
  const have_obj = gu.toting(this, this.object);
  const have_rod = gu.toting(this, DEF.obj.ROD2);
  const not_rod = this.object != DEF.obj.ROD;
  const at_fissure = gu.at(this, DEF.obj.FISSURE);

  if (!have_obj && (not_rod || !have_rod)) {
    this._rspeak(29);

  } else if (not_rod || !at_fissure || !have_obj || this.closing) {
    this._actionSpeak();

  } else {
    this.prop[DEF.obj.FISSURE] = 1 - this.prop[DEF.obj.FISSURE];
    this._pspeak(DEF.obj.FISSURE, 2 - this.prop[DEF.obj.FISSURE]);
  }
};
