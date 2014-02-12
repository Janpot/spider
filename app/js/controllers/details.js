/*global angular*/

angular.module('app').controller('details', function (
  $scope,
  link,
  state
) {
  'use strict';
    
  $scope.row = link;
    
  $scope.hasLink = function (uri) {
    return state.result.exists(uri);
  };
  
});
