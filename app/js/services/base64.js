/*global angular*/

angular.module('app').factory('base64', function ($window) {
  'use strict';
  
  return {
    encode: $window.btoa.bind($window),
    decode: $window.atob.bind($window)
  };
  
});