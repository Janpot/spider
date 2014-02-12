/*global angular*/

angular.module('app').filter('fileSize', function () {
  'use strict';
  
  var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];
  
  return function (bytes, precision) {
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
      return '-';
    }
    
    if (precision === undefined) {
      precision = 1;
    }
    
    var unit = Math.floor(Math.log(bytes) / Math.log(1024)),
        exp = Math.pow(10, unit),
        number = Math.round(bytes * exp / Math.pow(1024, unit)) / exp;
    return number +  ' ' + units[unit];
  };
});