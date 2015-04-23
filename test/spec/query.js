'use strict';
/*global describe, it, beforeEach, afterEach, stub*/
var should = require('should')
  , query  = require('../../lib/query')
  , constant = require('../../lib/query/constant').QUERIES;

describe('QueryBuilder', function() {
  var BQ = 'SELECT * FROM root r WHERE ';
  describe('test .query() behavior', function() {
    it('should work with empry', function() {
      query({}).should.eql('SELECT * FROM root r');
    });

    it('simple equal', function() {
      query({ a: 1, b: 2, c: 3 }).should.eql(BQ + 'r.a=1 AND r.b=2 AND r.c=3');
      query({ a: "1", b: "2", c: "3" }).should.eql(BQ + 'r.a="1" AND r.b="2" AND r.c="3"');
    });

    it('simple equal with $not', function() {
      query({ $not: { a: 1, b: 2, c: 3 } }).should.eql(BQ + 'NOT(r.a=1 AND r.b=2 AND r.c=3)');
      query({ $not: { a: "1", b: "2", c: "3" } }).should.eql(BQ + 'NOT(r.a="1" AND r.b="2" AND r.c="3")');
    });

    it('should work with $not-$or as $nor', function() {
      query({ $not: { $or: [ { a: 1 } ] } }).should.eql(BQ + 'NOT(r.a=1)');
      query({ $not: { $or: [ { a: 1, b: 1 }, { c: 3 } ] } }).should.eql(BQ + 'NOT((r.a=1 AND r.b=1) OR r.c=3)');
      query({ $nor: [ { a: 1, b: 1 }, { c: 3 } ] }).should.eql(BQ + 'NOT((r.a=1 AND r.b=1) OR r.c=3)');
    });

    it('should with $nor', function() {
      query({ $nor: [ { a: 1 }, { b: 3 }]}).should.eql(BQ + 'NOT(r.a=1 OR r.b=3)');
      query({ $nor: [ { a: '1' }, { b: '3' }]}).should.eql(BQ + 'NOT(r.a="1" OR r.b="3")');
      query({ $nor: [ { a: '1' }]}).should.eql(BQ + 'NOT(r.a="1")');
      query({ $nor: [ { a: 1, b: 2 }, { c: 4 }]}).should.eql(BQ + 'NOT((r.a=1 AND r.b=2) OR r.c=4)');
    });

    it('should work with $and and $or operators together', function() {
      query({ $and: [{ a: 2, b: 3}, { c: 3 }] }).should.eql(BQ + '((r.a=2 AND r.b=3) AND r.c=3)');
      query({ $or: [{ a: 2, b: 3}, { c: 3 }] }).should.eql(BQ + '((r.a=2 AND r.b=3) OR r.c=3)');

      query({ $or: [{ a: 2 }, { $and: [{ a: 1 }, { b: 2 }] }] }).should.eql(BQ + '(r.a=2 OR (r.a=1 AND r.b=2))');
      query({ $and: [{ a: 2 }, { $or: [{ a: 1 }, { b: 2 }] }] }).should.eql(BQ + '(r.a=2 AND (r.a=1 OR r.b=2))');

      // recursive
      query({ $and: [
        { a: 1 },
        { $or: [ { a: 2 }, { b: 2 },
          { $and: [ { a: 1 }, { b: 1 } ] }
        ]}
      ]}).should.eql(BQ + '(r.a=1 AND (r.a=2 OR r.b=2 OR (r.a=1 AND r.b=1)))')
    });

    it('should work with symbols($gt, $gte, etc..)', function() {
      query({ $not: { name: { $gt: 3 }, age: 12 } }).should.eql(BQ + 'NOT(r.name > 3 AND r.age=12)');
      query({ $not: { name: { $ne: 'bar' } } }).should.eql(BQ + 'NOT(r.name <> "bar")');
      query({ $or: [
        { $not: { a: 2 } },
        { $not: { b: { $ne: 1 } } }
      ]}).should.eql(BQ + '(NOT(r.a=2) OR NOT(r.b <> 1))');

      query({ $or: [
        { name: { $ne: 'Ariel' } },
        { age: { $lte: 26 } },
        { $and: [
          { isAdmin: { $ne: false } },
          { isUser: { $ne: false } }
        ]}
      ]}).should.eql(BQ + '(r.name <> "Ariel" OR r.age <= 26 OR (r.isAdmin <> false AND r.isUser <> false))');

      query({ $or: [
        { $not: { name: { $ne: 'Ariel' } } },
        { $not: { age: { $lte: 26 } } },
        { $not:
          { $and: [
            { isAdmin: { $ne: false } },
            { isUser: { $ne: false } }
          ]}
        }
      ]}).should.eql(BQ + '(NOT(r.name <> "Ariel") OR NOT(r.age <= 26) OR NOT(r.isAdmin <> false AND r.isUser <> false))');
    });

    it('should handle strings correctly', function() {
      query('r.a=1 AND r.b=2').should.eql(BQ + 'r.a=1 AND r.b=2');
    });

    it('should work with functions', function() {
      query({ coins: { $in: 2 } }).should.eql({
        query: BQ + 'udf.inUDF(r.coins, 2)',
        udf: [ { id: constant.$in.name, body: constant.$in.func } ]
      });
      // that's how you should do the `{ coins: { $nin: 2 } }`
      query({ $not: { coins: { $in: 2 } } }).should.eql({
        query: BQ + 'NOT(udf.inUDF(r.coins, 2))',
        udf: [ { id: constant.$in.name, body: constant.$in.func } ]
      });
      query({ name: { $type: 'string' } }).should.eql({
        query: BQ + 'udf.typeUDF(r.name, "string")',
        udf: [{ id: constant.$type.name, body: constant.$type.func } ]
      });

      query({ $not: { name: { $regex: /d+/g } } }).should.eql({
        query: BQ + 'NOT(udf.regexUDF(r.name, /d+/g))',
        udf: [ { id: constant.$regex.name, body: constant.$regex.func } ]
      });
      query({ $not: { age: { $type: 'number' } } }).should.eql({
        query: BQ + 'NOT(udf.typeUDF(r.age, "number"))',
        udf: [{ id: constant.$type.name, body: constant.$type.func }]
      });
    });

    it('should throw if it\'s invalid operator', function() {
      (function() {
        query({ name: { $foo: 'bar' } });
      }).should.throw();
    });
  });
});

