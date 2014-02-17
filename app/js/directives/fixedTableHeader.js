/*global angular*/

angular.module('app')
  .directive('fixedTableHeader', function ($window) {
    'use strict';
    return {
      link: function link(scope, element) {
        
        var headerCols = element.find('thead').find('th'),
            tbody = element.find('tbody');
        
        function getColumnWidths() {
          var firstRow = tbody.find('tr')[0],
              widths   = null;
          if (firstRow) {
            var cols = angular.element(firstRow).find('td');
            
            widths = [];
            angular.forEach(cols, function (col) {
              widths.push(col.offsetWidth);
            });
          }
          return widths;
        }
        
        function setHeaderWidths(widths) {
          element.toggleClass('flying', !!widths);
          if (widths) {
            angular.forEach(headerCols, function (headerCol, i) {
              angular.element(headerCol).css({width: widths[i] + 'px'});
            });
          } else {
            headerCols.css({width: ''});
          }
        }
        
        scope.$watch(getColumnWidths, setHeaderWidths, true);
        angular.element($window).on('resize', function () {
          setHeaderWidths(getColumnWidths());
        });
      }
    };
  });