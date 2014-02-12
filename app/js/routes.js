/*global angular*/

angular.module('app').config(function (
  $routeProvider
) {
  'use strict';
  
  $routeProvider.when('/', {
    templateUrl: 'partials/home.html',
    controller: 'home'
  });
  
  $routeProvider.when('/details', {
    templateUrl: 'partials/details.html',
    controller: 'details',
    resolve: {
      link: function (state, $location) {
        var uri = $location.search().uri,
            link = null;
        
        console.log(uri);
        
        if (state.result) {
          link = state.result.get(uri);
        }
        
        if (link) {
          return link;
        } else {
          $location.path('/').search({uri: null}).replace();
        }
      }
    }
  });
  
  $routeProvider.otherwise({redirectTo: '/'});
  
});