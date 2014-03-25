'use strict';

var config = require('config'),
    app = require('./server'),
    socketServer = require('./socketServer');


var server = require('http').createServer(app);
socketServer.init(server);
server.listen(config.port, function () {
  console.log('listening on http://%s:%s', 'localhost', server.address().port);
});
