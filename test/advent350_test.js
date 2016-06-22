/* eslint-env mocha */

const adv = require('../lib/advent350');
const gu = require('../lib/advent350/gameUtils');
const assert = require('assert');

describe("Adventure 350", function () {
  var game;

  beforeEach(() => gu.reseed(123456));
  beforeEach(function () {
    game = adv.state();
  });

  it("rejects bad states", function () {
    game.state = "asdfasdf";
    _test("derp", /fatal error/i, /invalid state/i, /asdfasdf/i);
  });

  describe("during startup", function () {
    it("retries on bad input", function () {
      _test("", /welcome to adventure/i);
      _test("foobar", /yes.*or.*no/i);
    });
    it("accepts a yes", function () {
      _test("", /welcome to adventure/i);
      _test("yes", /somewhere nearby is colossal cave/i, /standing at the end of a road/i);
    });
    it("accepts a no", function () {
      _test("", /welcome to adventure/i);
      _test("no", /standing at the end of a road/i);
    });
  });

  describe("basic game mechanics", function () {
    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("no", /standing at the end of a road/i);
    });

    it("rejects stupid stuff", function () {
      _test("fdafda", /don't know that word/i);
    });

    it("cardinal directions work", function () {
      _test("south", /valley in the forest/i);
    });

    it("ignores case + spacing", function () {
      _test("  walk\tSOUth      ", /valley in the forest/i);
    });

    it("location-based directions work", function () {
      _test("building", /inside a building/i);
    });

    it("can ask for help", function () {
      _test("help", /i know of places, actions, and things/i);
      _test("? ?", /calm/i, /devour/i, /peruse/i, /north/i, /building/i, /giant/i);
    });

    it("can say stuff", function () {
      _test("say Hello World!", /Hello World!/);
    });

    it("can quit", function () {
      _test("quit", /really want to quit/i);
      _test("n", /ok/i);
      assert(!game.isDone());
      _test("quit", /really want to quit/i);
      _test("y", /game over/i, /score: 2/i);
      assert(game.isDone());
      assert.deepEqual(game.advance("building"), []);
    });

    it("can take items", function () {
      _test("building", /inside a building/i);
      _test("take keys", /ok/i);
    });

    it("can ask for inventory", function () {
      _test("building", /inside a building/i);
      _test("take keys", /ok/i);
      _test("inventory", /currently holding/i, /keys/i);
    });

    it("can drop items", function () {
      _test("building", /inside a building/i);
      _test("take keys", /ok/i);
      _test("inventory", /currently holding/i, /keys/i);
      _test("drop keys", /ok/i);
      _test("inventory", /not carrying anything/i);
    });

    it("can drink from the stream", function () {
      _test("drink", /taken a drink/i);
      _test("drink water", /taken a drink/i);
    });

    it("has flavor text for odd stuff", function () {
      _test("calm keys", /no keys here/i);
      _test("building", /inside a building/i);
      _test("downstream", /sewer pipes/i, /use the exit/i);
      _test("calm keys", /care to explain how/i);
      _test("walk food", /where/i);
      _test("quit food", /don't understand/i);
      _test("score bottle", /don't understand/i);
      _test("foo keys", /don't know how/i);
      _test("brief lamp", /on what/i);
      _test("suspend food", /don't understand/i);
      _test("hours lamp", /don't understand/i);
      _test("log lamp", /don't understand/i);
      _test("rub lamp", /not particularly rewarding/i);
      _test("rub keys", /nothing unexpected happens/i);
      _test("log", /intransitive verb not implemented/i);
      _test("drop", /drop what/i);
      _test("nothing", /ok/i);
      _test("nothing keys", /ok/i);
      _test("eat bird", /no bird here/i);
      _test("wave", /wave what/);
      _test("wave lamp", /aren't carrying it/i);
      _test("eat food", /it was delicious/i);
      _test("inventory bottle", /right here with you/i);

      _test("take lamp", /ok/i);
      _test("inventory", /holding the following/i, /brass lantern/i);
      _test("wave lamp", /nothing happens/i);
      _test("drop lantern", /ok/i);
    });

    it("can calculate scores at start", function () {
      _test("score", /showing up: 2/i, /score: 2/i);
    });

    it("supports xyzzy magic", function () {
      _test("xyzzy", /nothing happens/i);
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("lamp on", /lamp is now on/i);
      _test("xyzzy", /debris room filled with stuff/i);
    });

    it("supports plugh magic", function () {
      _test("plugh", /nothing happens/i);
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on lamp", /lamp is now on/i);
      _test("plugh", /large "Y2" on a rock/i);
    });

    it("understands darkness", function () {
      _test("building", /inside a building/i);
      _test("xyzzy", /it is now pitch dark/i);
    });

    it("can toggle the lamp on/off", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("plugh", /pitch dark/i);
      _test("lamp on", /lamp is now on/i, /large "Y2" on a rock/);
      _test("lamp off", /lamp is now off/i);
      _test("look", /pitch dark/i);
    });
  });

  describe("when stumbling in the dark", function () {
    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("no", /standing at the end of a road/i);
    });

    it("can die and give up", function () {
      _test("building", /inside a building/i);
      _test("xyzzy", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /fell into a pit/i, /try to reincarnate you/i);
      _test("nah", /ok/i, /game over/i, /score: 2/i);
      assert(game.isDone());
    });

    it("can die and get reincarnated a few times", function () {
      _test("building", /inside a building/i);
      _test("xyzzy", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /fell into a pit/i, /try to reincarnate you/i);
      _test("y", /all right/i, /orange smoke/i, /inside building/i);
      _test("xyzzy", /pitch dark/i);
      _test("w", /fell into a pit/i, /clumsy oaf/i);
      _test("y", /where did I put my orange smoke/i, /inside building/i);
      _test("xyzzy", /pitch dark/i);
      _test("w", /fell into a pit/i, /out of orange smoke/i);
      _test("y", /do it yourself/i, /game over/i, /score: 6/i);
    });

    it("drops items correctly on death", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("take food", /ok/i);
      _test("take bottle", /ok/i);
      _test("take keys", /ok/i);
      _test("xyzzy", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /pitch dark/i);
      _test("w", /pitch dark/i);
      _test("e", /fell into a pit/i, /try to reincarnate you/i);
      _test("y", /all right/i, /orange smoke/i, /inside building/i);
      _test("exit", /end of road/i, /brass lamp/i);
      _test("take lamp", /ok/i);
      _test("lamp on", /lamp is now on/i);
      _test("building", /inside building/i);
      _test("xyzzy", /debris room/i, /keys/i, /food/i, /bottle/i, /black rod/i);
    });
  });

  describe("handles scenarios", function () {

    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("nope", /standing at the end of a road/i);
    });

    it("with the bird", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on lamp", /lamp is now on/i);
      _test("xyzzy", /debris room filled with stuff/i);
      _test("take rod", /ok/);
      _test("w", /east\/west canyon/i);
      _test("w", /splendid chamber/i, /little bird/i);
      _test("take bird", /becomes disturbed/i, /you cannot catch it/i);
      _test("eat bird", /lost my appetite/i);
      _test("calm bird", /care to explain how/);
      _test("kill bird", /little bird is now dead/i);
    });

    it("with the snake", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on lamp", /lamp is now on/i);
      _test("xyzzy", /debris room filled with stuff/i);
      _test("e", /crawling over cobbles/i, /small wicker cage/i);
      _test("take cage", /ok/i);
      _test("w", /debris room/i);
      _test("w", /east\/west canyon/i);
      _test("w", /splendid chamber/i, /little bird/i);
      _test("take bird", /ok/i);
      _test("w", /small pit breathing traces of white mist/i, /stone steps lead down/i);
      _test("down", /vast hall/i, /stone steps lead up/i);
      _test("north", /hall of the mountain king/i, /fierce snake/i);
      _test("calm snake", /care to explain how/i);
      _test("attack snake", /doesn't work/i);
      _test("kill", /doesn't work/i);
      _test("eat snake", /just lost my appetite/i);
      _test("feed snake", /snake has now devoured your bird/i);
    });
  });

  describe("opening the grate", function () {
    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("nah", /standing at the end of a road/i);
      _test("building", /inside a building/i);
      _test("take keys", /ok/i);
      _test("exit", /end of road again/i);
      _test("gully", /valley in the forest/i);
      _test("downstream", /2-inch slit in the rock/i);
    });

    it("fails at wrong place", function () {
      _test("open", /nothing here with a lock/);
    });

    it("fails without keys", function () {
      _test("drop keys", /ok/);
      _test("downstream", /grate mounted in concrete/i);
      _test("open", /no keys/);
    });

    it("works with intransitive lock", function () {
      _test("downstream", /grate mounted in concrete/i);
      _test("lock", /now unlocked/);
    });

    it("works with intransitive unlock", function () {
      _test("downstream", /grate mounted in concrete/i);
      _test("unlock", /now unlocked/);
    });

    it("works with direct open", function () {
      _test("downstream", /grate mounted in concrete/i);
      _test("open grate", /now unlocked/);
    });
  });

  describe("can progress in the game", function () {

    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("nah", /standing at the end of a road/i);
    });

    it("can unlock the grate", _upTo(1));
    it("can go down the pit", _upTo(2));
    it("can bring back diamonds", _upTo(3));
    it("can drive back the snake", _upTo(4));


    function _upTo(num) {
      return () => STEPS.slice(0, num).forEach(fn => fn());
    }

    var STEPS = [
      function () {
        _test("building", /inside a building/i);
        _test("take lamp", /ok/i);
        _test("take keys", /ok/i);
        _test("exit", /end of road again/i);
        _test("look", /not allowed to give more detail/i, /end of a road/i);
        _test("gully", /valley in the forest/i);
        _test("downstream", /2-inch slit in the rock/i);
        _test("downstream", /grate mounted in concrete/i);
        _test("unlock grate", /now unlocked/i);
        _test("enter", /small chamber beneath a 3x3 steel grate/i);
      },
      function () {
        _test("w", /crawling over cobbles/i, /small wicker cage/i);
        _test("take cage", /ok/i);
        _test("lamp on", /lamp is now on/);
        _test("w", /debris room/i, /xyzzy/i, /black rod/i);
        _test("west", /awkward sloping east\/west canyon/i);
        _test("w", /frozen rivers of orange stone/i, /little bird/i);
        _test("take bird", /ok/i);
        _test("east", /awkward sloping east\/west canyon/i);
        _test("e", /in debris room/i, /black rod/i);
        _test("take rod", /ok/i);
        _test("w", /awkward sloping east\/west canyon/i);
        _test("w", /bird chamber/i);
        _test("w", /small pit breathing traces of white mist/i, /stone steps lead down/i);
        _test("down", /vast hall/i, /stone steps lead up/i);
      },
      function () {
        _test("w", /bank of a fissure/i);
        _test("wave rod", /crystal bridge/i, /spans the fissure/i);
        _test("cross", /west side/i, /spans the fissure/i, /diamonds/i);
        _test("take diamonds", /ok/i);
        _test("east", /east bank/i, /little dwarf/i, /little axe/i);
        _test("take axe", /ok/);
        _test("e", /hall of mists/i);
        _test("up", /top of small pit/i);
        _test("e", /bird chamber/i);
        _test("e", /east\/west canyon/i);
        _test("east", /debris room/i);
        _test("xyzzy", /inside building/i);
        _test("drop diamonds", /ok/i);
        _test("drop axe", /ok/);
        _test("score", /showing up: 2/i, /treasures: 12/i, /getting well in: 25/i, /score: 39/i);
      },
      function () {
        _test("drop rod", /ok/);
        _test("xyzzy", /debris room/i);
        _test("west", /east\/west canyon/i);
        _test("west", /bird chamber/i);
        _test("west", /small pit/i, /rough stone steps lead down/i);
        _test("down", /hall of mists/i, /rough stone steps lead up/i);
        _test("south", /low room/i, /won't get it up the steps/i, /nugget of gold/i);
        _test("take nugget", /ok/i);
        _test("north", /hall of mists/i);
        _test("up", /dome is unclimbable/i);
        _test("n", /hall of the mountain king/i, /green fierce snake/i);
        _test("drop bird", /drives the snake away/i);
        _test("take bird", /ok/i);
        _test("n", /low N\/S passage/i, /bars of silver/i);
        _test("take silver", /ok/);
        _test("north", /large room/i, /y2/i, /hollow voice/);
        _test("plugh", /inside building/i, /black rod/i, /tasty food/i, /bottle of water/i, /diamonds/i);
        _test("drop nugget", /ok/i);
        _test("drop silver", /ok/i);
        _test("score", /showing up: 2/i, /treasures: 36/i, /getting well in: 25/i, /score: 63/i);
      }
    ];
  });

  /**
   * Will provide a string to the current game, and will make sure
   * that all regexps given match at least one line from the output.
   *
   * @param  {String} str   Input from user.
   * @param  {RegExp} ...re Any number of regular expressions.
   */
  function _test(str /* ... regexps */) {
    var res = [].slice.call(arguments, 1);
    var out = game.advance(str);

    res.forEach(function (re) {
      for (var i=0; i<out.length; i++) {
        if (re.test(out[i])) { return; }
      }
      var txt = out.join("\n");
      assert.fail(0, 0, `Didn't find a line like ${re} in output:\n-----\n${txt}\n-----`);
    });
  }
});
