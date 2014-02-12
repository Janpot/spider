'use strict';

var Duplex = require('stream').Duplex,
    util   = require('util');


function ThrottleStream(interval) {
  Duplex.call(this, {
    objectMode: true
  });
  this._queue = [];
  this._interval = interval;
  this._accepts = false;
  this._lastPushTime = 0;
  this._waitTimeout = null;
}
util.inherits(ThrottleStream, Duplex);

ThrottleStream.prototype._write = function (data, encoding, callback) {
  this._queue.push(data);
  this._streamData();
  callback(null);
};

ThrottleStream.prototype._read = function () {
  this._accepts = true;
  this._streamData();
};

ThrottleStream.prototype._streamData = function () {
  if (this._waitTimeout) {
    clearTimeout(this._waitTimeout);
    this._waitTimeout = null;
  }
  
  var now = Date.now(),
      timeSinceLastPush = now - this._lastPushTime,
      waitTime = this._interval - timeSinceLastPush;
  
  if (this._accepts && this._queue.length > 0 && waitTime < 0) {
    // push calls _read so clear the _queue first
    var toPush = this._queue;
    this._queue = [];
    this._lastPushTime = now;
    this._accepts = this.push(toPush);
  } else {
    // schedule push
    this._waitTimeout = setTimeout(
      this._streamData.bind(this),
      waitTime
    );
  }
};

module.exports = ThrottleStream;
