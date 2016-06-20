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

  describe("basic command handling", function () {
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

    it("can say stuff", function () {
      _test("say Hello World!", /Hello World!/);
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

    it("has flavor text for odd stuff", function () {
      _test("calm keys", /no keys here/i);
      _test("building", /inside a building/i);
      _test("calm keys", /care to explain how/i);
      _test("walk food", /where/i);
      _test("quit food", /don't understand/i);
      _test("score bottle", /don't understand/i);
      _test("foo keys", /don't know how/i);
      _test("brief lamp", /on what/i);
      _test("suspend food", /don't understand/i);
      _test("hours lamp", /don't understand/i);
      _test("log lamp", /don't understand/i);
      _test("log", /intransitive verb not implemented/i);
    });

    it("can calculate scores at start", function () {
      _test("score", /showing up: 2/i, /score: 2/i);
    });
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
