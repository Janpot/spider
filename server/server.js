'use strict';

var express        = require('express'),
    path           = require('path'),
    config         = require('config');



var app = express();
app.configure(function () {
  
  // bodyparser
  app.use(express.urlencoded());
  app.use(express.json());
  
  // server
  app.use(app.router);
  
  if (config.mountDist) {
    var distFolder = path.resolve(__dirname, '../dist');
    app.set('views', distFolder);
    app.use(express.static(distFolder));
  } else {
    var appFolder = path.resolve(__dirname, '../app'),
        buildFolder = path.resolve(__dirname, '../.build');
    app.set('views', appFolder);
    app.use(express.static(buildFolder));
    app.use(express.static(appFolder));
  }
  
});

module.exports = app;
