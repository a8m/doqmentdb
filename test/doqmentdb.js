'use strict';
var DocumentDB = require('documentdb').DocumentClient;
var DoQmentDB  = require('..');
var _          = require('agile');
var sinon      = require('sinon');
var should     = require('should');
var Promise    = require('bluebird');

var toArray = function(args) {
  return { toArray: function(fb) { fb.apply(null, args);} }
};

describe('DoqmentDB', function() {
  describe('DatabaseManager', function() {
    beforeEach(function() {

    });

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

  });
});