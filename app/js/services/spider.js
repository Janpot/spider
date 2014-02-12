/*global angular, io*/

angular.module('app').factory('spider', function (
  $rootScope
) {
  'use strict';
    
  
    
  function LinkList(options) {
    options = options || {};
    this._items = [];
    this._map = {};
    this._page = 0;
    this.pageSize = options.pageSize || 50;
    
    this.view = [];
  }
    
  LinkList.prototype.updateView = function () {
    var startIndex = this._page * this.pageSize,
        endIndex = startIndex + this.pageSize,
        newView = this._items.slice(startIndex, endIndex),
        spliceParams = [0, this.view.length].concat(newView),
        hasChanged = false;
    
    var oldView = Array.prototype.splice.apply(this.view, spliceParams);
    
    if (oldView.length === newView.length) {
      for (var i = 0; i < oldView.length; i += 1) {
        if (oldView[i] !== newView[i]) {
          hasChanged = true;
          break;
        }
      }
    } else {
      hasChanged = true;
    }
    
    return hasChanged;
  };
    
  LinkList.prototype.add = function (link, options) {
    if (!link) {
      throw new Error('no link provided');
    }
    
    var uri = link.uri;
    
    if (!uri) {
      throw new Error('Link has no uri');
    }
    
    options = options || {};
    
    var existing = this._map[uri];
    
    if (existing) {
      this._mergeLinks(existing, link);
    } else {
      this._items.push(link);
      this._map[uri] = link;
    }
    
    if (options.deferUpdate) {
      return false;
    } else {
      return this.updateView();
    }
  };
    
  LinkList.prototype.addAll = function (links, options) {
    if (!links) {
      throw new Error('no links provided');
    }
    
    options = options || {};
    
    links.forEach(function (link) {
      this.add(link, {
        deferUpdate: true
      });
    }.bind(this));
    
    if (options.deferUpdate) {
      return false;
    } else {
      return this.updateView();
    }
  };
    
  LinkList.prototype._mergeLinks = function (dest, toMerge) {
    dest.referrers     = dest.referrers || [];
    dest.redirectFroms = dest.redirectFroms || [];
    
    if (toMerge.referrers) {
      toMerge.referrers.forEach(function (referrer) {
        dest.referrers.push(referrer);
      });
    }
    
    if (toMerge.redirectFroms) {
      toMerge.redirectFroms.forEach(function (redirectFrom) {
        dest.redirectFroms.push(redirectFrom);
      });
    }
  };
    
  LinkList.prototype.count = function () {
    return this._items.length;
  };
    
  LinkList.prototype.get = function (uri) {
    return this._map[uri];
  };
    
  LinkList.prototype.exists = function (uri) {
    return uri in this._map;
  };
  
  
    
  function crawl(url) {
    var socket = io.connect('/spider'),
        list = new LinkList();
    
    socket.emit('get', { url: url });
    
    socket.on('data', function (data) {
      var needsUpdate = list.addAll(data);
      if (needsUpdate) {
        $rootScope.$apply();
      }
    });
    
    socket.on('end', function () {
      console.log('done!');
    });
    
    return list;
  }
    
  return {
    crawl: crawl
  };
  
});