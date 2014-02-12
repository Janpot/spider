'use strict';

var Transform = require('stream').Transform,
    util   = require('util');


function ThrottleStream(interval) {
  Transform.call(this, {
    objectMode: true
  });
  this._queue = null;
  this._interval = interval;
  this._lastPushTime = 0;
  this._waitTimeout = null;
}
util.inherits(ThrottleStream, Transform);

ThrottleStream.prototype._transform = function (data, encoding, callback) {
  if (!this._queue) {
    this._queue = [];
  }
  this._queue.push(data);
  this._scheduleFlush();
  callback(null);
};

ThrottleStream.prototype._flush = function (callback) {
  this._scheduleFlush(callback);
};

ThrottleStream.prototype._scheduleFlush = function (callback) {
  var now = Date.now(),
      timeSinceLastPush = now - this._lastPushTime,
      waitTime = Math.max(this._interval - timeSinceLastPush, 0);
  
  if (this._waitTimeout) {
    clearTimeout(this._waitTimeout);
    this._waitTimeout = null;
  }
  
  this._waitTimeout = setTimeout(function () {
    if (this._queue) {
      this.push(this._queue);
      this._queue = null;
    }
    
    if (callback) {
      callback(null);
    }
    
    this._lastPushTime = Date.now();
  }.bind(this), waitTime);
  
};




module.exports = ThrottleStream;
