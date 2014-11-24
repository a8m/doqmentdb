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

function _find(object, many) {
  var manager = this.manager;
  return using(_getCollection.call(this), object, function(coll) {
    return manager.find(coll, object, many);
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
 * @description
 * get object properties and return array of results
 * @param object
 * @returns {*}
 */
Collection.prototype.find = function(object) {
  return _find.call(this, object, true);
};

/**
 * @description
 * get string id and return single object result
 * @param {String} id
 * @returns {*}
 */
Collection.prototype.findById = function(id) {
  return _find.call(this, { id: id })
};

/**
 * @exports
 */
module.exports = Collection;