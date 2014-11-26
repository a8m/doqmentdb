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
  return new Promise(function(resolve, reject) {
    if(_.isCollection(ctx.coll)) {
      return resolve(ctx.coll)
    }
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
 * call manager.find function with the given args
 * @param object
 * @param many
 * @returns {*}
 * @private
 */
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
 * get object properties and return the first matching result.
 * @param object
 * @returns {*}
 */
Collection.prototype.findOne = function(object) {
  return _find.call(this, object);
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
 * @description
 * get object properties, search for an object, if it exist - remove it,
 * else return false
 * @param object
 * @returns {*}
 */
Collection.prototype.findAndRemove = function(object) {
  var manager = this.manager;
  return using(_find.call(this, object), function(object) {
    return object ? manager.remove(object) : false;
  }).then(_.first);
};

/**
 * @description
 * get object properties, and create new document under the
 * current collection
 * @param object
 * @returns {*}
 */
Collection.prototype.insert =
Collection.prototype.create = function(object) {
  var manager = this.manager;
  return using(_getCollection.call(this), function(coll) {
    return manager.create(coll, object);
  }).then(_.first);
};

/**
 * @description
 * get object properties to search, find the equivalents
 * and modify them.
 * @param object
 * @returns {*}
 */
Collection.prototype.findAndModify =
Collection.prototype.update = function(sDoc, nDoc) {
  var manager = this.manager;
  return using(_find.call(this, sDoc, true), function(results) {
    var docs = [];
    results.forEach(function(doc) {
      var res = _.extend(doc, nDoc);
      docs.push(manager.update(doc, res).then(_.first));
    });
    return Promise.all(docs);
  });
};

/**
 * @exports
 */
module.exports = Collection;