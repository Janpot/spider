/*global angular*/

angular.module('app').controller('home', function (
  $scope,
  project
) {
  'use strict';
    
  $scope.uri = 'http://www.checkmybrokenlinks.com/';
    
  $scope.project = project;
  
  $scope.crawl = function (uri) {
    project.crawl(uri);
    $scope.rows = project.list.view;
  };
  
});
