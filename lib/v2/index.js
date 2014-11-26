'use strict';
var Promise    = require('bluebird');
var using      = Promise.using;
var Collection = require('./collection');
var Manager    = require('./manager');
var _          = require('../utils');

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
function _getDocument() {
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
 * get collection name and return collection object
 * @param collName
 * @returns {Collection}
 */
DoQmentDB.prototype.use = function(collName) {
  return new Collection(this.__conn__, this.database, collName);
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
  return using(_getDocument.call(this), function(db) {
    manager.create(db, name);
  });
};

/**
 * @exports
 */
module.exports = DoQmentDB;