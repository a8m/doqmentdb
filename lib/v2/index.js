'use strict';
var Promise    = require('bluebird');
var using      = Promise.using;
var Collection = require('./collection');
var _          = require('../utils');

/**
 * @description
 * DoQmentDB constructor get connection object and
 * database as a string
 * @param con
 * @param dbName
 * @constructor
 */
function DoQmentDB(con, dbName) {
  if(con.constructor.name !== 'DocumentClient') {
    throw new Error('connection should be instance of DocumentClient');
  } else {
    this.connection = con;
    this.database = dbName;
  }
}

/**
 * @description
 * return the db object
 * @returns {Promise}
 */
DoQmentDB.prototype.getDatabase = function(options) {
  if(_.isDataBase(this.database)) {
    return this.database;
  }
  var ctx = this;
  var clientDB = ctx.connection;
  return new Promise(function(resolve, reject) {
    clientDB.queryDatabases('SELECT * FROM root r WHERE r.id="' + ctx.database + '"', options)
      .toArray(function(err, results) {
        return err
          ? reject(err)
          : resolve(ctx.database = (_.isArray(results) ? results[0] : results));
      });
  });
};

/**
 * @description
 * get all collection of the current db
 * @param options
 * @returns {Promise}
 */
DoQmentDB.prototype.getAllCollections = function(options) {
  var ctx = this;
  var clientDB = ctx.connection;
  return new Promise(function(resolve, reject) {
    using(ctx.getDatabase(), function(db) {
      clientDB.readCollections(db._self, options).toArray(function(err, results) {
        return err
          ? reject(err)
          : resolve(results);
      });
    });
  });
};

/**
 * @description
 * get collection by name
 * @param name
 * @param options
 * @returns {Promise}
 */
DoQmentDB.prototype.getCollectionByName = function(name, options) {
  var ctx = this;
  var clientDB = ctx.connection;
  return new Promise(function(resolve, reject) {
    using(ctx.getDatabase(), function(db) {
      clientDB.queryCollections(db._self, 'SELECT * FROM root r WHERE r.id="' + name + '"', options)
        .toArray(function(err, results) {
          return err
            ? reject(err)
            : resolve(results);
        });
    });
  });
};

/**
 * @description
 * get collection name and return collection object
 * @param collName
 * @returns {Collection}
 */
DoQmentDB.prototype.use = function(collName) {
  return new Collection(this, collName);
};

/**
 * @expose
 */
module.exports = DoQmentDB;