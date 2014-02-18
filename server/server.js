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
  
  var buildFolder = path.resolve(__dirname, '../.build'),
      appFolder = path.resolve(__dirname, '../app');
  
  // serve built files first
  app.use(express.static(buildFolder));

  // fall back to original
  app.use(express.static(appFolder));
  
});

module.exports = app;
