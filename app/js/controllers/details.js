/*global angular*/

angular.module('app').controller('details', function (
  $scope,
  uri,
  project
) {
  'use strict';

  if (project.list) {
    $scope.row = project.list.get(uri);
  }
  
});
