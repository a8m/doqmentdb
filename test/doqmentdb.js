'use strict';
/*global beforeEach, afterEach*/
var DocumentDB = require('documentdb').DocumentClient;
var DoQmentDB  = require('..');
var _          = require('agile');
var sinon      = require('sinon');
var should     = require('should');
var Promise    = require('bluebird');


// Helpers: Mocks, and DocumentDB behavior
var DB_MOCK   = { _self: '/self', _colls: '/colls' };
var COLL_MOCK = { _self: '/self', _docs:  '/docs'  };
var DOC_MOCK  = { _self: '/self', _id:    '54123'  };
function toArray(args) {
  return { toArray: function(fb) { fb.apply(null, args);} }
}
function applyCallback(o1, o2, cb) { return (cb||o2)() }

// Assertions helpers
function assertCalled(q, done, toCalled, withArgs) {
  q.then(function(res) {
    (toCalled.called).should.eql(true);
    // Test `calledWith` with the given arguments.
    if(withArgs) {
      toCalled.calledWith.apply(toCalled, withArgs).should.eql(true);
    }
    done();
  });
}

describe('DoqmentDB', function() {
  describe('DatabaseManager', function() {

    describe('creating `new` DatabaseManager', function() {
      it('should get a not DocumentDB instance(connection) and throw', function() {
        (function() {
          new DoQmentDB({});
        }).should.throw();
      });

      it('should get DocumentDB instance(connection) and return an instance', function() {
        (new DoQmentDB(new DocumentDB('name', {}), 'dbName'))
          .should.be.an.instanceOf(Object)
      });
    });

    // findOrCreate behavior
    describe('`using` dynamically', function() {
      var connection = new DocumentDB('host', { masterKey: 'key' });
      var dbManager  = new DoQmentDB(connection, '');

      beforeEach(function() {
        sinon.stub(DocumentDB.prototype, 'createDatabase', function(obj, fb) {fb()});
        var stub = sinon.stub(DocumentDB.prototype, 'queryDatabases');
        stub.onCall(0).returns(toArray([null, []]));
        stub.onCall(1).returns(toArray([null, [{}]]));
      });

      describe('working with non-existing(in Azure) database', function() {
        it('should call `createDatabase` with database name', function(done) {
          dbManager.manager.findOrCreate({ id: dbManager.database })
            .then(function(result) {
              DocumentDB.prototype.createDatabase.calledWith({ id: dbManager.database })
                .should.eql(true);
              done();
            });
        });
      });

      describe('working with existing(in Azure) database', function() {
        it('should return the db and not call `createDatabase`', function(done) {
          dbManager.manager.findOrCreate({ id: dbManager.database })
            .then(function(result) {
              DocumentDB.prototype.createDatabase.calledTwice.should.eql(false);
              done();
            });
        });
      });

      afterEach(function() {
        DocumentDB.prototype.createDatabase.restore();
        DocumentDB.prototype.queryDatabases.restore();
      });
    });

    // Public api, .find(), .create(), ...
    describe('Public API', function() {
      var connection = new DocumentDB('host', { masterKey: 'key' });
      var dbManager  = new DoQmentDB(connection, '');
      var queryStub, readStub;

      beforeEach(function() {
        // _getDatabase
        sinon.stub(DocumentDB.prototype,  'queryDatabases')
          .returns(toArray([null, DB_MOCK]));
        // (query|read)Collections
        queryStub = sinon.stub(DocumentDB.prototype, 'queryCollections');
        readStub = sinon.stub(DocumentDB.prototype,  'readCollections');
        queryStub.returns(toArray([null, [COLL_MOCK]]));
        readStub.returns(toArray([null, [1, 2]]));
      });

      describe('.find()', function() {
        it('should get object properties and call `queryCollections`', function(done) {
          assertCalled(dbManager.find({ id: 'name' }), done, queryStub);
        });

        //TODO: calledWith assertion

        it('should get an empty object and call `readCollections`', function(done) {
          assertCalled(dbManager.find({}), done, readStub);
        });

        it('should get an `undefined` params and call `readCollections`', function(done) {
          assertCalled(dbManager.find(undefined), done, readStub);
        });
      });

      describe('.findById()', function() {
        it('should get id as a string and call `queryCollection`', function(done) {
          assertCalled(dbManager.findById('foo'), done, queryStub);
        });
      });

      describe('.findAndCreate()', function() {
        var createStub;
        beforeEach(function() {
          createStub = sinon.stub(DocumentDB.prototype, 'createCollection', applyCallback);
          queryStub.returns(toArray([null, []]));
        });
        it('should call `createCollection` if it\'s not exist', function(done) {
          var users = { id: '31' };
          var args  = [DB_MOCK._self, users];
          assertCalled(dbManager.findOrCreate(users), done, createStub, args);
        });
        afterEach(function() {
          createStub.restore();
        });
      });

      describe('.insert() | .create()', function() {
        var createStub;
        beforeEach(function() {
          createStub = sinon.stub(DocumentDB.prototype, 'createCollection', applyCallback);
        });

        it('should get name and call `createCollection`', function(done) {
          var name = 'foo';
          var args = [DB_MOCK._self,  { id: name }];
          assertCalled(dbManager.create(name), done, createStub, args);
        });

        it('should have aliases', function() {
          dbManager.create.should.eql(dbManager.insert);
        });

        afterEach(function() {
          createStub.restore();
        });
      });

      describe('.remove()', function() {
        var removeStub;
        beforeEach(function() {
          removeStub = sinon.stub(DocumentDB.prototype, 'deleteCollection', applyCallback);
          queryStub.returns(toArray([null, [COLL_MOCK]]));
        });

        it('should get collection id and call `deleteCollection`', function(done) {
          assertCalled(dbManager.remove('id'), done, removeStub, [COLL_MOCK._self]);
        });
      });

      describe('.use()', function() {
        it('should return an object immediately(not async operation)', function() {
          dbManager.use('users').should.be.type('object');
        });

        it('should return instance of collectionManager', function() {
          dbManager.use('users').constructor.name.should.eql('Collection');
        });
      });

      describe('CollectionManager', function() {
        var users = dbManager.use('users');
        var readStub, queryStub;

        beforeEach(function() {
          readStub = sinon.stub(DocumentDB.prototype, 'readDocuments');
          queryStub = sinon.stub(DocumentDB.prototype, 'queryDocuments');
          queryStub.returns(toArray([null, [DOC_MOCK]]));
          readStub.returns(toArray([null, [1, 2]]));
        });

        describe('.getCollection()', function() {
          it('should return the used collection, call `queryCollection`', function(done) {
            users.getCollection()
              .then(function(coll) {
                coll.should.eql(COLL_MOCK);
                DocumentDB.prototype.queryCollections.called.should.eql(true);
                done();
              });
          });
        });

        describe('.find()', function() {
          it('should get empty object and call `readDocuments`', function(done) {
            assertCalled(users.find({}), done, readStub);
          });

          it('should get undefined param and call `readDocuments`', function(done) {
            assertCalled(users.find(undefined), done, readStub);
          });

          it('should get object params and call `queryDocuments`', function(done) {
            assertCalled(users.find({ id: 12 }), done, queryStub);
          });
        });

        afterEach(function() {
          readStub.restore();
          queryStub.restore();
        });
      });

      afterEach(function() {
        queryStub.restore();
        readStub.restore();
        DocumentDB.prototype.queryDatabases.restore();
      });
    });
  });
});