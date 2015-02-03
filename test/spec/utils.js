'use strict';
var spy        = require('sinon').spy;
var should     = require('should');
var _          = require('../helpers');
var DB_MOCK    = _.MOCK.DB;
var COLL_MOCK  = _.MOCK.COLL;
var DOC_MOCK   = _.MOCK.DOC;

describe('utils', function() {
  var _ = require('../../lib/utils');
  describe('.type()', function() {
    it('should return the type of the given db object', function() {
      _.type(DB_MOCK).should.eql('Database');
      _.type(COLL_MOCK).should.eql('Collection');
      _.type(DOC_MOCK).should.eql('Document');
      // typeof
      _.type({}).should.eql('object');
    });
  });

  describe('.isDefined()', function() {
    it('should test if the given value is defined', function() {
      _.isDefined({}).should.eql(true);
      _.isDefined(undefined).should.eql(false);
    });
  });

  describe('.isDocument()', function() {
    it('should test if the given object is Document', function() {
      _.isDocument(DOC_MOCK).should.eql(true);
    });
  });

  describe('forEach', function() {
    var forEach = _.forEach;

    it('should iterate over *own* object properties', function() {
      function MyObj() {
        this.bar = 'barVal';
        this.baz = 'bazVal';
      }
      MyObj.prototype.foo = 'fooVal';

      var obj = new MyObj();
      var log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });

      log.should.eql(['bar:barVal', 'baz:bazVal']);
    });

    it('should not break if obj is an array we override hasOwnProperty', function() {
      /* jshint -W001 */
      var obj = [];
      obj[0] = 1;
      obj[1] = 2;
      obj.hasOwnProperty = null;
      var log = [];
      forEach(obj, function(value, key) {
        log.push(key + ':' + value);
      });
      log.should.eql(['0:1', '1:2']);
    });

    it('should handle arguments objects like arrays', function() {
      var args;
      var log = [];

      (function() { args = arguments; }('a', 'b', 'c'));

      forEach(args, function(value, key) { log.push(key + ':' + value); });
      log.should.eql(['0:a', '1:b', '2:c']);
    });

    it('should handle string values like arrays', function() {
      var log = [];

      forEach('bar', function(value, key) { log.push(key + ':' + value); });
      log.should.eql(['0:b', '1:a', '2:r']);
    });

    it('should handle objects with length property as objects', function() {
      var obj = { 'foo': 'bar', 'length': 2 };
      var log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });
      log.should.eql(['foo:bar', 'length:2']);
    });

    it('should handle objects of custom types with length property as objects', function() {
      function CustomType() {
        this.length = 2;
        this.foo = 'bar';
      }

      var obj = new CustomType();
      var log = [];

      forEach(obj, function(value, key) { log.push(key + ':' + value); });
      log.should.eql(['length:2', 'foo:bar']);
    });


    it('should not invoke the iterator for indexed properties which are not present in the collection', function() {
      var log = [];
      var collection = [];
      collection[5] = 'SPARSE';
      forEach(collection, function(item, index) {
        log.push(item + index);
      });
      log.length.should.eql(1);
      log[0].should.eql('SPARSE5');
    });

    describe('ES spec api compliance', function() {

      function testForEachSpec(expectedSize, collection) {
        var that = {};
        forEach(collection, function(value, key, collectionArg) {
          collectionArg.should.eql(collection);
          collectionArg[key].should.eql(value);

          (this).should.eql(that);
          expectedSize--;
        }, that);
        expectedSize.should.eql(0);
      }

      it('should follow the ES spec when called with array', function() {
        testForEachSpec(2, [1,2]);
      });

      it('should follow the ES spec when called with arguments', function() {
        testForEachSpec(2, (function() { return arguments; }(1,2)));
      });

      it('should follow the ES spec when called with string', function() {
        testForEachSpec(2, '12');
      });

      it('should follow the ES spec when called with JSON', function() {
        testForEachSpec(2, {a: 1, b: 2});
      });

      it('should follow the ES spec when called with function', function() {
        function f() {}
        f.a = 1;
        f.b = 2;
        testForEachSpec(2, f);
      });
    });

    it('should use it\'s own `forEach` if it has one(e.g: agile wrapper)', function() {
      var _agileWrapper = { val: [1,2,3], forEach: function() {} };
      spy(_agileWrapper, 'forEach');
      _.forEach(_agileWrapper, function() {});
      _agileWrapper.forEach.called.should.eql(true);
    });

    describe('.extend()', function() {
      describe('extending objects', function() {
        it('should extends and override properties', function() {
          _.extend({a:2}, {b:3}).should.eql({a:2, b:3});
          _.extend({a:1}, {a:2, b:3}).should.eql({a:2, b:3});
        });

        it('should support multiple objects', function() {
          _.extend({a:1}, {b:2}, {c:3}).should.eql({a:1, b:2, c:3});
          _.extend({a:1}, {b:2}, {c:3}, {d:4}).should.eql({a:1, b:2, c:3, d:4});
        });
      });

      describe('using operations', function() {
        it('Nested Objects', function() {
          _.extend({a:{ b:1, c: 2 }}, { a: { b: 2 } }).should.eql({a:{ b:2, c: 2 }});
          _.extend({a:{ b:1, c: 2 }}, { a: [1,2] }).should.eql({a:[1,2]});
        });
        it('String', function() {
          _.extend({ a: 'foo' }, { a: { $concat: 'bar' } }).should.eql({ a: 'foobar' });
          _.extend({ a: 'foo' }, { a: { $substr: 1 } }).should.eql({ a: 'oo' });
          _.extend({ a: 'foo' }, { a: { $substr: [1,1] } }).should.eql({ a: 'o' });
          _.extend({ a: 'foo' }, { a: { $toUpperCase: undefined } }).should.eql({ a: 'FOO' });
          _.extend({ a: '  foo  ' }, { a: { $trim: null } }).should.eql({ a: 'foo' });
        });

        it('Number', function() {
          _.extend({ a: 1 }, { a: { $toString: undefined } }).should.eql({ a: '1' });
          _.extend({ a: 1 }, { a: { $toFixed: null } }).should.eql({ a: '1' });
        });

        it('Array', function() {
          _.extend({ a: [1] }, { a: { $concat: [2] } }).should.eql({ a: [1,2] });
          _.extend({ a: [1,2] }, { a: { $reverse: null } }).should.eql({ a: [2,1] });
          _.extend({ a: [3,1,4] }, { a: { $sort: undefined } }).should.eql({ a: [1,3,4] });
          _.extend({ a: [1,2] }, { a: { $push: 3 } }).should.eql({ a: [1,2,3] });
          _.extend({ a: [1,2] }, { a: { $shift: undefined } }).should.eql({ a: [2] });
          _.extend({ a: [1,2] }, { a: { $pop: undefined } }).should.eql({ a: [1] });

          function addOne(e) { return e + 1; }
          _.extend({ a: [1,2,3] }, { a: { $map: addOne } }).should.eql({ a: [2,3,4] });
          function isEven(e) { return !(e%2); }
          _.extend({ a: [1,2,3] }, { a: { $filter: isEven } }).should.eql({ a: [2] });
          // not change the type of array
          _.extend({ a: ['a', 'b'] }, { a: { $join: '/' } }).should.eql({ a: ['a', 'b'] });
        });

        it('Putting things together', function() {
          _.extend({ arr: [1,2], str: 'foo' },
            { str: { $concat: 'bar' } }, { arr: { $push: 3 }, done: true })
            .should.eql({ arr: [1,2,3], str: 'foobar', done: true });
        });
      });
    });
  });
});