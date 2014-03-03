/*global angular*/

angular.module('app').controller('controls', function (
  $scope,
  project,
  $location
) {
  'use strict';

  $scope.uri = 'http://www.checkmybrokenlinks.com/';
  $scope.filteredUri = '';
  $scope.project = project;




  function filter(row) {
    return row.uri.indexOf($scope.filteredUri) >= 0;
  }

  $scope.applyFilter = function () {
    project.list.updateView();
  };



  $scope.crawl = function (uri) {
    $location.path('/').search('page', null);
    project.crawl(uri);
    project.list._filter = filter;
  };

  $scope.cancel = project.cancel.bind(project);

});
