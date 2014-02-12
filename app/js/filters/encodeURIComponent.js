/*global angular*/

angular.module('app').filter('encodeURIComponent', function (
  $window
) {
  'use strict';
  
  return $window.encodeURIComponent;
});