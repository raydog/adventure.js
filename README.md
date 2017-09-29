# adventure.js

[![Build Status](https://travis-ci.org/raydog/adventure.js.svg?branch=master)](https://travis-ci.org/raydog/adventure.js) [![Coverage Status](https://coveralls.io/repos/github/raydog/adventure.js/badge.svg?branch=master)](https://coveralls.io/github/raydog/adventure.js?branch=master) [![NPM Version](https://img.shields.io/npm/v/adventurejs.svg)](https://www.npmjs.com/package/adventurejs)

A javascript port of the 350-point version of the classic Adventure game. I originally wrote this code as part of a Slackbot, where people could play the game by PM-ing the bot. I broke the code out of the original project so it could be reused and, well, here we are.

## Playing the game

Install the game locally like:

```
$ npm install -g adventurejs
$ adventurejs

    Welcome to ADVENTURE!

  Original development by Willie Crowther.
  Major features added by Don Woods.
  Conversion to BDS C  by J. R. Jaeger.
  Unix standardization by Jerry D. Pohl.
  JS porting & tweaks  by Ray Myers.

    Would you like instructions?


>
```

## Using the game through an API

You can also use this project as an API, so that the game iself can be used in all kinds of funky ways.

### Installing
`npm install --save adventurejs`

-or-

`yarn add adventurejs`

### Usage

#### Importing:
```javascript
const adventure = require("adventurejs");
```

#### Starting a new game:
```javascript
const game = adventure.makeState();
game.advance(); // -> ["", "    Welcome to ADVENTURE!", ...]
```

Note: every call to `.advance()` will return an array of lines to show to the user.

#### Advancing the game:
```javascript
game.advance("no"); // <- Takes a line from the user
  // -> ["You are standing at the end of a road before a small brick", ...]
game.isDone(); // <- Returns 'true' when the game is in an irreconcilable game-over state.
```

#### Saving / Loading:

The game state object is JSON-serializable, so saving the game to file could look like:
```javascript
const fs = require('fs');
fs.writeFileSync("./mygame.save", JSON.stringify(s));
```

The `.makeState()` method can accept a JS object to initialize itself, so loading could look like:

```javascript
const raw = fs.readFileSync("./mygame.save", { encoding: 'utf8'});
const data = JSON.parse(raw);
const loadedGame = adventure.makeState(data);
```

## License
MIT