describe('constants', function() {
  describe('test UDF functions', function() {
    it('.$in()', function() {
      constant.$in.func([1,2,3], 2).should.eql(true);
      constant.$in.func(22, 2).should.eql(false);
      constant.$in.func('22', 2).should.eql(false);
    });

    it('.$all()', function() {
      constant.$all.func([2,2], 2).should.eql(true);
      constant.$all.func(22, 2).should.eql(false);
      constant.$all.func('22', 2).should.eql(false);
    });

    it('.$size()', function() {
      constant.$size.func([2,2], 2).should.eql(true);
      constant.$size.func(22, 2).should.eql(false);
      constant.$size.func('22', 2).should.eql(true);
    });

    it('.$all()', function() {
      constant.$regex.func(['a',2], /^\d/).should.eql(false);
      constant.$regex.func('22', /^\d/).should.eql(true);
      constant.$regex.func(22, /^\d/).should.eql(true);
    });

    it('.$type()', function() {
      constant.$type.func(['a',2], 'object').should.eql(true);
      constant.$type.func('22', 'string').should.eql(true);
      constant.$type.func(22, 'number').should.eql(true);
    });
  });
});

describe('constants', function() {
  var filter = require('../../lib/query/filter');
  it('.format()', function() {
    filter.format('{0}{1}', 'foo').should.eql('foo{1}');
    filter.format('{0}{1}', 'foo', 'bar').should.eql('foobar');
    filter.format('{1}{0}', 'foo', 'bar').should.eql('barfoo');
  });

  it('.wrap()', function() {
    filter.wrap('a', 'b').should.eql('bab');
    filter.wrap('a', 'b', 'c').should.eql('bac');
    filter.wrap(1).should.eql(1);
  });
});