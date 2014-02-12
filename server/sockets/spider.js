'use strict';

var spider = require('../spider'),
    ThrottleStream = require('../streams').ThrottleStream;



function connect(socket) {
  var spiderStream = null;
  
  socket
    .on('get', function (options) {
      options = options || {};
      var url = options.url;
      console.log(options);

      spiderStream = spider.get(url);
      
      spiderStream
        .pipe(new ThrottleStream(500))
        .on('data', function (data) {
          socket.emit('data', data);
        })
        .on('end', function () {
          console.log('stream ended');
          socket.emit('end');
        })
        .on('error', function (error) {
          console.log('stream error');
          socket.emit('end');
        });

    })
    .on('cancel', function () {
      if (spiderStream) {
        console.log('canceling');
        spiderStream.cancel();
      }
    })
    .on('disconnect', function () {
      if (spiderStream) {
        spiderStream.cancel();
      }
    });
  
}


exports.connect = connect;
