'use strict';
var Promise = require('bluebird');
var using   = Promise.using;
var _       = require('../utils');
var Manager = require('./manager');

/**
 * @description
 * Collection constructor called gets from DoQmentDB.use()
 * @param conn
 * @param db
 * @param coll
 * @constructor
 */
function Collection(conn, db, coll) {
  this.manager = new Manager(conn);
  this.coll = coll;
  this.db = db;
}

/**
 * @description
 * return collection,
 * fetch from db on first time
 * @returns {*}
 * @private
 */
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

/**
 * @description
 * return the used collection
 * @returns {*}
 */
Collection.prototype.getCollection = function() {
  return _getCollection.call(this);
};


/**
 * @exports
 */
module.exports = Collection;