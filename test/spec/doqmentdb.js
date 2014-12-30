'use strict';
/*global describe, it, beforeEach, afterEach, stub*/
var DocumentDB = require('documentdb').DocumentClient;
var DoQmentDB  = require('../../');
var stub       = require('sinon').stub;
var should     = require('should');
var Promise    = require('bluebird');

describe('DoqmentDB', function() {
  // Helpers: Mocks, and DocumentDB behavior
  var _             = require('../helpers');
  var applyCallback = _.applyCallback;
  var toArray       = _.toArray;
  var assertCalled  = _.assertCalled;
  var DB_MOCK       = _.MOCK.DB;
  var COLL_MOCK     = _.MOCK.COLL;
  var DOC_MOCK      = _.MOCK.DOC;
  
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
        stub(DocumentDB.prototype, 'createDatabase', function(obj, fb) {fb()});
        var stub1 = stub(DocumentDB.prototype, 'queryDatabases');
        stub1.onCall(0).returns(toArray([null, []]));
        stub1.onCall(1).returns(toArray([null, [{}]]));
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
        stub(DocumentDB.prototype,  'queryDatabases')
          .returns(toArray([null, DB_MOCK]));
        // (query|read)Collections
        queryStub = stub(DocumentDB.prototype, 'queryCollections');
        readStub = stub(DocumentDB.prototype,  'readCollections');
        queryStub.returns(toArray([null, [COLL_MOCK]]));
        readStub.returns(toArray([null, [1, 2]]));
      });

      describe('.getDatabase()', function() {
        it('should return the used collection, call `queryCollection`', function(done) {
          dbManager.getDatabase()
            .then(function(db) {
              db.should.eql(DB_MOCK);
              DocumentDB.prototype.queryDatabases.called.should.eql(true);
              done();
            });
        });
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
          createStub = stub(DocumentDB.prototype, 'createCollection', applyCallback);
          queryStub.returns(toArray([null, []]));
        });
        it('should call `createCollection` if it\'s not exist', function(done) {
          var users = { id: '31', name: 'foo' };
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
          createStub = stub(DocumentDB.prototype, 'createCollection', applyCallback);
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
          removeStub = stub(DocumentDB.prototype, 'deleteCollection', applyCallback);
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
          readStub = stub(DocumentDB.prototype, 'readDocuments');
          queryStub = stub(DocumentDB.prototype, 'queryDocuments');
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

        describe('.fineOne', function() {
          it('should return the first member in the results', function(done) {
            Promise.props({
              all: users.find({ id: 1 }),
              one: users.findOne({ id: 1 })
            }).then(function(res) {
              res.one.should.eql(res.all[0]);
              done();
            });
          });
        });

        describe('.findById()', function() {
          it('should get id as a string and call `queryDocuments`', function(done) {
            assertCalled(users.findById('foo'), done, queryStub);
          });
        });

        describe('.findOneAndRemove', function() {
          var removeStub;
          beforeEach(function() {
            removeStub = stub(DocumentDB.prototype, 'deleteDocument', applyCallback);
          });

          it('should get the first result and call `deleteDocument`', function(done) {
            assertCalled(users.findOneAndRemove({ id: 2 }), done, removeStub, [DOC_MOCK._self]);
          });

          afterEach(function() {
            removeStub.restore();
          });
        });

        describe('.findOneAndModify', function() {
          var updateStub;
          beforeEach(function() {
            updateStub = stub(DocumentDB.prototype, 'replaceDocument', applyCallback);
          });

          it('should get the first result and call `replaceDocument` extened', function(done) {
            var update = users.findOneAndModify({ id: 2 }, { name: 3 });
            assertCalled(update, done, updateStub, [DOC_MOCK._self]);
          });

          afterEach(function() {
            updateStub.restore();
          });
        });

        describe('.create() | .insert()', function() {
          var createStub;
          beforeEach(function() {
            createStub = stub(DocumentDB.prototype, 'createDocument', applyCallback);
          });

          it('should not get an object params and complete it to empty object', function(done) {
            assertCalled(users.create(), done, createStub, [COLL_MOCK._self, {}]);
          });

          it('should get an object params and call `createDocument` with it', function(done) {
            var o1 = { id: 1, name: 'Ariel M.' };
            assertCalled(users.create(o1), done, createStub, [COLL_MOCK._self, o1]);
          });

          afterEach(function() {
            createStub.restore();
          });
        });

        describe('Groups', function() {
          var results = [{_self: 1}, {_self: 2}, {_self: 3}, {_self: 4}];
          beforeEach(function() {
            readStub.returns(toArray([null, results]));
          });

          // #1
          describe('.findAndRemove()', function() {
            var removeStub;
            beforeEach(function() {
              removeStub = stub(DocumentDB.prototype, 'deleteDocument', applyCallback);
            });

            it('should call `deleteDocument` to each result', function(done) {
              users.findAndRemove({})
                .then(function() {
                  removeStub.callCount.should.eql(results.length);
                  done()
                });
            });

            afterEach(function() {
              removeStub.restore();
            });
          });

          // #2
          describe('.findAndModify()', function() {
            var updateStub;
            beforeEach(function() {
              updateStub = stub(DocumentDB.prototype, 'replaceDocument', applyCallback);
            });

            it('should call `replaceDocument` with each result', function(done) {
              users.findAndModify({}, {})
                .then(function() {
                  updateStub.callCount.should.eql(results.length);
                  done();
                });
            });

            it('should have an aliases `update`', function() {
              users.update.should.eql(users.findAndModify);
            });

            afterEach(function() {
              updateStub.restore();
            });
          });
        });

        describe('.findOrCreate()', function() {
          var createStub;
          beforeEach(function() {
            createStub = stub(DocumentDB.prototype, 'createDocument', applyCallback);
          });

          it('should call `createDocument` if it not exist', function(done) {
            queryStub.returns(toArray([null, []]));
            assertCalled(users.findOrCreate({id:1}), done, createStub);
          });

          it('should return the result if it exist', function(done) {
            var user = { id: 3 };
            queryStub.returns(toArray([null, [user]]));
            users.findOrCreate(user)
              .then(function(res) {
                res.should.eql(user);
                createStub.called.should.eql(false);
                done();
              })
          });

          afterEach(function() {
            createStub.restore();
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


    describe('@private', function() {
      describe('Manager', function() {
        var Manager = require('../../lib/manager');
        it('should accept only DocumentDB instances as an argument', function() {
          (function() {
            new Manager({});
          }).should.throw();

          (function() {
            new Manager(new DocumentDB({}));
          }).should.not.throw();
        });
      });
    });

  });
});