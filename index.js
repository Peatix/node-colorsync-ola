"use strict";
var ws = require('ws');
var wss;
global.nervousTimer = require('./nervous-timer');
global.XorShift = require('./xorshift');
global.Peatix = {};

// Monkey patch to ignore LocalStorage related codes.
global.ColorSyncClientAndroid = {
  connect: function(to){
    wss = new ws(to);
    wss.on('message', function (msg) {
      csc.__onMessage({data: msg});
    });
    wss.on('close', function() {

    });
    wss.on('open', function () {
      setTimeout( function () {
        csc.startClockSync();
      },1000);
    });
  },
  send: function(msg){
    wss.send(msg);
  },
  setValue: function(){},
  getValue: function(){},
  deleteKey: function(){}
};

var CS = require('./colorsync-client.js');
var csc;
var server = process.argv[2];
var token = process.argv[3];
var universe = process.argv[4];
var channels = process.argv.slice(5);


csc = new CS({
  server: server,
  token: token
});


var spawn = require('child_process').spawn;
var dmxlen = Math.max( 8, Math.max.apply(null,channels) + 2 );
function r (){return Math.random();}
global.colorsync = function (col) {
  var dmx = new Array(dmxlen);
  for ( var i=0;i<dmx.length;i++) {
    dmx[i] = 0;
  }
  for ( var chIdx = 0; chIdx < channels.length; chIdx++ ) {
    var ch = channels[chIdx] - 1; // dmx channel number starts with 1
    dmx[ch  ] = col.r;
    dmx[ch+1] = col.g;
    dmx[ch+2] = col.b;
  }
  var args = ['--universe', universe, '--dmx', dmx.join(',')];
  spawn('ola_set_dmx', args);
};
