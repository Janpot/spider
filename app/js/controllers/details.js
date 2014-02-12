/*global angular*/

angular.module('app').controller('details', function (
  $scope,
  uri,
  state
) {
  'use strict';

  if (state.result) {
    $scope.row = state.result.get(uri);
  }
    
  $scope.hasLink = function (uri) {
    return state.result.exists(uri);
  };
  
});
