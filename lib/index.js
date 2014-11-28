'use strict';
var Collection = require('./collection');
var Manager    = require('./manager');
var _          = require('./utils');
var Promise    = require('bluebird');
var using      = Promise.using;

/**
 * @description
 * DoQmentDB constructor get connection object and
 * database as a string
 * @param conn
 * @param dbName
 * @constructor
 */
function DoQmentDB(conn, dbName) {
  if(conn.constructor.name !== 'DocumentClient') {
    throw new Error('connection should be instance of DocumentClient');
  } else {
    this.__conn__ = conn;
    this.manager = new Manager(conn);
    this.database = dbName;
  }
}

/**
 * @description
 * return the usage database
 * fetch from db on first time, then store it.
 * @returns {*}
 * @private
 */
function _getDatabase() {
  var ctx = this;
  var manager = ctx.manager;
  return new Promise(function(resolve, reject) {
    if(_.isDataBase(ctx.database)) {
      return resolve(ctx.database);
    }
    manager.getDatabaseByName(ctx.database)
      .then(function(database) {
        ctx.database = database;
        return resolve(database);
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
  return using(_getDatabase.call(this), object, function(db) {
    return manager.find(db, object, many);
  });
}

/**
 * @description
 * get collection name and return collection object
 * @param collName
 * @returns {Collection}
 */
DoQmentDB.prototype.use = function(collName) {
  return new Collection(this.__conn__, this.database, collName);
};

/**
 * @description
 * Return the used database
 * @returns {*}
 */
DoQmentDB.prototype.getDatabase = function() {
  return _getDatabase.call(this);
};

/**
 * @description
 * Get name and crete new collection in the current db.
 * @param name
 * @returns {*}
 */
DoQmentDB.prototype.insert =
DoQmentDB.prototype.create = function(name) {
  var manager = this.manager;
  return using(_getDatabase.call(this), function(db) {
    manager.create(db, name);
  });
};

/**
 * @description
 * getCollection by id
 * @param id
 * @returns {*}
 */
DoQmentDB.prototype.findById = function(id) {
  return _find.call(this, { id: id });
};

/**
 * @description
 * find collection by given object params
 * @param object => to return all documents/collections, omit this parameter
 * or pass an empty object({}).
 * @returns {Promise} Array of results
 */
DoQmentDB.prototype.find = function(object) {
  return _find.call(this, object, true);
};

/**
 * @exports
 */
module.exports = DoQmentDB;