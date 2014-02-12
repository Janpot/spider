/*global angular*/

angular.module('app').config(function (
  $routeProvider
) {
  'use strict';
  
  $routeProvider.when('/', {
    templateUrl: 'partials/home.html',
    controller: 'home'
  });
  
  $routeProvider.when('/:uri', {
    templateUrl: 'partials/details.html',
    controller: 'details',
    resolve: {
      uri: function ($route, state, $location, base64) {
        var encodedUri = $route.current.params.uri;
        return base64.decode(decodeURIComponent(encodedUri));
      }
    }
  });
  
  //$routeProvider.otherwise({redirectTo: '/'});
  
});