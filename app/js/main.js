/*global angular*/

require('angular');
require('angular-route');
require('angular-animate');
require('angular-bootstrap');

angular.module('app', [
  'ngRoute',
  'ngAnimate',
  'ui.bootstrap'
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
