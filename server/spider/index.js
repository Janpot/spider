'use strict';

var request = require('request'),
    cheerio = require('cheerio'),
    URL = require('url'),
    util = require('util'),
    Readable = require('stream').Readable,
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



function LinkStream() {
  Readable.call(this, {
    objectMode: true
  });
  this._links = [];
  this._ended = false;
  this._accepts = false;
}
util.inherits(LinkStream, Readable);

LinkStream.prototype._read = function () {
  this._accepts = true;
  this._streamData();
};

LinkStream.prototype._streamData = function () {
  while (this._accepts && this._links.length > 0) {
    this._accepts = this.push(this._links.shift());
  }
};

LinkStream.prototype.addLink = function (link) {
  if (this._ended) {
    throw new Error('Stream already ended');
  } else if (link === null) {
    this._ended = true;
  }
  
  this._links.push(link);
  this._streamData();
};




function Cache() {
  this._store = {};
}

Cache.prototype.add = function (url, promise) {
  this._store[url] = promise;
};

Cache.prototype.get = function (url) {
  return Q.when(this._store[url]);
};


var HARD_DOWNLOAD_LIMIT = 10000000; //100 kB


function Spider(options) {
  options = options || {};
  
  this._cache = new Cache();
  this._stream = new LinkStream();
  this._pending = 0;
  this._totalDownloadSize = 0;
  this.maxDownloadSize = Math.min(
    options.maxDownloadSize || HARD_DOWNLOAD_LIMIT,
    HARD_DOWNLOAD_LIMIT
  );
  this.maxDepth = 2;
}

Spider.prototype._normalizeUrl = function (url) {
  return URL.parse(url).href;
};


Spider.prototype._process = function (url, depth) {
  var deferred = Q.defer();
  
  var end = function (error, info) {
    if (error) {
      return deferred.reject(error);
    }
    var toCache = JSON.parse(JSON.stringify(info));
    toCache.uri = url;
    deferred.resolve(toCache);
  }.bind(this);

  var overMax = this._totalDownloadSize > this.maxDownloadSize;
  
  if (overMax) {
    return end(new Error('Download size exceeded'));
  }
  
  if (depth > this.maxDepth) {
    return end(new Error('Depth exceeded'));
  }
  
  request({
    uri: url,
    followRedirect: false
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
      
      this._get(basic.redirectTo, {
        redirectFrom: url
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
          
          this._get(href, {
            referrers: [ thisReferral ]
          }, depth + 1);
        }.bind(this));
    }

    return end(null, basic);
    
  }.bind(this));
  
  return deferred.promise;
};


Spider.prototype._get = function (url, urlConfig, depth) {
  url = this._normalizeUrl(url);
  urlConfig = urlConfig || {};
  
  this._pending += 1;
  
  var cachePromise = this._cache.get(url)
    .then(function onCacheReturn(info) {
      if (info) {
        return info;
      } else {
        return this._process(url, depth);
      }
    }.bind(this));
  
  this._cache.add(url, cachePromise);
  
  return cachePromise
    .then(function (info) {
      var toStream = JSON.parse(JSON.stringify(info));
      Object.keys(urlConfig)
        .forEach(function (key) {
          toStream[key] = urlConfig[key];
        }.bind(this));
      this._stream.addLink(toStream);
      return toStream;
    }.bind(this))
    .fin(function () {
      this._pending -= 1;
      if (this._pending <= 0) {
        this._stream.addLink(null);
      }
    }.bind(this));
};

Spider.prototype.get = function (url) {
  this._mainHost = URL.parse(url).host;
  this._get(url, null, 0);
  return this._stream;
};

exports.get = function (url, options) {
  return new Spider(options).get(url);
};
