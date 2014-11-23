'use strict';
var Promise = require('bluebird');
var using   = Promise.using;
var _       = require('../utils');
var Manager = require('./manager');

function Collection(conn, db, coll) {
  this.manager = new Manager(conn);
  this.coll = coll;
  this.db = db;
}

function _getCollection() {
  var ctx = this;
  var manager = ctx.manager;
  return _.isCollection(ctx.coll)
    ? ctx.coll
    : new Promise(function(resolve, reject) {
      using(manager.getDatabaseByName(ctx.db), function(database) {
        manager.getCollectionByName(database, ctx.coll)
          .then(function(collection) {
            ctx.coll = collection;
            resolve(collection);
          });
      });
    });
}

Collection.prototype.get = function() {
  return _getCollection.call(this);
};

module.exports = Collection;