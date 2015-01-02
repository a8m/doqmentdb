'use strict';
var Collection = require('./collection')
  , Manager    = require('./manager')
  , _          = require('./utils')
  , Promise    = require('bluebird')
  , using      = Promise.using;

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
 * get collection name and return CollectionManager instance.
 * if the given `collection` is not exist it will create one.
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
 * Get name and crete new collection in the used db.
 * @param name
 * @returns {*}
 */
DoQmentDB.prototype.insert =
DoQmentDB.prototype.create = function(name) {
  var manager = this.manager;
  return using(_getDatabase.call(this), function(db) {
    return manager.create(db, name);
  });
};

/**
 * @description
 * find collection by given `string` id
 * @param id
 * @returns {*}
 */
DoQmentDB.prototype.findById = function(id) {
  return _find.call(this, { id: id });
};

/**
 * @description
 * find collection by given object params
 * @param {object=} object => to return all documents/collections, omit this parameter
 * or pass an empty object({}).
 * @returns {Promise} Array of results
 */
DoQmentDB.prototype.find = function(object) {
  return _find.call(this, object, true);
};

/**
 * @description
 * get collection id as a `String`, if it exist - remove it and return undefined,
 * else return false.
 * @param id
 * @returns {*}
 */
DoQmentDB.prototype.remove = function(id) {
  var manager = this.manager;
  return using(_find.call(this, { id: id }), function(coll) {
    return manager.remove(coll).then(_.first);
  });
};

/**
 * @description
 * get object properties, search for collection, if it not exist create it.
 * @param object
 * @returns {*}
 */
DoQmentDB.prototype.findOrCreate = function(object) {
  var ctx = this;
  return using(_find.call(ctx, object, true), function(result) {
    return _.isEmpty(result)
      ? ctx.create(object)
      : _.first(result);
  });
};

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
    manager.findOrCreate({ id: ctx.database })
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
 * @exports
 */
module.exports = DoQmentDB;