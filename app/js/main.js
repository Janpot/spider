/*global angular*/

require('angular/angular.js');
require('angular-route/angular-route.js');
require('angular-animate/angular-animate.js');

angular.module('app', [
  'ngRoute',
  'ngAnimate'
]);

require('./routes');

require('./services/spider');
require('./services/state');
require('./filters/fileSize');
require('./filters/encodeURIComponent');
require('./controllers/home');
require('./controllers/details');