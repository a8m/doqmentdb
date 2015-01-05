'use strict';
var _       = require('./utils');
var Promise = require('bluebird');

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
 * TODO:I'm not fun of it, but it's do the job right now..(refactor on v0.0.2)
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
  findArgs.push(_.queryBuilder(object || parent));
  return new Promise(function(resolve, reject) {
    client[findMethod].apply(client, findArgs).toArray(function(err, results) {
      if (err) return reject(err);
      if(_.isEmpty(results)) {
        var createArgs = _.isUndefined(object) ? [] : [parent];
        return ctx.create.apply(ctx, createArgs.concat(object || parent))
          .then(resolve);
      } else {
       return resolve(_.isArray(results) ? results[0] : results);
      }
    });
  });
};

/**
 * @description
 * find(document|collection) by given object params
 * @param parent => database or collection
 * @param params => to return all documents/collections, omit this parameter
 * or pass an empty object({}).
 * @param {Boolean=} many
 * @returns {Promise} Array of results
 */
Manager.prototype.find = function (parent, params, many) {
  var client = this.client;
  var type = _.isDataBase(parent) ? 'Collections' : 'Documents';
  var method = _.isUndefined(params) || _.isEmpty(params) ? 'read' : 'query';
  return new Promise(function(resolve, reject) {
    // e.g: readDocuments vs. queryDocuments based on the `params` arg.
    client[method + type](parent._self, _.queryBuilder(params || {}))
      .toArray(function(err, results) {
        return err
          ? reject(err)
          : resolve(many ? results : results[0]);
      });
  });
};

/**
 * @description
 * get object and remove it from db.
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.remove = function(obj) {
  var client = this.client;
  var method = _.isCollection(obj) ? 'deleteCollection' : 'deleteDocument';
  return Promise.promisify(client[method]).call(client, obj._self);
};

/**
 * @description
 * create document/collection based on the given parent.
 * @param parent
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.create = function(parent, obj) {
  var client = this.client;
  var method = _.isUndefined(obj)
    ? 'createDatabase'
    : ['create', _.isDataBase(parent) ? 'Collection' : 'Document'].join('');
  var args = _.isUndefined(obj) ? [] : [parent._self];
  return Promise.promisify(client[method])
    .apply(client, args.concat(_.isString(obj) ? { id: obj } : (obj || parent)))
    .then(_.first);
};

/**
 * @description
 * read document/collection based on the given parent.
 * @param parent
 * @param obj
 * @returns {Promise}
 */
Manager.prototype.read = function(parent, selfLink) {
  var client = this.client;
  var method = ['read', _.isDataBase(parent) ? 'Collection' : 'Document'].join('');
  return Promise.promisify(client[method])
    .call(client, selfLink);
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
  return Promise.promisify(client.replaceDocument)
    .call(client, sDoc._self, nDoc);
};

// Soon, Azure will update a version and we can simply
// query this way: `SELECT COUNT(*) FROM ROOT r WHERE ...`
Manager.prototype.count = function(object) {
  // ...
};

/**
 * @description
 * executes a stored procedure
 * @param sproc the stored procedure to execute
 * @param params the parameters for the stored procedure
 * @returns {*}
 */
Manager.prototype.executeStoredProcedure = function(sproc, params) {
  var client = this.client;

  return Promise.promisify(client.executeStoredProcedure)
    .call(client, sproc._self, params);
};

/**
 @exports
 */
module.exports = Manager;