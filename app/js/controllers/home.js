/*global angular*/

angular.module('app').controller('home', function (
  $scope,
  project
) {
  'use strict';
    
  $scope.uri = 'http://www.checkmybrokenlinks.com/';
    
  $scope.project = project;
  $scope.pageCount = project.list.pageCount();
    
  $scope.getPages = function () {
    $scope.pageCount = project.list.pageCount();
    var pages = [];
    for (var page = 1; page <= $scope.pageCount; page++) {
      pages.push(page);
    }
    return pages;
  };
    
  $scope.goToPage = function (page) {
    project.list.setPage(page);
  };
  
});
