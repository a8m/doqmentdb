'use strict';
var _         = require('./utils')
  , Promise   = require('bluebird')
  , query     = require('./query')
  , using     = Promise.using
  , promisify = Promise.promisify
  ;

/**
 * @description
 * clientDB/Manager constructor.
 * @param client
 * @constructor
 */
function Manager(client) {
  if(client.constructor.name !== 'DocumentClient') {
    throw new Error('connection must be instance of DocumentClient');
  } else {
    this.client = client;
  }
}

/**
 * @description
 * get object and remove it from db.
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.remove = function(obj) {
  var client = this.client
    , method = _.isCollection(obj) ? 'deleteCollection' : 'deleteDocument';
  return promisify(client[method]).call(client, obj._self);
};

/**
 * @description
 * create document/collection based on the given parent.
 * @param parent
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.create = function(parent, obj) {
  var client = this.client
    , method = _.isUndefined(obj)
      ? 'createDatabase'
      : ['create', _.isDataBase(parent) ? 'Collection' : 'Document'].join('')
    , args = _.isUndefined(obj) ? [] : [parent._self];
  return promisify(client[method])
    .apply(client, args.concat(_.isString(obj) ? { id: obj } : (obj || parent)))
    .then(_.first);
};

/**
 * @description
 * upsert a document to the specified collection.
 * @param coll
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.upsert = function(coll, obj) {
  var client = this.client;
  return promisify(client.upsertDocument)
    .call(client, coll._self, obj);
};

/**
 * @description
 * get doc and replace it with new one
 * @param sDoc
 * @param nDoc
 * @returns {*}
 */
Manager.prototype.update = function(sDoc, nDoc) {
  var client = this.client;
  return promisify(client.replaceDocument)
    .call(client, sDoc._self, nDoc);
};

/**
 * @description
 * find(document|collection) by given object params
 * @param parent => database or collection
 * @param params => to return all documents/collections, omit this parameter
 * or pass an empty object({}).
 * @param {Boolean=} many
 * @param {Object=} udf => in memory udf store
 * @returns {Promise} Array of results
 */
Manager.prototype.find = function (parent, params, many, udf) {
  var client = this.client
    , type = _.isDataBase(parent) ? 'Collections' : 'Documents'
    , method = 'query'
    , queryString = this.query(params || {}, udf ? { udf: udf, parent: parent } : {});

  return using(queryString, function(query) {
    return new Promise(function(resolve, reject) {
      // e.g: readDocuments vs. queryDocuments based on the `params` arg.
      client[method + type](parent._self, query, { enableScanInQuery: true })
        .toArray(function(err, results) {
          return err
            ? reject(err)
            : resolve(many ? results : results[0]);
        });
    });
  });
};

/**
 * @description
 * call query with the given object, if it's string return query as-is
 * if not, build the query, if it's contains UDF, ensure it's created(else create it)
 * @param {Object} [object]         - the query object, could bw string to
 * @param {Object} [options]        - options: see below
 * @param {Object} [options.udf]    - udf storage
 * @param {Object} [options.parent] - parent(e.g: collection, database, with self link)
 * @returns {*}
 */
Manager.prototype.query = function(object, options) {
  var queryString = query(object)
    , udfCache = options.udf
    , store = function(fn) {                          // storeFn, used below
      fn = _.isArray(fn) ? _.first(fn) : fn;          // with response headers(on create)
      udfCache[fn.id] = fn.body
    }
    , self = this;
  if(_.isString(queryString)) return queryString;     // without udf

  var cached = queryString.udf.every(function(fn) {   // test if all udf cached already
    return _.isDefined(udfCache[fn.id]);
  });
  if(cached) return queryString.query;                // resolve with query

  return new Promise(function(resolve, reject) {      // findOrCreateUDF
    self.findUDF(options.parent, {})
      .each(store)
      .then(function(udfs) {
        return queryString.udf.filter(function(fn) {  // return all query.udf
          return !udfs.some(function(udf) {           // that not created yet
            return udf.id == fn.id;
          });
        });
      })
      .map(function(fn) {
        return self.createUDF(options.parent, fn);    // create each udf
      })
      .each(store)                                    // store each returned udf
      .then(function() {
        resolve(queryString.query);                   // time to query
      })
      .catch(reject);                                 // catch and reject
  });
};


/**
 * @description
 * TODO:I'm not fun of it, but it's do the job right now..(refactor on v0.2.0)
 * usage:
 * Database({ id: `..` })
 * Collection(dbObject, { id: `..` })
 * Document(collObject, { id: `..` })
 * @param parent
 * @param {Object=} object
 * @returns {Promise}
 */
Manager.prototype.findOrCreate = function(parent, object) {
  var ctx = this, client = ctx.client;
  var findMethod = _.isUndefined(object)
    ? 'queryDatabases'
    : ['query', _.isDataBase(parent) ? 'Collections' : 'Documents'].join('');
  var findArgs = _.isUndefined(object) ? [] : [parent._self];
  findArgs.push(query(object || parent));
  return new Promise(function(resolve, reject) {
    client[findMethod].apply(client, findArgs).toArray(function(err, results) {
      if (err) return reject(err);
      if(_.isEmpty(results)) {
        var createArgs = _.isUndefined(object) ? [] : [parent];
        return ctx.create.apply(ctx, createArgs.concat(object || parent))
          .then(resolve)
          .catch(reject);
      }
      return resolve(_.first(results));
    });
  });
};

