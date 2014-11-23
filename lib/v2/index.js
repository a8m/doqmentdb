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
 * get collection name and return collection object
 * @param collName
 * @returns {Collection}
 */
DoQmentDB.prototype.use = function(collName) {
  return new Collection(this.__conn__, this.database, collName);
};

/**
 * @expose
 */
module.exports = DoQmentDB;