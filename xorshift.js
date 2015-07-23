(function () {
/*

NAME
  XorShift
DESCRIPTION
  Another implementation of XorShift pseudo random number generator. this implementation is just for convinience to save/share the internal state of generator.

SYNOPSIS
  var xors = new XorShift(); // to be initialized by Math.random()
  xors.next();
  var state = xors.getHex() // returns string like '0123456789abcdef0123456789abcdef'
  var another_xors = new XorShift(state);
  another_xors.next() // can continue the random number sequence.
*/

"use strict";

var XorShift = function (states) {
  return this.init(states);
};

XorShift.prototype = {
  RAND_MAX: Math.pow(2,32)
  , init: function (states) {
    if ( undefined === states ) {
      return this._init_from_math_rand();
    }
    else if ( typeof states === 'string' ) {
      return this._init_with_hex(states);
    }
    else if ( states instanceof Array ) {
      return this._init_with_array(states);
    }
    throw "Invalid initialize option";
  }
  , _init_with_array: function (states) {
    if ( states[0] === 0
      && states[1] === 0
      && states[2] === 0
      && states[3] === 0 ) {
      throw 'Invalid Seed';
    }
    this.x = states[0];
    this.y = states[1];
    this.z = states[2];
    this.w = states[3];
    return this;
  }
  , _init_from_math_rand: function () {
    var x = Math.floor(Math.random() * this.RAND_MAX);
    var y = Math.floor(Math.random() * this.RAND_MAX);
    var z = Math.floor(Math.random() * this.RAND_MAX);
    var w = Math.floor(Math.random() * this.RAND_MAX);
    return this._init_with_array([x,y,z,w]);
  }
  , _init_with_hex: function (seed) {
    var x = parseInt(seed.substr(0,8)  ,16);
    var y = parseInt(seed.substr(8,8)  ,16);
    var z = parseInt(seed.substr(16,8) ,16);
    var w = parseInt(seed.substr(24,8) ,16);
    return this._init_with_array([x,y,z,w]);
  }
  , getHex: function () {
    var vars = ['x','y','z','w']
      , out = '';
    for ( var i=0; i<4;i++) {
       var k = vars[i];
       var s = (this[k] >>> 0).toString(16);
       while ( s.length < 8 ) {
         s = '0' + s;
       }
       out = out + s;
    }
    return out;
  }
  , next: function () {
    var t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    return this.w >>> 0;
  }
};

if ( typeof module !== 'undefined') {
  module.exports = XorShift;
}
if ( typeof window !== 'undefined' ) {
  window.XorShift = XorShift;
}

})();
