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
