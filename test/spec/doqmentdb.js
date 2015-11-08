'use strict';
/*global describe, it, beforeEach, afterEach, stub*/
var DocumentDB = require('documentdb').DocumentClient
  , DoQmentDB  = require('../../')
  , sinon      = require('sinon')
  , stub       = sinon.stub
  , spy        = sinon.spy
  , should     = require('should')
  , Promise    = require('bluebird');

describe('DoqmentDB', function() {
  // Helpers: Mocks, and DocumentDB behavior
  var _             = require('../helpers')
    , applyCallback = _.applyCallback
    , toArray       = _.toArray
    , assertCalled  = _.assertCalled
    , DB_MOCK       = _.MOCK.DB
    , COLL_MOCK     = _.MOCK.COLL
    , DOC_MOCK      = _.MOCK.DOC;

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
      var queryStub;

      beforeEach(function() {
        // _getDatabase
        stub(DocumentDB.prototype,  'queryDatabases')
          .returns(toArray([null, DB_MOCK]));
        // (query|read)Collections
        queryStub = stub(DocumentDB.prototype, 'queryCollections');
        queryStub.returns(toArray([null, [COLL_MOCK]]));
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

        it('should get an empty object and call `queryCollections` with' +
          '`SELECT * FROM root r` query', function(done) {
          assertCalled(dbManager.find({}), done, queryStub);
        });

        it('should get an `undefined` params and call `queryCollections`', function(done) {
          assertCalled(dbManager.find(undefined), done, queryStub);
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
        var queryStub;

        beforeEach(function() {
          queryStub = stub(DocumentDB.prototype, 'queryDocuments');
          queryStub.returns(toArray([null, [DOC_MOCK]]));
          spy(users, 'emit');
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
          it('should get empty object and call `queryDocuments`', function(done) {
            assertCalled(users.find({}), done, queryStub);
          });

          it('should get undefined param and call `queryDocuments`', function(done) {
            assertCalled(users.find(undefined), done, queryStub);
          });

          it('should get object params and call `queryDocuments`', function(done) {
            assertCalled(users.find({ id: 12 }), done, queryStub);
          });

          describe('UDF function', function() {
            describe('get query with UDF', function() {
              var findStub;
              beforeEach(function() {
                stub(DocumentDB.prototype, 'createUserDefinedFunction', function(self, udf, cb) {
                  cb(null, {id: 'inUDF', body: 'function(){}'});
                });
                findStub = stub(DocumentDB.prototype, 'readUserDefinedFunctions');
                findStub.returns(toArray([null, [{ id: 'inUDF', body: 'function(){}' }]]));
              });

              it('should call createUDF if if it not exist', function(done) {
                assertCalled(users.find({ arr: { $all: 1 } }), done, queryStub);
              });

              it('should add udf(key,value) in-memory storage', function(done) {
                users.find({ arr: { $all: 1 } })
                  .then(function() {
                    users.udf.should.not.eql({});
                    done();
                  });
              });

              it('should be cached and not call createUDF', function(done) {
                users.find({ arr: { $in: 1 } })
                  .then(function() {
                    DocumentDB.prototype.createUserDefinedFunction.called.should.eql(false);
                    done();
                  });
              });

              it('should be cached and not call createUDF', function(done) {
                users.find({ arr: { $in: 1 }, name: { $type: 'string' } })
                  .then(function() {
                    done();
                  });
              });

              afterEach(function() {
                DocumentDB.prototype.createUserDefinedFunction.restore();
                findStub.restore();
              });
            });
            // TODO(Ariel): refactor
            describe('removeUDF', function() {
              var deleteStub;
              beforeEach(function() {
                deleteStub = stub(DocumentDB.prototype, 'deleteUserDefinedFunction', function(self, cb) {
                  return cb(undefined);
                });
              });

              it('should delete udf', function(done) {
                assertCalled(users.manager.removeUDF({ _self: 'foo' }), done, deleteStub);
              });
            });
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

          describe('#hooks', function() {
            it('should call the `pre` hook before remove', function(done) {
              var t = {fn:function(nxt){nxt();}};
              var spyFn = spy(t, 'fn');
              users.pre('remove', t.fn);
              users.findOneAndRemove({}).then(function() {
                spyFn.called.should.eql(true);
                done();
              });
            });

            it('should call `emit` after remove', function(done) {
              var t = {fn:function(nxt){}};
              var spyFn = spy(t, 'fn');
              users.post('remove', t.fn);
              users.findOneAndRemove({}).then(function(data) {
                spyFn.calledWith(data).should.eql(true);
                users.emit.called.should.eql(true);
                done();
              });
            });
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

          describe('#hooks', function() {
            it('should call the `pre` hook before updating', function(done) {
              var t = {fn:function(nxt){nxt();}};
              var spyFn = spy(t, 'fn');
              users.pre('update', t.fn);
              users.findOneAndModify({}, {}).then(function() {
                spyFn.called.should.eql(true);
                done();
              });
            });

            it('should call `emit` after updating', function(done) {
              var t = {fn:function(nxt){}};
              var spyFn = spy(t, 'fn');
              users.post('update', t.fn);
              users.findOneAndModify({}, {}).then(function(data) {
                spyFn.calledWith(data).should.eql(true);
                users.emit.called.should.eql(true);
                done();
              });
            });
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

          describe('#hooks', function() {
            it('should call the `pre` hook before insertion', function(done) {
              var t = {fn:function(nxt){nxt();}};
              var spyFn = spy(t, 'fn');
              users.pre('save', t.fn);
              users.create('foo').then(function() {
                spyFn.called.should.eql(true);
                done();
              });
            });

            it('should call `emit` after insertion', function(done) {
              var t = {fn:function(nxt){}};
              var spyFn = spy(t, 'fn');
              users.post('save', t.fn);
              users.create('foo').then(function(data) {
                spyFn.calledWith(data).should.eql(true);
                users.emit.called.should.eql(true);
                done();
              });
            });
          });

          afterEach(function() {
            createStub.restore();
          });
        });

        describe('.createOrUpdate() | .upsert()', function() {
          var upsertStub;
          beforeEach(function() {
            upsertStub = stub(DocumentDB.prototype, 'upsertDocument', applyCallback);
          });

          it('should call `upsertDocument`', function(done) {
            var upsert = users.upsert(DOC_MOCK._self);
            assertCalled(upsert, done, upsertStub, [COLL_MOCK._self, DOC_MOCK._self]);
          });

          it('should have an alias `upsert`', function() {
            users.upsert.should.eql(users.createOrUpdate);
          });

          describe('#hooks', function() {
            it('should call the `pre` hook before upserting', function(done) {
              var t = {fn:function(nxt){nxt();}};
              var spyFn = spy(t, 'fn');
              users.pre('upsert', t.fn);
              users.upsert({}).then(function() {
                spyFn.called.should.eql(true);
                done();
              });
            });

            it('should call `emit` after upserting', function(done) {
              var t = {fn:function(nxt){}};
              var spyFn = spy(t, 'fn');
              users.post('upsert', t.fn);
              users.upsert({}).then(function(data) {
                spyFn.calledWith(data).should.eql(true);
                users.emit.called.should.eql(true);
                done();
              });
            });
          });

          afterEach(function() {
            upsertStub.restore();
          });
        });

        describe('Groups', function() {
          var results = [{_self: 1}, {_self: 2}, {_self: 3}, {_self: 4}];
          beforeEach(function() {
            queryStub.returns(toArray([null, results]));
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

            describe('#hooks', function() {
              it('should call the `pre` hook before remove', function(done) {
                var t = {fn:function(nxt){nxt();}};
                var spyFn = spy(t, 'fn');
                users.pre('remove', t.fn);
                users.findAndRemove({}).then(function() {
                  spyFn.called.should.eql(true);
                  done();
                });
              });

              it('should call `emit` after remove', function(done) {
                var t = {fn:function(nxt){}};
                var spyFn = spy(t, 'fn');
                users.post('remove', t.fn);
                users.findAndRemove({}).then(function(data) {
                  spyFn.calledWith(data).should.eql(true);
                  users.emit.called.should.eql(true);
                  done();
                });
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

            describe('#hooks', function() {
              it('should call the `pre` hook before updating', function(done) {
                var t = {fn:function(nxt){nxt();}};
                var spyFn = spy(t, 'fn');
                users.pre('update', t.fn);
                users.update({}, {}).then(function() {
                  spyFn.called.should.eql(true);
                  done();
                });
              });

              it('should call `emit` after updating', function(done) {
                var t = {fn:function(nxt){}};
                var spyFn = spy(t, 'fn');
                users.post('update', t.fn);
                users.update({}, {}).then(function(data) {
                  spyFn.calledWith(data).should.eql(true);
                  users.emit.called.should.eql(true);
                  done();
                });
              });
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

        describe('Sporcs', function() {
          var createSporc, deleteSporc, executeSporc;
          before(function() {
            createSporc = stub(DocumentDB.prototype, 'createStoredProcedure');
            deleteSporc = stub(DocumentDB.prototype, 'deleteStoredProcedure');
            executeSporc = stub(DocumentDB.prototype, 'executeStoredProcedure', applyCallback);
          });
          describe('.$findAndModify()', function() {
            beforeEach(function() {
              var stub1 = stub(DocumentDB.prototype, 'queryStoredProcedures');
              stub1.onCall(0).returns(toArray([null, [{id: '..', _self: '..'}]]));
            });

            it('should create sporcs if not exist', function(done) {
              assertCalled(users.$findAndModify({name: 'foo'}, {name: 'bar'})
                , done, executeSporc);
            });
            afterEach(function() {
              DocumentDB.prototype.queryStoredProcedures.restore();
            });
          });

          describe('.$findOneAndModify()', function() {
            beforeEach(function() {
              var stub1 = stub(DocumentDB.prototype, 'queryStoredProcedures');
              stub1.onCall(0).returns(toArray([null, [{id: '..', _self: '..'}]]));
            });

            it('should create sporcs if not exist', function(done) {
              assertCalled(users.$findOneAndModify({name: 'foo'}, {name: 'bar'})
                , done, executeSporc);
            });

            afterEach(function() {
              DocumentDB.prototype.queryStoredProcedures.restore();
            });
          });

          describe('.$finAndRemove()', function() {
            beforeEach(function() {
              var stub1 = stub(DocumentDB.prototype, 'queryStoredProcedures');
              stub1.onCall(0).returns(toArray([null, [{id: '..', _self: '..'}]]));
            });

            it('should create sporcs if not exist', function(done) {
              assertCalled(users.$findAndRemove({name: 'foo'})
                , done, executeSporc);
            });

            it('should create sporcs if not exist', function(done) {
              assertCalled(users.$findOneAndRemove({name: 'foo'})
                , done, executeSporc);
            });

            afterEach(function() {
              DocumentDB.prototype.queryStoredProcedures.restore();
            });
          });

          describe('.$finOrCreate()', function() {
            beforeEach(function() {
              var stub1 = stub(DocumentDB.prototype, 'queryStoredProcedures');
              stub1.onCall(0).returns(toArray([null, [{id: '..', _self: '..'}]]));
            });

            it('should create sporcs if not exist', function(done) {
              assertCalled(users.$findOrCreate({name: 'foo'})
                , done, executeSporc);
            });

            afterEach(function() {
              DocumentDB.prototype.queryStoredProcedures.restore();
            });
          });
        });

        describe('Schema', function() {
          var users = dbManager.use('users');
          users.schema({
            name: { type: String, expose: true, regex: /^/ }
          });
          it('should set the schema on the CollectionManager', function() {
            users._schema.should.be.type('object');
          });
        });

        afterEach(function() {
          queryStub.restore();
          users.emit.restore();
        });
      });

      afterEach(function() {
        queryStub.restore();
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
