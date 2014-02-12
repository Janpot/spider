/*global angular*/

angular.module('app').filter('pathEncode', function (
  base64,
  $window
) {
  'use strict';
  
  return function (value) {
    return $window.encodeURIComponent(base64.encode(value));
  };
});