'use strict';

exports.init = function (app) {
  var io = require('socket.io').listen(app);
  
  io.set('log level', 1);
  
  var spider = require('./sockets/spider');
  io
    .of('/spider')
    .on('connection', spider.connect);
  
};
