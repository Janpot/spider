'use strict';

var Readable = require('stream').Readable,
    util     = require('util');

function BufferStream() {
  Readable.call(this, {
    objectMode: true
  });
  this._links = [];
  this._ended = false;
  this._accepts = false;
}
util.inherits(BufferStream, Readable);

BufferStream.prototype._read = function () {
  this._accepts = true;
  this._streamData();
};

BufferStream.prototype._streamData = function () {
  while (this._accepts && this._links.length > 0) {
    this._accepts = this.push(this._links.shift());
  }
};

BufferStream.prototype._put = function (link) {
  if (this._ended) {
    throw new Error('Stream already ended');
  } else if (link === null) {
    this._ended = true;
  }
  
  this._links.push(link);
  this._streamData();
};

module.exports = BufferStream;
