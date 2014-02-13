'use strict';

var PassThrough = require('stream').PassThrough,
    util     = require('util');

// TODO: turn in a duplex stream and port over queueing
//       functionality from spider

function QueueStream() {
  PassThrough.call(this, {
    objectMode: true
  });
}
util.inherits(QueueStream, PassThrough);

QueueStream.prototype._put = function (link) {
  if (link === null) {
    this.end();
  } else {
    this.write(link);
  }
};

module.exports = QueueStream;
