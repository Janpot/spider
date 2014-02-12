'use strict';

var PassThrough = require('stream').PassThrough,
    util     = require('util');

function BufferStream() {
  PassThrough.call(this, {
    objectMode: true
  });
}
util.inherits(BufferStream, PassThrough);

BufferStream.prototype._put = function (link) {
  if (link === null) {
    this.end();
  } else {
    this.write(link);
  }
};

module.exports = BufferStream;
