(function () {
"use strict";

  function rgb2hsb(rgb) {
        var hsb = { h: 0,       s: 0,   b: 0 };
        var min = Math.min(rgb.r, rgb.g, rgb.b);
        var max = Math.max(rgb.r, rgb.g, rgb.b);
        var delta = max - min;
        hsb.b = max;
        hsb.s = max != 0 ? 255 * delta / max : 0;
        if (hsb.s != 0) {
                if (rgb.r == max) {
                        hsb.h = (rgb.g - rgb.b) / delta;
                } else if (rgb.g == max) {
                        hsb.h = 2 + (rgb.b - rgb.r) / delta;
                } else {
                        hsb.h = 4 + (rgb.r - rgb.g) / delta;
                }
        } else {
                hsb.h = -1;
        }
        hsb.h *= 60;
        if (hsb.h < 0) {
                hsb.h += 360;
        }
        hsb.s *= 100 / 255;
        hsb.b *= 100 / 255;
    
        hsb.h = hsb.h | 0;
        hsb.s = hsb.s | 0;
        hsb.b = hsb.b | 0;
    
        return hsb;
    }


var numberToColor = function (n) {
  /* We want to get random color but to avoid too strong colors, so...
     color will be choosen from inside of ball just fit in the RGB cube,
     and will weighten to close to the sphere of that ball to keep it colorful.
     step1) get 3 factors (a,b,c) for radius, theta and phi from given random number
     step2) make randomized radius, theta and phi
     step3) calculate x,y,z of the point specified by radius, theta and phi
            then it's RGB ;)
  */
  var a     = (n & 0x000000FF)
    , b     = ((n & 0x0000FF00) >> 8)
    , c     = ((n & 0x00FF0000) >> 16)
    , r     = ( 1 - Math.pow(a / 256, 2)) * 128 // a bit trick to gain intensity
    , theta = Math.acos( Math.sqrt( b/255 ) ) * 2
    , phi   = (c / 256) * Math.PI * 2
    , red   = Math.floor(128 + r * Math.sin(theta) * Math.cos(phi))
    , green = Math.floor(128 + r * Math.sin(theta) * Math.sin(phi))
    , blue  = Math.floor(128 + r * Math.cos(theta))
  ;
  var hsb = rgb2hsb({r:red,g:green,b:blue});
  return {
    r: red, g: green, b: blue, hsb: hsb
  }
};

var storage = ( 'undefined' !== typeof ColorSyncClientAndroid )
  ? ColorSyncClientAndroid
  : Peatix.Pref
;

var locationManager;

var ColorSyncClient = function (opts) {
  this._retryTimeout = 1000;
  return this.init(opts);
};

ColorSyncClient.prototype = {
  _set_options: function (opts) {
    var defaultCallbacks = {
      onwelcome: function () {}
      , oninitstep: function(step) {}
      , onjoin: function () {}
      , onleave: function () {}
      , onclose: function () {}
      , onsynchronize: function () {}
    };
    for ( var ev in defaultCallbacks ) {
      this[ev] = opts[ev] || defaultCallbacks[ev];
    }
    this.server       = opts.server;
    this.token        = opts.token;
    this.didSync      = false;
    this.isInProgress = false;
  }
  , init: function (opts) {
    if ( opts ) this._set_options(opts);
    var that = this;
    var lastSessionJSON = storage.getValue( 'lastSession:' + this.server );
    var lastSession = JSON.parse(lastSessionJSON || '{}');
    var url = this.server;
    if ( lastSession.resume ) {
        url += '&resume=' + encodeURIComponent( lastSession.resume ) + '&end=' + encodeURIComponent( lastSession.end );
    }
    else {
        url += '&token=' + encodeURIComponent(this.token);
    }

    if ( typeof ColorSyncClientAndroid !== 'undefined' ) {
      ColorSyncClientAndroid.connect(url);
      this.ws = ColorSyncClientAndroid;
    }
    else if ( typeof WebSocket !== 'undefined' ) {
      this.ws = new WebSocket(url);
      this.ws.onopen    = function () { that.__onOpen.apply(that, arguments); };
      this.ws.onclose   = function () { that.__onClose.apply(that, arguments); };
      this.ws.onmessage = function () { that.__onMessage.apply(that, arguments); };
      this.ws.onerror   = function () { that.__onError.apply(that, arguments); };
    }
    else {
        throw "No WebSocket module";
    }

    // default values for clock sync times
    this.__clockSyncPings = 8;
  }
  , __onOpen: function () {
    //this.startClockSync();
  }
  , __onError: function (event) {
    // console.log('error', event);
  }
  , __onClose: function (event) {
    nervousTimer.clearAll();
    if ( this.syncTimer ) {
      clearTimeout(this.syncTimer);
      this.syncTimer = undefined;
    }
    this.onclose();
    if ( event.code ) {
      if ( event.code === 4001 ) {
        // ColorSync session is timed out expectedly.
        alert('ColorSync is finished');
        storage.deleteKey( 'lastSession:' + this.server );
      }
      else if ( event.code === 4401 ) {
        // Authentication failed
        alert('Token was wrong. please refresh ths page and try again');
      }
      else if ( event.code === 4410 ) {
        // Ticket is already used.
        alert('This ticket is already checked in.');
      }
      else if ( event.code === 4411 ) {
        // Ticket is already used.
        alert('This ticket is already checked in.');
        storage.deleteKey( 'lastSession:' + this.server );
      }
      else if ( event.code === 4402 ) {
        // Ticket is already used.
        alert('This ticket is already used by other client.');
      }
      else if ( event.code === 4503 ) {
        alert('Reception is closed now.');
      }
      else {
        // Unexpected close. Retry.
        // console.log( 'failed to start colorsync: ', event.code, event.reason );
        var that = this;
        setTimeout( function () {
          // console.log('retrying');
          that.init();
        }, this._retryTimeout );
        this._retryTimeout *= 2;
      }
    }
  }
  , __onMessage: function (msg) {
    var data = JSON.parse(msg.data);
    var meth = 'on_msg_' + data.type;
    if ( 'undefined' !== typeof this[meth] ) {
      this[meth].call( this, data );
    }
    else {
      throw 'unknown message "' + data.type + '"';
    }
  }
  , checkIn: function (aid) {
    this.ws.send(JSON.stringify({ type: 'checkin', aid: aid }));
  }
  , startClockSync: function(cb) {
    this._clockSyncResults = [];
    var that = this;
    for ( var i = 0; i < this.__clockSyncPings; i++ ) {
      setTimeout( function () {
        that.clockSync();
      }, 100 * i );
    }
  }
  , clockSync: function () {
    var origin = (new Date()).getTime();
    var msg = JSON.stringify({ type: 'clock', origin: origin });
    this.ws.send(msg);
  }
  , on_msg_clock: function (res) {
    var now = (new Date()).getTime();
    var latency = ((now - res.origin ) / 2 );
    var delay = res.time + latency - now;
    this._clockSyncResults.push([latency, delay]);
    this.oninitstep(this._clockSyncResults.length);
    if ( this._clockSyncResults.length >= this.__clockSyncPings ) {
      this._finalizeClockSync();
    }
  }
  , _finalizeClockSync: function () {
    this._clockSyncResults.sort( function (a,b) {
      return a[0] - b[0];
    });

    this.delay = this._clockSyncResults[0][1];
    this.onClockFixed();

    // Re-sync timer for each 3 mins
    var that = this;
    setTimeout( function () {
      that.startClockSync();
    }, 1000 * 60 * 3);
  }
  , onClockFixed: function () {
    var msg = JSON.stringify({ type: 'sync'});
    this.ws.send(msg);
  }
  , on_msg_welcome: function (res) {
    var lastSession = {
        resume: res.resume,
        end: res.end
    };
    storage.setValue( 'lastSession:' + this.server, JSON.stringify(lastSession) );
    this.onwelcome(res);
    this.startClockSync();
  }
  , on_msg_join: function (res) {
    this._retryTimeout = 1000;
    if ( res.checkin_token ) {
        storage.setValue( 'checkInToken:' + this.server, res.checkin_token );
    }
    this.onjoin(res);
  }
  , on_msg_leave: function (res) {
      this.onleave(res);
  }
  , on_msg_sync: function (res) {
    nervousTimer.clearAll();
    var nextSync = res.seeds[1].interval * res.seeds[1].limit * 0.75;
    var that = this;
    this.syncTimer = setTimeout( function () {
      var msg = JSON.stringify({ type: 'sync'});
      that.ws.send(msg);
    }, nextSync);
    var now = ( new Date() ).getTime();
    for ( var s = 0; s < res.seeds.length; s++) {
      var seed = res.seeds[s];
      var xors = new XorShift( seed.seed );
      for ( var i = 0; i < seed.limit; i++ ) {
        (function () {
          var v = xors.next();
          var bg = numberToColor(v);
          var origin = seed.origin;
          var idx = i;
          var interval = seed.interval;
          nervousTimer.setTimeout( function () {
            colorsync(bg);
          },
          function (a,c) {
            //console.log(' oops skipped ', a, c );
          },
          idx * interval, origin - that.delay);
        })();
      }
    }
    if ( res.fadeto ) {
      setTimeout( function () {
        $('.colorsync').stop().animate({ backgroundColor: res.fadeto }, 1000);
      }, 10);
    }
    this.onsynchronize(res);
  }
};

ColorSyncClient.hasSessionFor = function ( uri ) {
  return storage.getValue('lastSession:' + uri) ? true : false;
};

ColorSyncClient.clearSessionFor = function ( uri ) {
  storage.deleteKey( 'lastSession:' + uri );
};

ColorSyncClient.storage = storage;

if( 'undefined' !== typeof ColorSyncClientAndroid &&
    'undefined' !== typeof ColorSyncClientAndroid.getKnownLocation ) {
	ColorSyncClient.locationManager = ColorSyncClientAndroid;
}

if ( typeof module !== 'undefined') {
  module.exports = ColorSyncClient;
}
if ( typeof window !== 'undefined' ) {
  window.ColorSyncClient = ColorSyncClient;
}

})();
