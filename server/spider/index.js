'use strict';

var request = require('request'),
    cheerio = require('cheerio'),
    URL = require('url'),
    util = require('util'),
    PassThrough = require('stream').PassThrough,
    Q = require('q'),
    checksum = require('checksum');







function extractLinks(uri, body) {
  var $ = cheerio.load(body);
    
  var hrefs = $('[href]').map(function (i, a) {
    var href = $(a).attr('href');
    return URL.resolve(uri, href);
  }).toArray();
  
  var srcs = $('[src]').map(function (i, a) {
    var src = $(a).attr('src');
    return URL.resolve(uri, src);
  }).toArray();
  
  return srcs.concat(hrefs);
}


function parseContentType(typeStr) {
  var matcher = /([^\/]+)\/([^;]+)/,
      match = matcher.exec(typeStr);
  
  if (match) {
    return match[0].trim().toLowerCase();
  } else {
    return undefined;
  }
}




function Cache() {
  this._store = {};
}

Cache.prototype.add = function (url, promise) {
  this._store[url] = promise;
};

Cache.prototype.get = function (url) {
  return Q.when(this._store[url]);
};


var HARD_DOWNLOAD_LIMIT = 10000000, //10 MB
    MAX_COUNT           = 1000;




function Spider(options) {
  PassThrough.call(this, {
    objectMode: true
  });
  options = options || {};
  
  this._linkCache = new Cache();
  this._queue = [];
  this._pending = 0;
  this._maxConcurrent = 10;
  this._canceled = false;
  
  this.maxDepth = 2;
  
  this._totalDownloadSize = 0;
  this.maxDownloadSize = Math.min(
    options.maxDownloadSize || HARD_DOWNLOAD_LIMIT,
    HARD_DOWNLOAD_LIMIT
  );
  
  this._totalCount = 0;
  this.maxCount = Math.min(
    options.maxDownloadSize || MAX_COUNT,
    MAX_COUNT
  );
}
util.inherits(Spider, PassThrough);

Spider.prototype._normalizeUrl = function (url) {
  return URL.parse(url).href;
};





Spider.prototype._enqueue = function (url, extraInfo) {
  if (!this._canceled) {
    this._queue.push({
      url: url,
      extraInfo: extraInfo || {}
    });
  }
  this._consumeQueue();
};


Spider.prototype.downloadSizeExceeded = function () {
  return this._totalDownloadSize >= this.maxDownloadSize;
};

Spider.prototype.maxCountExceeded = function () {
  return this._totalCount >= this.maxCount;
};


Spider.prototype.cancel = function () {
  if (!this._canceled) {
    this._canceled = true;
    this._queue = [];
  }
};


Spider.prototype._consumeQueue = function () {
  var forceEnd =
      this.downloadSizeExceeded() ||
      this.maxCountExceeded();
  
  if (forceEnd) {
    this.cancel();
  }
  
  if (this._queue.length <= 0) {
    if (this._pending <= 0) {
      this.end();
    }
  } else if (this._pending < this._maxConcurrent) {
    
    this._totalCount += 1;
    this._pending += 1;
    var nextUp = this._queue.shift();

    this._processUrl(nextUp.url)
      .then(function (result) {
        Object.keys(nextUp.extraInfo)
          .forEach(function (key) {
            result[key] = nextUp.extraInfo[key];
          }.bind(this));
        this.write(result);
      }.bind(this))
      .fin(function () {
        this._pending -= 1;
        this._consumeQueue();
      }.bind(this));
    
  }
};


Spider.prototype._request = function (url) {
  var deferred = Q.defer();
  
  var end = function (error, info) {
    if (error) {
      return deferred.reject(error);
    }
    var toCache = JSON.parse(JSON.stringify(info));
    toCache.uri = url;
    deferred.resolve(toCache);
  }.bind(this);

  var overMax = this._totalDownloadSize >= this.maxDownloadSize;
  
  if (overMax) {
    return end(new Error('Download size exceeded'));
  }
  
  request({
    uri: url,
    followRedirect: false,
    pool: {
      maxSockets: this._maxConcurrent
    }
  }, function (err, res, body) {
    if (err) {
      return end(null, {
        error: err.message
      });
    }
    
    this._totalDownloadSize += body.length;
    
    var basic = {
      statusCode: res.statusCode
    };
    
    if (300 <= res.statusCode && res.statusCode < 400) {
      basic.redirectTo = res.headers.location;
      if (!basic.redirectTo) {
        basic.error = 'redirect with no location';
        return end(null, basic);
      }
      
      this._enqueue(basic.redirectTo, {
        redirectFroms: [ url ]
      });
      return end(null, basic);
    }
    
    basic.type = parseContentType(res.headers['content-type']);
    basic.size = res.headers['content-length'] || body.length;
    basic.checksum = checksum(body);
    
    var host = URL.parse(url).host,
        sameDomain = host === this._mainHost,
        doCrawl = sameDomain && basic.type === 'text/html';

    if (doCrawl) {
      var hrefs = extractLinks(url, body);
      var counts = {};
      hrefs.forEach(function (href) {
        if (counts[href] === undefined) {
          counts[href] = 1;
        } else {
          counts[href] += 1;
        }
      });
      
      Object.keys(counts)
        .forEach(function (href) {
          var thisReferral = {
            uri: url,
            count: counts[href]
          };
          
          this._enqueue(href, {
            referrers: [ thisReferral ]
          });
        }.bind(this));
    }

    return end(null, basic);
    
  }.bind(this));
  
  return deferred.promise;
};


Spider.prototype._processUrl = function (url) {
  url = this._normalizeUrl(url);
  
  var cachePromise = this._linkCache.get(url)
    .then(function onCacheReturn(info) {
      if (info) {
        return info;
      } else {
        return this._request(url);
      }
    }.bind(this));
  
  this._linkCache.add(url, cachePromise);
  
  return cachePromise
    .then(function (info) {
      // return a copy to not mess with cached instance
      return JSON.parse(JSON.stringify(info));
    }.bind(this));
};

Spider.prototype.get = function (url) {
  this._mainHost = URL.parse(url).host;
  this._enqueue(url, {
    depth: 0
  });
  return this;
};

exports.get = function (url, options) {
  return new Spider(options).get(url);
};