/**
 * TODO(Ariel): find/create/removeUDF should exposed to collection level
 * @description
 * find UDF functions
 * @example
 *
 *    users.findUDF()                 \\ find all
 *    users.findUDF({})               \\ find all
 *    users.findUDF({ id: 'isIn' })   \\ find function with named `isIn`
 *
 * @param parent
 * @param {Object=} params
 * @returns {Promise}
 */
Manager.prototype.findUDF = _findFactory('queryUserDefinedFunctions', 'readUserDefinedFunctions');


/**
 * TODO: should add key on udf storage(e.g: { inUDF: function.. })
 * @description
 * create UDF function
 * @example
 *
 *    users.createUDF({ id: 'myFn', body: function(){} });
 *
 * @param parent
 * @param udf
 * @returns {*}
 */
Manager.prototype.createUDF = _createFactory('createUserDefinedFunction');

/**
 * TODO: should delete key from udf storage
 * @description
 * remove UDF function
 * @example
 *
 *    users.findAndRemoveUDF({ id: 'someName' })  // remove `someName` UDF
 *    users.findAndRemoveUDF({})                  // remove all UDF
 *
 * @param udf
 * @returns {*}
 */
Manager.prototype.removeUDF = _removeFactory('deleteUserDefinedFunction');

/**
 * @description
 * find stored procedures
 * @example
 *
 *    users.findSporc()                     \\ find all
 *    users.findSporc({})                   \\ find all
 *    users.findSporc({ id: 'update' })     \\ find stored procedure named `update`
 *
 * @param parent                  - object with _self, e.g: Collection
 * @param {Object=} params        - object query
 * @returns {Promise}
 */
Manager.prototype.findSporc = _findFactory('queryStoredProcedures', 'readStoredProcedures');

/**
 * @description
 * create stored procedure
 * @example
 *
 *    users.createSporc({ id: 'update', body: function() {...} })
 *
 * @param                         - object with _self, e.g: Collection
 * @param {Object=} params        - stored procedure object
 * @type {Function}
 */
Manager.prototype.createSporc = _createFactory('createStoredProcedure');

/**
 * @description
 * remove stored procedure
 * @example
 *
 *    users.findAndRemoveSporc({ id: 'someName' })  // remove `someName` sporc
 *    users.findAndRemoveSporc({})                  // remove all sporcs
 *
 * @param sporc         - stored procedure with `_self` field
 * @type {Function}
 */
Manager.prototype.removeSporc = _removeFactory('deleteStoredProcedure');

/**
 * @description
 * execute stored procedure
 * @example
 *
 *  // user-level
 *  users.$update({ id: 2 }, { id: 3 })
 *
 * @param self     - sporc._self
 * @param args     - arguments to execute
 * @returns {*}
 */
Manager.prototype.executeSporc = function(self, args) {
  var client = this.client;
  return promisify(client.executeStoredProcedure)
    .call(client, self, args)
    .then(_.first);
};

/**
 * @description
 * return remove[Type] function
 * @example
 *
 *  Manager.prototype.removeSporc = _removeFactory('deleteStoredProcedure');
 *
 * @param fn                - remove function, e.g: 'deleteStoredProcedure'
 * @returns {Function}      -
 * @private
 */
function _removeFactory(fn) {
  return function(obj) {
    var client = this.client;
    return promisify(client[fn]).call(client, obj._self);
  }
}

/**
 * @description
 * return create[Type] function
 * @example
 *
 *    Manager.prototype.createSporc = _createFactory('createStoredProcedure');
 *
 *
 * @param fn                - create function, e.g: 'createStoredProcedure'
 * @returns {Function}      -
 * @private
 */
function _createFactory(fn) {
  return function(parent, obj) {
    var client = this.client;
    return promisify(client[fn]).call(client, parent._self, obj);
  }
}

/**
 * @description
 * return find[Type] function
 * @example
 *
 *    Manager.prototype.findSporc = _findFactory('queryStoredProcedures', 'readStoredProcedures');
 *
 * @param one           - query function, e.g: 'queryStoredProcedures'
 * @param all           - read function, e.g: 'readStoredProcedures'
 * @returns {Function}  -
 * @private
 */
function _findFactory(one, all) {
  return function(parent, params) {
    var client = this.client
      , isQuery = params && !_.isEmpty(params)
      , method = isQuery
        ? one   // query...
        : all   // read...
      , args = [parent._self].concat(isQuery ? [query(params)] : []);
    return new Promise(function(resolve, reject) {
      client[method].apply(client, args).toArray(function(err, result) {
        return err
          ? reject(err)
          : resolve(result);
      });
    });
  };
}

/**
 @exports
 */
module.exports = Manager;
