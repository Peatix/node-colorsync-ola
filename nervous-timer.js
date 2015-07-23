( function () {


/*

  nervousTimer.js

  nervousTimer.js provides alternative setInterval() / setTimeout() implementation that runs based on real world's time.

  Web browser's native setInterval funciton is running based on task queue, and if browser's timer thread was asleep, program can't know how much difference between process time and the time in real world. For example, mobile safari's timer thread could sleep when opening other tabs, or when phone's sleep button was clicked.

  NervousTimer provides a timer that works based on time of real world. For example, you want to do some task for each minute in realtime on smartphone, and if user makes his device asleep for 42 minutes, then nervousTimer will invoke `skipped` callback to let you know there are 41 skipped periods, and fire just one `ontime` callback on just 42 minutes after the timer starts.

*/

"use strict";

var nervousTimer = {}
  , loopInterval = 10
  , onTimeRange = 40
  , timers = {}
  , lastId = 1
  ;

var mainLoop = function () {
  var now = ( new Date() ).getTime()
    , doneTimers = []
    , timerId, timer, cont, i, doneLen
    ;
  for ( timerId in timers ) {
    timer = timers[timerId];
    if ( timer.next <= now ) {
      cont = timer.execute(now);
      if ( !cont ) {
        doneTimers.push(timerId);
      }
    }
  }
  doneLen = doneTimers.length;
  for ( i=0; i < doneLen; i++ ) {
    delete timers[doneTimers[i]];
  }
};

var registerTimer = function (handler, args) {
  var ontime = Array.prototype.shift.apply(args)
    , skipped, interval, origin;
  if ( 'number' !== typeof args[0] ) {
    skipped = Array.prototype.shift.apply(args);
  }
  interval = args[0];
  origin = args[1];
  var start = ('undefined' !== typeof origin ) ? origin
            :                                    (new Date()).getTime()
            ;

  timers[lastId] = {
    index: 0
    , interval: interval
    , next: start + interval
    , ontime: ontime
    , skipped: skipped
    , execute: handler
  };
  return lastId++;
};

var clearTimer = function (timerId) {
    delete timers[timerId];
};

/*
 * nervousTimer.setInterval(
 *   ontime( index ),
 *   interval,
 *   [skipped( index, num-of-skipped-period )],
 *   [origin]
 * );
 *
 * When interval is 100ms, ontime callback could be fired only if
 * internal timer runs at ( n * 100 ) +/- 10 ms. otherwise, skipped
 * callback to be fired for interval periods that should be fired
 * in the past.
 *
 *                                     * = `ontime` period
 *                                     + = internal loop excutes
 *
 *        0        100       200       300
 * world  |------->*|*<----->*|*<----->*|*<---------
 * thread |-+-+- <==( hard sleep )==> -+-+-+-+-+----
 *                                     ^
 *                                     |
 *   at this moment, `skipped` callback will be invoked with
 *   argument (0, 2), and `ontime` callback will be invoked
 *   after that.
 *
 * initial callback
 *
 * Unlike native setInterval, nervousTimer calls ontime (or skipped)
 * callback at time 0.
 */


var intervalHandler = function (now) {
  var duration = now - this.next;
  var periods = 1 + Math.floor( duration / this.interval );
  var fromLastPeriod = duration % this.interval;
  var isOnTime = false;
  var skippedPeriods = periods;

  if ( fromLastPeriod < onTimeRange ) {
    isOnTime = true;
    skippedPeriods--;
  }
  if ( skippedPeriods > 0 && this.skipped) {
    this.skipped(this.index + 1, skippedPeriods);
  }
  this.index += skippedPeriods;
  if ( isOnTime ) {
    this.index++;
    this.ontime(this.index);
  }
  this.next += periods * this.interval;
  return true;
};

nervousTimer.setInterval = function () {
  return registerTimer( intervalHandler, arguments );
};

/*
 * nervousTimer.clearInterval( timerId )
 */

nervousTimer.clearInterval = function ( timerId ) {
    clearTimer(timerId);
};

/*
 * nervousTimer.setTimeout(
 *   ontime(),
 *   interval,
 *   [skipped()],
 *   [origin]
 * );
 *
 *
 */


var timeoutHandler = function (now) {
  if ( now < this.next + onTimeRange ) {
    this.ontime();
  }
  else {
    if ( this.skipped ) {
      this.skipped();
    }
  }
  return false;
};

nervousTimer.setTimeout = function () {
  return registerTimer( timeoutHandler, arguments );
};

/*
 * nervousTimer.clearTimeout( timerId )
 */

nervousTimer.clearTimeout = function ( timerId ) {
  clearTimer(timerId);
};

nervousTimer.clearAll = function () {
  for ( var tid in timers ) {
    delete timers[tid];
  }
};

/*
 * set interval of internal main loop
 */
nervousTimer.setLoopInterval = function (interval) {
  if ( 'undefined' !== typeof mainTimerId ) {
    clearInterval(mainTimerId);
  }
  loopInterval = interval;
  mainTimerId = setInterval( mainLoop, loopInterval );
};

// Run main loop!
var mainTimerId = setInterval( mainLoop, loopInterval );

if ( typeof module !== 'undefined') {
  module.exports = nervousTimer;
}
if ( typeof window !== 'undefined' ) {
  window.nervousTimer = nervousTimer;
}

})();