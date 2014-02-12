/*global describe, it, beforeEach*/

'use strict';

var nock = require('nock'),
    //assert = require('chai').assert,
    path = require('path'),
    util = require('util'),
    spider = require('../../server/spider');

function getFixture(fixture) {
  return path.resolve(__dirname, 'fixtures', fixture);
}


function containsStructure(got, expected) {
  return Object.keys(expected).every(function (key) {
    var expectedValue = expected[key],
        value = got[key];
    
    if (typeof expectedValue === 'object') {
      return containsStructure(value, expectedValue);
    } else {
      return expectedValue === value;
    }
  });
}


function expectLinks(linkStream, expects, done) {
  expects = JSON.parse(JSON.stringify(expects));
  linkStream
    .on('data', function (data) {
      var candidates = expects.filter(function (expected) {
        return containsStructure(data, expected);
      });
      
      if (candidates.length > 0) {
        expects = expects.filter(function (expected) {
          return expected !== candidates[0];
        });
      } else {
        linkStream.removeAllListeners();
        done(new Error(
          util.format('Unexpected: %j', data)
        ));
      }
      
    })
    .on('end', function () {
      linkStream.removeAllListeners();
      if (expects.length > 0) {
        done(new Error(
          util.format('Didn\'t receive %j', expects[0])
        ));
      } else {
        done();
      }
    });
}


describe.only('spider', function () {
  
  nock.disableNetConnect();
  
  beforeEach(nock.cleanAll.bind(nock));

  it('should add a trailing slash if not present', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('no-links.html'));
    
    expectLinks(spider.get('http://www.example.com'), [
      { uri: 'http://www.example.com/' }
    ], done);
  });

  it('should only stream base url with no-links.html', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('no-links.html'), {
        'Content-Type': 'text/html'
      });
    
    expectLinks(spider.get('http://www.example.com/'), [
      {
        uri: 'http://www.example.com/',
        statusCode: 200,
        type: 'text/html',
        checksum: 'adb387105436a9e6d4c9777821c2024ae7a88521'
      }
    ], done);
  });

  it('should find links on a page', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('several-links.html'), {
        'Content-Type': 'text/html'
      })
      .get('/some-css.css').reply(200, 'css')
      .get('/some-link').reply(200, 'link')
      .get('/some-image.png').reply(200, 'image');
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      {
        uri: 'http://www.example.com/some-css.css',
        referrers: [
          {
            uri: 'http://www.example.com/',
            count: 1
          }
        ]
      },
      {
        uri: 'http://www.example.com/some-link',
        referrers: [
          {
            uri: 'http://www.example.com/',
            count: 1
          }
        ]
      },
      {
        uri: 'http://www.example.com/some-image.png',
        referrers: [
          {
            uri: 'http://www.example.com/',
            count: 1
          }
        ]
      }
    ], done);
  });

  it('shouldn\'t crawl a link twice', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('duplicate-links.html'), {
        'Content-Type': 'text/html'
      })
      .get('/some-link').reply(200, 'link');
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      {
        uri: 'http://www.example.com/some-link',
        referrers: [
          {
            count: 3
          }
        ]
      }
    ], done);
  });

  it('should report an error on an invalid protocol', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('invalid-link.html'), {
        'Content-Type': 'text/html'
      });
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      {
        uri : 'invalid-protocol://www.example.com',
        error: 'Invalid protocol'
      }
    ], done);
  });

  it('should address redirects', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('single-link.html'), {
        'Content-Type': 'text/html'
      })
      .get('/some-link')
      .reply(301, undefined, {
        Location: 'http://www.example.com/some-link-2'
      })
      .get('/some-link-2')
      .reply(302, undefined, {
        Location: 'http://www.example.com/some-link-3'
      })
      .get('/some-link-3')
      .reply(200, 'link');
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      {
        uri: 'http://www.example.com/some-link',
        statusCode: 301
      }, {
        uri: 'http://www.example.com/some-link-2',
        statusCode: 302,
        redirectFrom: 'http://www.example.com/some-link'
      }, {
        uri: 'http://www.example.com/some-link-3',
        statusCode: 200,
        redirectFrom: 'http://www.example.com/some-link-2'
      }
    ], done);
  });

  it('should crawl subpages', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('links-to-page-1.html'), {
        'Content-Type': 'text/html'
      })
      .get('/page-1')
      .replyWithFile(200, getFixture('links-to-page-2.html'), {
        'Content-Type': 'text/html'
      })
      .get('/page-2')
      .reply(200, 'link');
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      { uri: 'http://www.example.com/page-1' },
      { uri: 'http://www.example.com/page-2' }
    ], done);
  });

  it('shouldn\'t crawl a subpage on another domain', function (done) {
    nock('http://www.example.com')
      .get('/')
      .replyWithFile(200, getFixture('links-to-page-1.html'), {
        'Content-Type': 'text/html'
      })
      .get('/page-1')
      .replyWithFile(200, getFixture('links-to-example-org.html'), {
        'Content-Type': 'text/html'
      });
    
    nock('http://www.example.org')
      .get('/')
      .replyWithFile(200, getFixture('links-to-page-1.html'), {
        'Content-Type': 'text/html'
      });
    
    expectLinks(spider.get('http://www.example.com/'), [
      { uri: 'http://www.example.com/' },
      { uri: 'http://www.example.com/page-1' },
      {
        uri: 'http://www.example.org/',
        type: 'text/html'
      }
    ], done);
  });
  
});