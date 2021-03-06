/*global angular, io*/

angular.module('app').factory('project', function (
  $rootScope
) {
  'use strict';
    
  
    
  function LinkList(options) {
    options = options || {};
    this._items = [];
    this._filtered = [];
    this._filter = null;
    this._map = {};
    this.page = 1;
    this.pageSize = options.pageSize || 50;
    
    this.view = [];
  }
    
  LinkList.prototype.updateView = function () {
    this._applyFilter();
    
    // apply constraints
    this.page = Math.max(this.page, 1);
    this.page = Math.min(this.page, this.pageCount());
    
    var startIndex = (this.page - 1) * this.pageSize,
        endIndex = startIndex + this.pageSize,
        newView = this._filtered.slice(startIndex, endIndex),
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
    
  LinkList.prototype.pageCount = function () {
    return Math.ceil(this._filtered.length / this.pageSize);
  };
    
  LinkList.prototype.setPage = function (page) {
    this.page = page;
    this.updateView();
  };
    
  LinkList.prototype._applyFilter = function () {
    if (!this._filter) {
      this._filtered = this._items;
    } else {
      this._filtered = this._items.filter(function (item) {
        return this._filter(item);
      }.bind(this));
    }
  };
    
    
    
    
  function Project() {
    this.url = null;
    this.list = new LinkList();
    this._socket = io.connect('/spider');
    this.status = 'idle';
    this.linksReceived = 0;
    
    this._socket.on('data', function (data) {
      this.linksReceived += data.length;
      this.list.addAll(data);
      // we might want to throttle this:
      $rootScope.$apply();
    }.bind(this));
    
    this._socket.on('end', function () {
      this.status = 'idle';
      $rootScope.$apply();
    }.bind(this));
  }
    
  Project.prototype.crawl = function (uri) {
    if (this.status === 'idle') {
      this.linksReceived = 0;
      this.status = 'crawling';
      this.uri = uri;
      this.list = new LinkList();
      this._socket.emit('get', { url: uri });
    }
  };
    
  Project.prototype.cancel = function () {
    this._socket.emit('cancel');
  };
    
    
    
  return new Project();
  
});