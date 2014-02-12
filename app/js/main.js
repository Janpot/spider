/*global angular*/

require('angular/angular.js');
require('angular-route/angular-route.js');
require('angular-animate/angular-animate.js');

angular.module('app', [
  'ngRoute',
  'ngAnimate'
]);

require('./routes');

require('./services/base64');
require('./services/project');
require('./services/state');
require('./filters/pathEncode');
require('./filters/fileSize');
require('./filters/encodeURIComponent');
require('./controllers/controls');
require('./controllers/home');
require('./controllers/details');
