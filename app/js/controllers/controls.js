/*global angular*/

angular.module('app').controller('controls', function (
  $scope,
  project,
  $location
) {
  'use strict';
    
  $scope.uri = 'http://www.checkmybrokenlinks.com/';
    
  $scope.project = project;
  
  $scope.crawl = function (uri) {
    $location.path('/').search('page', null);
    project.crawl(uri);
  };
    
  $scope.cancel = project.cancel.bind(project);
  
});
