const DEF = require('../vars/defs.json');
const gu = require('../gameUtils');


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
      console.log("actspk();");
      break;

    case DEF.averb.TAKE:
      console.log("vtake();");
      break;

    case DEF.averb.DROP:
      console.log("vdrop();");
      break;

    case DEF.averb.OPEN:
    case DEF.averb.LOCK:
      console.log("vopen();");
      break;

    case DEF.averb.SAY:
      console.log("vsay();");
      break;

    case DEF.averb.NOTHING:
      this._rspeak(54);
      break;

    case DEF.averb.ON:
      console.log("von();");
      break;

    case DEF.averb.OFF:
      console.log("voff();");
      break;

    case DEF.averb.WAVE:
      console.log("vwave();");
      break;

    case DEF.averb.KILL:
      console.log("vkill();");
      break;

    case DEF.averb.POUR:
      console.log("vpour();");
      break;

    case DEF.averb.EAT:
      console.log("veat();");
      break;

    case DEF.averb.DRINK:
      console.log("vdrink();");
      break;

    case DEF.averb.RUB:
      if (this.object != DEF.obj.LAMP) {
        this._rspeak(76);
      } else {
        console.log("actspk();");
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
      console.log("vblast();");
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
