'use strict';
var _       = require('../utils');
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
 * @param params
 * @param {Object=} options
 * @returns {*} Array of results
 */
Manager.prototype.find = function find(parent, params, options) {
  var client = this.client;
  var method = _.isDataBase(parent) ? 'queryCollections' : 'queryDocuments';
  return new Promise(function(resolve, reject) {
    client[method](parent._self, _.queryBuilder(params), options)
      .toArray(function(err, results) {
        return err
          ? reject(err)
          : resolve(results);
      });
  });
};

/**
 @exports
 */
module.exports = Manager;