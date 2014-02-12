/*global angular*/

angular.module('app').controller('home', function (
  $scope,
  spider,
  state,
  $location
) {
  'use strict';
    
  $scope.url = 'http://edition.cnn.com';
  
  if (state.result) {
    $scope.result = state.result.view;
  }
  
  $scope.crawl = function (url) {
    state.result = spider.crawl(url);
    $scope.result = state.result.view;
  };
    
  $scope.selectRow = function (row) {
    $location.path('/details').search({uri: row.uri});
  };
    
  
});
