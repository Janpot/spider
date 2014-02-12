/*global describe, it*/

'use strict';

var assert = require('chai').assert,
    ThrottleStream = require('../../server/streams/ThrottleStream');


describe('streams', function () {
  
  describe('ThrottleStream', function () {
  
    it('should throttle input', function (done) {
      
      var INTERVAL = 100;

      var stream = new ThrottleStream(INTERVAL);
      
      var input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          expected = JSON.parse(JSON.stringify(input));
      
      var scheduleWrite = function () {
        setTimeout(function () {
          if (input.length > 0) {
            stream.write(input.shift());
            scheduleWrite();
          } else {
            stream.end();
          }
        }, 30);
      };
      
      scheduleWrite();
      
      var lastCall = 0;
      
      stream
        .on('data', function (data) {
          assert.operator(data.length, '>', 0);
          while (data.length > 0) {
            assert.operator(expected.length, '>', 0);
            assert.strictEqual(data.shift(), expected.shift());
          }
          
          var now = Date.now();
          assert.operator(now - lastCall, '>=', INTERVAL);
          lastCall = now;
        })
        .on('end', function () {
          assert.lengthOf(expected, 0);
          done();
        });
      
    });
  
    it('should throttle input on synchronous writes', function (done) {
      
      var INTERVAL = 10;
      
      var stream = new ThrottleStream(INTERVAL);
      
      var input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          expected = JSON.parse(JSON.stringify(input));
      
      while (input.length > 0) {
        stream.write(input.shift());
      }
      stream.end();
      
      var lastCall = 0;
      
      stream
        .on('data', function (data) {
          assert.operator(data.length, '>', 0);
          while (data.length > 0) {
            assert.operator(expected.length, '>', 0);
            assert.strictEqual(data.shift(), expected.shift());
          }
          
          var now = Date.now();
          assert.operator(now - lastCall, '>=', INTERVAL);
          lastCall = now;
        })
        .on('end', function () {
          assert.lengthOf(expected, 0);
          done();
        });
      
    });
    
  });
  
});