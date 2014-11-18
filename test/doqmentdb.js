'use strict';
var DocumentDB = require('documentdb').DocumentClient;
var DoQmentDB  = require('..');
var _          = require('agile');
var sinon      = require('sinon');
var should     = require('should');
var Promise    = require('bluebird');

describe('DoqmentDB', function() {
  describe('connection', function() {
    it('should throw an error if on getConnection', function() {
      DoQmentDB.getConnection().constructor.name.should.eql('Error');
    });

    it('should get connection arguments and instantiate DocumentDB client', function() {
      DoQmentDB.createConnection('host', {});
      DoQmentDB.getConnection().constructor.name.should.eql('DocumentClient');
    });
  });

  describe('api', function() {
    var methods    = _.keys(DocumentDB.prototype);
    var BASE_QUERY = 'SELECT * FROM root r WHERE ';
    var toArray = function(args) {
      return { toArray: function(fb) { fb.apply(null, args);} }
    };

    beforeEach(function() {
      methods.forEach(function(method) {
        sinon.stub(DocumentDB.prototype, method,
          function() { return { toArray: new Function } });
      });
    });

    describe('Promise control-flow', function() {
      it('all api functions should return a promise', function() {
        var methods = _.keys(DoQmentDB);
        var args    = [{ _self: '/link' }, { id: 'coll' }];
        methods.forEach(function(method) {
          return _.some(['createConnection', 'getConnection'], method)
            ? true
            : DoQmentDB[method].apply(null, args).should.be.instanceof(Promise);
        });
      });
    });

    describe('.getAllDatabases()', function() {
      it('should call `readDatabases` with the given arguments', function() {
        DoQmentDB.getAllDatabases({});
        DocumentDB.prototype.readDatabases.calledWithExactly({}).should.eql(true);
      });
    });

    describe('.getDatabaseByName()', function() {
      it('should call `queryDatabases`', function() {
        DoQmentDB.getDatabaseByName('test');
        DocumentDB.prototype.queryDatabases.called.should.eql(true);
      });
    });

    describe('.createDatabase()', function() {
      it('should call `createDatabase` with the given arguments', function() {
        DoQmentDB.createDatabase('testDB');
        DocumentDB.prototype.createDatabase.calledWith({id: 'testDB'}).should.eql(true);
      });
    });

    describe('.removeDatabase()', function() {
      it('should call `deleteDatabase` with the given object', function() {
        var args = [{ _self: '/link', _colls: '/link/colls' }, { foo: 'bar' }];
        DoQmentDB.removeDatabase.apply(null, args);
        DocumentDB.prototype.deleteDatabase.calledWith(args[0]._self, args[1]).should.eql(true);
      });
    });

    describe('.findOrCreateDatabase()', function() {
      beforeEach(function() {
        DocumentDB.prototype.queryDatabases.restore();
        DocumentDB.prototype.createDatabase.restore();
        var stub = sinon.stub(DocumentDB.prototype, 'queryDatabases');
        sinon.stub(DocumentDB.prototype, 'createDatabase', function(obj, fb) {fb()});
        stub.onCall(0).returns(toArray([null, []]));
        stub.onCall(1).returns(toArray([null, [{}]]));
      });
      it('should create database if it not exist, else return it', function(done) {
        Promise.props({
          0: DoQmentDB.findOrCreateDatabase('test'),
          1: DoQmentDB.findOrCreateDatabase('test')
        }).done(function(res) {
          DocumentDB.prototype.createDatabase.callCount.should.eql(1);
          res['1'].should.be.type('object');
          done();
        });
      });
    });

    describe('.getAllCollections()', function() {
      it('should called `readCollections` of specific db', function() {
        DoQmentDB.getAllCollections({ _self: 'db-link', _colls: 1 }, {});
        DocumentDB.prototype.readCollections.calledWith('db-link', {}).should.eql(true);
      });
    });

    describe('.getCollectionByName()', function() {
      it('should called `queryCollection`', function() {
        DoQmentDB.getCollectionByName('name', {});
        DocumentDB.prototype.queryCollections.called.should.eql(true);
      });
    });

    describe('.findCollection()', function() {
      it('should build query and call `queryCollection`', function() {
        DoQmentDB.findCollection({_self: 'db-link', _colls:1}, { id: 'name', users: 2 });
        DocumentDB.prototype.queryCollections
          .calledWith('db-link',  BASE_QUERY + 'r.id="name" AND r.users=2')
          .should.eql(true);
      });
      it('should build query and call `queryCollection`', function() {
        DoQmentDB.findCollection({_self: 'db-link', _colls:1}, { id: 'name', users: 2, bar: 'baz' });
        DocumentDB.prototype.queryCollections
          .calledWith('db-link',  BASE_QUERY + 'r.id="name" AND r.users=2 AND r.bar="baz"')
          .should.eql(true);
      });
    });

    describe('.findOrCreateCollection()', function() {
      beforeEach(function() {
        DocumentDB.prototype.queryCollections.restore();
        DocumentDB.prototype.createCollection.restore();
        var stub = sinon.stub(DocumentDB.prototype, 'queryCollections');
        sinon.stub(DocumentDB.prototype, 'createCollection', function(o1, o2, o3, fb) {fb()});
        stub.onCall(0).returns(toArray([null, []]));
        stub.onCall(1).returns(toArray([null, [{}]]));
      });

      it('should create collection if it not exist, else return it', function(done) {
        Promise.props({
          0: DoQmentDB.findOrCreateCollection({_self: '/'}, 'test'),
          1: DoQmentDB.findOrCreateCollection({_self: '/'}, 'test')
        }).done(function(res) {
          DocumentDB.prototype.createCollection.callCount.should.eql(1);
          res['1'].should.be.type('object');
          done();
        });
      });
    });

    afterEach(function() {
      methods.forEach(function(method) {
        DocumentDB.prototype[method].restore();
      });
    });
  });
});