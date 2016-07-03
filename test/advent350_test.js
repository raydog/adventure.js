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

    it("can fast travel to the grate", function () {
      _test("grate", /depression floored with bare dirt/i);
    });

    it("can fast travel back to the grate", function () {
      _test("building", /inside a building/i);
      _test("xyzzy", /now pitch dark/i);
      _test("grate", /small chamber/i, /steel grate/i, /grate is locked/i);
    });

    it("has flavor text for odd stuff", function () {
      _test("kill", /nothing here to attack/i);
      _test("take", /take what/i);
      _test("find cave", /i would try the stream/i);
      _test("calm keys", /no keys here/i);
      _test("building", /inside a building/i);
      _test("take", /take what/i);
      _test("unlock keys", /can't unlock/i);
      _test("pour keys", /aren't carrying/i);
      _test("throw keys", /aren't carrying/i);
      _test("downstream", /sewer pipes/i, /use the exit/i);
      _test("keys", /what do you want to do with the keys/i);
      _test("calm keys", /care to explain how/i);
      _test("kill keys", /ridiculous/i);
      _test("wake keys", /ridiculous/i);
      _test("rub lamp", /not particularly rewarding/i);
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
      _test("take lamp", /already carrying it/i);
      _test("pour lamp", /can't pour that/i);
      _test("find lamp", /already carrying it/i);
      _test("inventory", /holding the following/i, /brass lantern/i);
      _test("wave lamp", /nothing happens/i);
      _test("drop lantern", /ok/i);
      _test("take bottle", /ok/i);
      _test("pour bottle", /ground is wet/i);
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

    it("can toggle the lamp on/off in an intransitive way", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("plugh", /pitch dark/i);
      _test("on", /lamp is now on/i, /large "Y2" on a rock/);
      _test("off", /lamp is now off/i);
      _test("look", /pitch dark/i);
    });

    it("can totally waste batteries", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on", /lamp is now on/i);
      for (var i=0; i<328; i++) {
        _test("downstream", /stream flows out/i);
      }
      _test("downstream", /lamp has run out of power/i);
      _test("downstream", /not much point/i, /game over/i);
    });

    it("when reading", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("plugh", /pitch dark/i);
      _test("read rod", /see no rod here/i);
      _test("on", /lamp is now on/i);
      _test("s", /low n\/s passage/i);
      _test("down", /dirty broken passage/i);
      _test("w", /room full of dusty rocks/i);
      _test("down", /complex junction/i);
      _test("east", /anteroom/i, /spelunker today/i);
      _test("read magazine", /written in dwarvish/i);
    });

    it("can fail to get the bird", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on", /lamp is now on/i);
      _test("xyzzy", /debris room/i);
      _test("w", /east\/west canyon/i);
      _test("w", /splendid chamber/i, /little bird/i);
      _test("take", /cannot carry it/i);
    });
  });

  describe("basic liquid mechanics", function () {
    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("no", /standing at the end of a road/i);
    });

    it("can't take without bottle", function () {
      _test("take water", /nothing in which to carry it/i);
    });

    it("can't fill with full bottle", function () {
      _test("building", /inside a building/i);
      _test("take bottle", /ok/);
      _test("fill bottle", /bottle is already full/i);
    });

    describe("with oil", function () {
      beforeEach(function () {
        _test("building", /inside a building/i);
        _test("take bottle", /ok/);
        _test("take lantern", /ok/);
        _test("on", /lamp is now on/i);
        _test("plugh", /y2/i);
        _test("s", /low n\/s passage/i);
        _test("down", /dirty broken passage/i);
        _test("w", /large room full of dusty rocks/i);
        _test("down", /complex junction/i);
        _test("w", /bedquilt/i);
        _test("w", /swiss cheese/i);
        _test("w", /east end of the twopit room/i);
        _test("down", /bottom of the eastern pit/i, /pool of oil/i);
      });


      it("can't take with oil with full bottle", function () {
        _test("take oil", /bottle is already full/i);
      });

      it("can't drink oil", function () {
        _test("drink water", /is now empty/i);
        _test("take oil", /full of oil/i);
        _test("drink oil", /don't be ridiculous/i);
      });

      it("can't drink oil from ground", function () {
        _test("up", /east end of twopit/i);
        _test("drop bottle", /ok/i);
        _test("down", /east pit/i);
        _test("drink", /drink what/i);
      });
    });
  });

  describe("when travelling back", function () {
    beforeEach(function () {
      _test("", /welcome to adventure/i);
      _test("no", /standing at the end of a road/i);
    });

    it("works for standard movement", function () {
      _test("s", /valley in the forest/i);
      _test("go back", /end of road/i);
    });

    it("works with extra conditions", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("lamp on", /lamp is now on/i);
      _test("plugh", /y2/i);
      _test("s", /low n\/s passage/i);
      _test("back", /y2/i);
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
      _test("kill", /little bird is now dead/i);
    });

    it("with the snake", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("on lamp", /lamp is now on/i);
      _test("xyzzy", /debris room filled with stuff/i);
      _test("e", /crawling over cobbles/i, /small wicker cage/i);
      _test("take cage", /ok/i);
      _test("unlock cage", /has no lock/i);
      _test("w", /debris room/i);
      _test("w", /east\/west canyon/i);
      _test("w", /splendid chamber/i, /little bird/i);
      _test("take bird", /ok/i);
      _test("w", /small pit breathing traces of white mist/i, /stone steps lead down/i);
      _test("down", /vast hall/i, /stone steps lead up/i);
      _test("north", /hall of the mountain king/i, /fierce snake/i);
      _test("north", /can't get by the snake/i);
      _test("calm snake", /care to explain how/i);
      _test("attack snake", /doesn't work/i);
      _test("kill", /doesn't work/i);
      _test("eat snake", /just lost my appetite/i);
      _test("feed snake", /snake has now devoured your bird/i);
    });

    it("with a dwarf", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("take food");
      _test("on lamp", /lamp is now on/i);
      _test("plugh", /y2/i);

      // Wait until a dwarf shows up:
      for (var i=0; i<20; i++) {
        _test("say waiting " + i, /waiting/i);
      }
      _test("say last wait", /last wait/i, /little dwarf/i, /threw a little axe/i);
      _test("take axe", /ok/i);

      _test("calm dwarf", /care to explain how/i);
      _test("west", /little dwarf/i, /overlooking a huge pit/i);
      _test("kill", /bare hands/i);
      _test("feed dwarf", /dwarves eat only coal/i, /really mad/i, /knife is thrown/i, /misses/i);
      _test("eat dwarf", /lost my appetite/i, /knife is thrown/i, /misses/i);
      _test("find dwarf", /right here with you/i, /knife is thrown/i, /misses/i);

      _test("throw axe", /killed a little dwarf/i);
    });

    it("with a murderous dwarf", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("take food");
      _test("on lamp", /lamp is now on/i);
      _test("plugh", /y2/i);

      // Wait until a dwarf shows up:
      for (var i=0; i<20; i++) {
        _test("say waiting " + i, /waiting/i);
      }
      _test("say last wait", /last wait/i, /little dwarf/i, /threw a little axe/i);
      _test("take axe", /ok/i);
      _test("w", /little dwarf/, /overlooking a huge pit/i);
      _test("e", /little dwarf/, /blocks your way/i);
      _test("e", /little dwarf/, /y2/i);
      _test("e", /little dwarf/, /jumble of rock/i);
      _test("w", /little dwarf/, /no way/i, /gets you/i);
    });

    it("with the dragon", function () {
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
      _test("e", /east\/west canyon/i);
      _test("e", /debris room/i);
      _test("xyzzy", /inside building/i);
      _test("plugh", /y2/i);

      // Wait until a dwarf shows up:
      for (var i=0; i<12; i++) {
        _test("say waiting", /waiting/i);
      }
      _test("say waiting", /waiting/i, /little dwarf/i, /threw a little axe/i);
      _test("take axe", /ok/i);
      _test("throw axe", /killed a little dwarf/i);
      _test("take axe", /ok/i);

      _test("s", /low N\/S passage/i);
      _test("s", /hall of the mountain king/i);
      _test("sw", /secret canyon/i);
      _test("w", /secret canyon/i, /fierce dragon/i, /persian rug/i);

      _test("n", /best not try/i);
      _test("calm dragon", /care to explain how/i);
      _test("feed dragon", /nothing here it wants to eat/i);
      _test("eat dragon", /lost my appetite/i);
      _test("take rug", /can't be serious/i);
      _test("throw axe", /bounces harmlessly off the dragon/i);
      _test("drop bird", /gets burnt to a cinder/i);

      _test("kill dragon", /with what/i, /bare hands/i);
      _test("n", /ok/i);
      _test("kill dragon", /with what/i, /bare hands/i);
      _test("y", /vanquished a dragon/i);
      _test("kill dragon", /poor thing is already dead/i);

      _test("take rug", /ok/);
    });

    it("with the troll", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("take food", /ok/i);
      _test("plugh", /pitch dark/i);
      _test("on", /lamp is now on/i, /y2/i);
      _test("s", /low n\/s passage/i, /bars of silver/i);
      _test("take silver", /ok/i);
      _test("down", /dirty broken passage/i);
      _test("west", /dusty rocks/i);
      _test("down", /complex junction/i);
      _test("w", /bedquilt/i);
      _test("n", /back in the main passage/i);
      _test("w", /swiss cheese/i);
      _test("nw", /back in the main passage/i);
      _test("nw", /back in the main passage/i, /little dwarf/i);
      _test("take axe", /ok/i);
      _test("nw", /oriental room/i);
      _test("w", /low room/i);
      _test("sw", /long winding corridor/i);
      _test("up", /large deep chasm/i, /pay troll/i);
      _test("throw axe", /deftly catches the axe/i);
      _test("take axe", /ok/i, /little dwarf/i);
      _test("throw axe", /killed a little dwarf/i);
      _test("take axe", /ok/i);

      _test("cross", /refuses to let you cross/i);
      _test("calm troll", /explain how/i);
      _test("kill", /close relatives with the rocks/i);
      _test("eat troll", /lost my appetite/i);
      _test("feed troll", /avarice/i);
      _test("take troll", /can't be serious/i);
      _test("jump", /suggest you go across/i);
      _test("throw troll", /aren't carrying it/i);
      _test("throw silver", /scurries away/i);
      _test("cross", /far side of the chasm/i, /troll is nowhere/i);
    });

    it("with the bear", function () {
      _test("building", /inside a building/i);
      _test("take lamp", /ok/i);
      _test("take food", /ok/i);
      _test("take keys", /ok/i);
      _test("plugh", /pitch dark/i);
      _test("on", /lamp is now on/i, /y2/i);
      _test("s", /low n\/s passage/i, /bars of silver/i);
      _test("take silver", /ok/i);
      _test("down", /dirty broken passage/i);
      _test("west", /dusty rocks/i);
      _test("down", /complex junction/i);
      _test("w", /bedquilt/i);
      _test("n", /back in the main passage/i);
      _test("w", /swiss cheese/i);
      _test("nw", /back in the main passage/i);
      _test("nw", /back in the main passage/i, /little dwarf/i);
      _test("take axe", /ok/i);
      _test("nw", /oriental room/i);
      _test("w", /low room/i);
      _test("sw", /long winding corridor/i);
      _test("up", /large deep chasm/i, /pay troll/i);
      _test("throw silver", /scurries away/i);
      _test("cross", /far side of the chasm/i);
      _test("ne", /long east\/west corridor/i);
      _test("e", /path forks/i);
      _test("se", /oddly shaped limestone formations/i);
      _test("s", /standing at the entrance/i);
      _test("e", /barren room/i, /ferocious cave bear/i, /locked to the wall/i);

      _test("fight", /bear hands/i);
      _test("take chain", /can't be serious/i);
      _test("break chain", /beyond your power/i);
      _test("eat bear", /lost my appetite/i);
      _test("throw axe", /axe misses/i, /near the bear/i);
      _test("take axe", /can't be serious/i);
      _test("take bear", /can't be serious/i);
      _test("take chain", /can't be serious/i);
      _test("unlock", /no way to get past/i);
      _test("throw food", /eagerly wolfs down your food/i);
      _test("look", /gentle cave bear/i);
      _test("take bear", /bear is still chained/i);
      _test("take chain", /chain is still locked/i);
      _test("lock chain", /already locked/i);
      _test("unlock chain", /now unlocked/i);
      _test("unlock chain", /already unlocked/i);
      _test("kill bear", /he only wants to be your friend/i);
      _test("take bear", /ok/i);
      _test("take chain", /ok/i);
      _test("lock chain", /now locked/i);
    });

    describe("with the troll and bear", function () {
      beforeEach(function () {
        _test("building", /inside a building/i);
        _test("take lamp", /ok/i);
        _test("take food", /ok/i);
        _test("take keys", /ok/i);
        _test("plugh", /pitch dark/i);
        _test("on", /lamp is now on/i, /y2/i);
        _test("s", /low n\/s passage/i, /bars of silver/i);
        _test("take silver", /ok/i);
        _test("down", /dirty broken passage/i);
        _test("west", /dusty rocks/i);
        _test("down", /complex junction/i);
        _test("w", /bedquilt/i);
        _test("n", /back in the main passage/i);
        _test("w", /swiss cheese/i);
        _test("nw", /back in the main passage/i);
        _test("nw", /back in the main passage/i, /little dwarf/i);
        _test("take axe", /ok/i);
        _test("nw", /oriental room/i);
        _test("w", /low room/i);
        _test("sw", /long winding corridor/i);
        _test("up", /large deep chasm/i, /pay troll/i);
        _test("throw silver", /scurries away/i);
        _test("cross", /far side of the chasm/i);
        _test("ne", /long east\/west corridor/i);
        _test("e", /path forks/i);
        _test("se", /oddly shaped limestone formations/i);
        _test("s", /standing at the entrance/i);
        _test("drop food", /ok/i);
        _test("e", /barren room/i, /ferocious cave bear/i, /locked to the wall/i);
        _test("feed bear", /nothing here it wants to eat/i);
        _test("w", /front of barren room/i);
        _test("take food", /ok/i);
        _test("e", /barren room/i);
        _test("feed bear", /wolfs down your food/i);
        _test("unlock chain", /now unlocked/i);
        _test("take chain", /ok/i);
        _test("take bear", /ok/i);
        _test("w", /being followed/i, /front of barren room/i);
        _test("lock chain", /nothing here to which/i);
        _test("drop keys", /ok/i);
        _test("w", /being followed/i, /limestone passage/i);
        _test("lock chain", /no keys/i);
        _test("n", /being followed/i, /fork in path/i);
        _test("w", /being followed/i, /corridor/i);
        _test("w", /being followed/i, /ne side of chasm/i);
        _test("feed bear", /nothing here to eat/i);
        _test("cross", /troll steps out from beneath/i);
      });

      it("can die on the bridge", function () {
        _test("throw chain", /catches your treasure/i);
        _test("cross", /bridge buckles/i, /gotten yourself killed/i);
      });

      it("can scare away the troll", function () {
        _test("throw bear", /startled shriek/i);
        _test("drop bear", /ok/i);
        _test("look", /contented-looking bear/i);
      });
    });

    describe("with the vase", function () {
      beforeEach(function () {
        _test("building", /inside a building/i);
        _test("take lamp", /ok/i);
        _test("plugh", /pitch dark/i);
        _test("on", /lamp is now on/i, /y2/i);
        _test("s", /low n\/s passage/i, /bars of silver/i);
        _test("down", /dirty broken passage/i);
        _test("west", /dusty rocks/i);
        _test("down", /complex junction/i);
        _test("w", /bedquilt/i);
        _test("n", /back in the main passage/i);
        _test("w", /swiss cheese/i);
        _test("e", /soft room/i, /velvet pillow/i);
        _test("take pillow", /ok/i);
        _test("w", /little dwarf/i, /swiss cheese/i, /little axe/i);
        _test("take axe", /ok/i);
        _test("nw", /oriental room/i, /ming vase/i);
      });

      it("can directly break it", function () {
        _test("take vase", /ok/i);
        _test("break vase", /hurled it delicately/i);
        _test("look", /worthless shards of pottery/i);
      });

      it("can smash on ground", function () {
        _test("take vase", /ok/i);
        _test("drop vase", /delicate crash/i);
        _test("look", /worthless shards of pottery/i);
      });

      it("can shatter with liquid", function () {
        _test("take vase", /ok/i);
        _test("fill vase", /nothing here with which to fill the vase/i);
        _test("se", /swiss cheese/i);
        _test("w", /east end of the twopit room/i);
        _test("down", /bottom of the eastern pit/i);
        _test("drop pillow", /ok/i);
        _test("drop vase", /on a velvet pillow/i);
        _test("fill vase", /aren't carrying it/i);
        _test("take vase", /ok/i);
        _test("fill vase", /change in temperature/i, /delicate crash/i);
      });

      it("can delicately place in soft room", function () {
        _test("take vase", /ok/i);
        _test("se", /swiss cheese/i);
        _test("e", /soft room/i);
        _test("drop vase", /ok/i);
        _test("look", /soft room/i, /ming vase/i);
      });

      it("can delicately place on pillow", function () {
        _test("take vase", /ok/i);
        _test("drop pillow", /ok/i);
        _test("drop vase", /now resting/i, /on a velvet pillow/i);
        _test("look", /oriental room/i, /ming vase/i);
      });
    });

    describe("with the eggs", function () {
      beforeEach(function () {
        _test("building", /inside a building/i);
        _test("take lamp", /ok/i);
        _test("take bottle", /ok/i);
        _test("plugh", /pitch dark/i);
        _test("on", /lamp is now on/i, /y2/i);
        _test("s", /low n\/s passage/i, /bars of silver/i);
        _test("down", /dirty broken passage/i);
        _test("west", /dusty rocks/i);
        _test("down", /complex junction/i);
        _test("w", /bedquilt/i);
        _test("w", /swiss cheese/i);
        _test("w", /east end of the twopit room/i);
        _test("w", /west end of the twopit room/i);
        _test("down", /bottom of the western pit/i);
        _test("pour", /spurts into furious growth/i);
        _test("take axe", /ok/i);
        _test("up", /west end of twopit room./i);
        _test("w", /low circular chamber/i);
        _test("up", /secret n\/s canyon/i);
        _test("n", /north\/south canyon/i);
        _test("n", /edge of a large underground reservoir/i);
        _test("fill bottle", /now full of water/i);
        _test("throw axe", /killed a little dwarf/i);
        _test("take axe", /ok/i);
        _test("s", /mirror canyon/i);
        _test("s", /secret n\/s canyon/i);
        _test("down", /slab room./i);
        _test("s", /west end of twopit room./i);
        _test("down", /west pit/i, /threatening little dwarf/i);
        _test("throw axe", /killed a little dwarf/i);
        _test("pour", /grows explosively/i);
        _test("climb", /scurry through the hole/i, /narrow corridor/i);
        _test("w", /giant room/i, /fee fie foe foo/i, /eggs/i);
      });

      it("can get the chant wrong", function () {
        _test("fee");
        _test("fie");
        _test("foe");
        _test("fum", /can't you read/i);
      });

      it("can get the chant right but do nothing", function () {
        _test("fee");
        _test("fie");
        _test("foe");
        _test("foo", /nothing happens/i);
      });

      it("can get the chant right away from the eggs", function () {
        _test("take eggs", /ok/i);
        _test("s", /narrow corridor/i);
        _test("drop eggs", /ok/i);
        _test("east", /west pit/i);
        _test("fee");
        _test("fie");
        _test("foe");
        _test("foo", /done/i);
      });

      it("can get the chant right in the hall", function () {
        _test("take eggs", /ok/i);
        _test("s", /narrow corridor/i);
        _test("drop eggs", /ok/i);
        _test("west", /giant room/i);
        _test("fee");
        _test("fie");
        _test("foe");
        _test("foo", /large nest here, full of golden eggs/i);
      });

      it("can get the chant right", function () {
        _test("take eggs", /ok/i);
        _test("s", /narrow corridor/i);
        _test("fee");
        _test("fie");
        _test("foe");
        _test("foo", /golden eggs has vanished/i);
        _test("w", /giant room/i, /eggs/i);
      });
    });


    describe("with the emerald", function () {
      beforeEach(function () {
        _test("building", /inside a building/i);
        _test("take lamp", /ok/i);
        _test("plugh", /pitch dark/i);
        _test("on", /lamp is now on/i, /y2/i);
        _test("s", /low n\/s passage/i);
        _test("down", /dirty broken passage/i);
        _test("west", /dusty rocks/i);
        _test("down", /complex junction/i);
        _test("w", /bedquilt/i);
        _test("w", /swiss cheese/i);
        _test("nw", /back in the main passage/i);
        _test("nw", /back in the main passage/i);
        _test("nw", /back in the main passage/i);
        _test("nw", /oriental room/i);
        _test("n", /wide path/i);
        _test("w", /alcove/i, /tight squeeze/i);
      });

      it("can't get through with things", function () {
        _test("east", /won't fit through/i);
      });

      it("can get through with nothing", function () {
        _test("drop lamp", /ok/i);
        _test("east", /small chamber/i, /emerald/i);
      });

      it("can get through with the emerald", function () {
        _test("drop lamp", /ok/i);
        _test("east", /small chamber/i, /emerald/i);
        _test("take emerald", /ok/i);
        _test("west", /alcove/i, /lamp shining nearby/i);
      });

      it("stops plover magic", function () {
        _test("drop lamp", /ok/i);
        _test("east", /small chamber/i, /emerald/i);
        _test("take emerald", /ok/i);
        _test("plover", /emerald here/i);
      });

      it("doesn't stop plover magic when not held", function () {
        _test("drop lamp", /ok/i);
        _test("east", /small chamber/i, /emerald/i);
        _test("plover", /pitch dark/i, /plugh/i);
        _test("plover", /plover room/i);
      });
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
    it("can kill the first dwarf", _upTo(5));
    it("can lose stuff to the pirate and meet the plant", _upTo(6));
    it("can free up the door hinges", _upTo(7));
    it("can lose to the pirate again", _upTo(8));
    it("can steal all the treasure back", _upTo(9));


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
        _test("take", /ok/i);
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
        _test("throw bird", /drives the snake away/i);
        _test("take bird", /ok/i);
        _test("n", /low N\/S passage/i, /bars of silver/i);
        _test("take silver", /ok/);
        _test("north", /large room/i, /y2/i, /hollow voice/);
        _test("plugh", /inside building/i, /black rod/i, /tasty food/i, /bottle of water/i, /diamonds/i);
        _test("drop nugget", /ok/i);
        _test("drop silver", /ok/i);
        _test("drop cage", /ok/i);
      },
      function () {
        _test("take axe", /ok/i);
        _test("take bottle", /ok/i);
        _test("plugh", /y2/i);
        _test("south", /little dwarf/i, /knife is thrown/i, /misses/i);
        _test("calm dwarf", /explain how/i);
        _test("feed dwarf", /nothing here to eat/i, /knife is thrown/i, /misses/i);
        _test("eat dwarf", /lost my appetite/i, /knife is thrown/i, /misses/i);
        _test("find dwarf", /right here with you/i, /knife is thrown/i, /misses/i);
        _test("throw axe", /killed a little dwarf/i, /greasy black smoke/i, /low n\/s passage/i, /axe here/i);
        _test("take axe", /ok/);
      },
      function () {
        _test("south", /hall of mt. king/i);
        _test("south", /south side chamber/i, /jewelry here/i);
        _test("take jewelry", /ok/i);
        _test("north", /hall of mt. king/i);
        _test("sw", /secret canyon/i);
        _test("west", /secret canyon which exits to the north/i, /fierce dragon/i, /persian rug/i);
        _test("kill", /bare hands/i);
        _test("yes", /congratulations/i, /secret canyon/i, /body of a huge green dead dragon/i, /persian rug/i);
        _test("take rug", /ok/i);
        _test("inventory", /currently holding/i, /keys/i, /lantern/i, /bottle/i, /axe/i, /jewelry/i, /rug/i, /bearded pirate/i);
        _test("n", /secret n\/s canyon/i);
        _test("n", /north\/south canyon/i, /25 feet across./i);
        _test("break mirror", /too far up/i);
        _test("s", /secret n\/s canyon/i);
        _test("down", /large low circular chamber/i);
        _test("s", /west end of the twopit room/i, /12-foot-tall beanstalk/i);
        _test("down", /bottom of the western pit/i, /tiny little plant/i, /water, water/i);
        _test("take plant", /deep roots/i);
        _test("pour", /spurts into furious growth/i, /west pit/i, /bellowing "Water!! Water!!"/i);
      },
      function () {
        _test("up", /west end of twopit/i);
        _test("west", /slab room/i);
        _test("up", /secret n\/s canyon/i);
        _test("n", /mirror canyon/i);
        _test("n", /large underground reservoir/i);
        _test("fill bottle", /full of water/i);
        _test("s", /mirror canyon/i);
        _test("s", /secret n\/s canyon/i);
        _test("down", /slab room/i);
        _test("s", /west end of twopit/i);
        _test("down", /west pit/i, /beanstalk/i);
        _test("pour water", /grows explosively/i, /gigantic beanstalk/i);
        _test("up", /west end of twopit/i);
        _test("east", /east end of the twopit room/i);
        _test("down", /bottom of the eastern pit/i);
        _test("fill bottle", /full of oil/i);
        _test("up", /east end of twopit/i);
        _test("west", /west end of twopit/i);
        _test("down", /west pit/i);
        _test("climb", /clamber up the plant/i, /long, narrow corridor/i);
        _test("west", /the giant room/i, /fee fie foe foo/i, /golden eggs/i);
        _test("take eggs", /ok/i);
        _test("north", /immense north\/south passage/i, /rusty, iron door/i);
        _test("pour", /freed up the hinges/i);
      },
      function () {
        _test("north", /magnificent cavern/i, /trident/i);
        _test("inventory", /holding the following/i, /keys/i, /lantern/i, /bottle/i, /axe/i, /eggs/i);
        _test("take trident", /ok/i);
        _test("west", /steep incline/i);
        _test("down", /large low room/i);
        _test("se", /oriental room/i);
        _test("se", /swiss cheese/i);
        _test("ne", /bedquilt/i);
        _test("e", /complex junction/i);
        _test("up", /large room full of dusty rocks/i);
        _test("east", /dirty broken passage/i);
        _test("up", /low n\/s passage/i);
        _test("s", /hall of mt. king/i);
        _test("n", /low N\/S passage/i);
        _test("n", /y2/i, /bearded pirate/i, /vanishes into the gloom/i);
        _test("off", /lamp is now off/i);
        _test("plugh", /inside building/i);
        _test("inventory", /holding/i, /keys/i, /lantern/i, /bottle/i, /axe/i);
        _test("drop keys", /ok/i);
        _test("drop bottle", /ok/i);
        _test("score", /showing up:\s*2/i, /treasures:\s*46$/i, /getting well in:\s*25$/i, /score:\s*73$/i);
        _test("say waiting", /waiting/i);
      },
      function () {
        _test("plugh", /pitch dark/i);
        _test("on", /lamp is now on/i, /y2/i, /little dwarf/i, /knife is thrown/i);
        _test("throw axe", /killed a little dwarf/i, /y2/i);
        _test("take axe", /ok/i);
        _test("east", /jumble of rock/i);
        _test("up", /little dwarf/i, /hall of mists/i, /rough stone steps/i);
        _test("throw axe", /killed a little dwarf/i, /hall of mists/i);
        _test("take axe", /ok/i);
        _test("west", /east bank of fissure/i);
        _test("west", /west side of the fissure/i);
        _test("west", /west end of hall of mists/i);
        _test("s", /maze of twisty little passages, all alike/i);
        _test("e", /maze of twisty little passages, all alike/i);
        _test("s", /maze of twisty little passages, all alike/i);
        _test("s", /maze of twisty little passages, all alike/i);
        _test("s", /maze of twisty little passages, all alike/i);
        _test("n", /maze of twisty little passages, all alike/i);
        _test("e", /brink of a thirty foot pit/i);
        _test("n", /maze of twisty little passages, all alike/i);
        _test("e", /maze of twisty little passages, all alike/i);
        _test("nw", /dead end/i, /jewelry/i, /pirate's treasure chest/i, /golden eggs/i, /trident/i, /rug/i);
        _test("take jewelry", /ok/i);
        _test("take chest", /ok/i);
        _test("take eggs", /ok/i);
        _test("take trident", /ok/i);
        _test("take rug", /ok/i);
        _test("se", /maze of twisty little passages, all alike/i);
        _test("n", /brink of pit/i);
        _test("down", /bird chamber/i);
        _test("e", /sloping east\/west canyon/i);
        _test("e", /debris room/i);
        _test("off", /lamp is now off/i);
        _test("xyzzy", /inside building/i);
        _test("drop jewelry", /ok/i);
        _test("drop chest", /ok/i);
        // _test("drop eggs", /ok/i);
        _test("drop trident", /ok/i);
        _test("drop rug", /ok/i);
        _test("score", /showing up:\s*2/i, /treasures:\s*98$/i, /getting well in:\s*25$/i, /score:\s*125$/i);
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
      var txt = out.join("\n").trim();
      assert.fail(0, 0, `Didn't find a line like ${re} in output:\n> ${str}\n-----\n${txt}\n-----`);
    });
  }
});
