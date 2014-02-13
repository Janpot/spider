/*global angular*/

angular.module('app').controller('details', function (
  $scope,
  uri,
  project,
  $location
) {
  'use strict';

  $scope.row = project.list.get(uri);
  
  if (!$scope.row) {
    $location.path('/');
  }
  
});
