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
 * get(Database/Collection/Document)ByName
 * @param parent
 * @param name
 * @param options
 * @returns {Promise}
 */
Manager.prototype.getDatabaseByName =
Manager.prototype.getCollectionByName =
Manager.prototype.getDocumentByName = function(parent, name, options) {
  var client = this.client;
  var method = _.isUndefined(name) ? 'queryDatabases' :
    _.isDataBase(parent) ? 'queryCollections' : 'queryDocuments';
  var args = _.isUndefined(name) ? [] : [parent._self];
  args.push('SELECT * FROM root r WHERE r.id="' + (name || parent) + '"', options);
  return new Promise(function(resolve, reject) {
    client[method].apply(client, args).toArray(function(err, results) {
      return err
        ? reject(err)
        : resolve(_.isArray(results) ? results[0] : results);
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
  var method = _.isDataBase(parent) ? 'createCollection' : 'createDocument';
  return Promise.promisify(client[method])
    .call(client, parent._self, _.isString(obj) ? { id: obj } : obj);
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
 @exports
 */
module.exports = Manager;