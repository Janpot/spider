var config = require('config'),
    app = require('./server'),
    socketServer = require('./socketServer');


var server = require('http').createServer(app);
socketServer.init(server);
server.listen(config.port);
