"use strict";

const DEF = require('../vars/defs.json');
const gu = require('../gameUtils');

const MAXOBJ   = 100;  // max # of objects in cave

exports._doMove = function () {
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

exports._goBack = function () {
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

exports._doTravel = function () {
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
        break;
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
    this._specialMove(cur.tdest);
  } else {
    this.newloc = cur.tdest;
  }
};

exports._badMove = function () {
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

exports._specialMove = function (rdest) {
  switch(rdest - 300) {
    case 1:
      var hold = this.holding;
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
