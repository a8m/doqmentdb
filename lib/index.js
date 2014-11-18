'use strict';
var DocumentDB = require('documentdb').DocumentClient;
var Promise    = require('bluebird');
var _          = require('./utils');
var clientDB;

/**
 * @description
 * create/config connection to DocumentDB
 * @param host
 * @param config
 */
function createConnection(host, config) {
  clientDB = new DocumentDB(host, config);
}

/**
 * @description
 * return the DocumentDB connection || Error if there's no connection yet.
 * @returns {*}
 */
function getConnection() {
  return clientDB
    ? clientDB
    : new Error('There\'s no connection to DocumentDB, use `createConnection`');
}

/**
 * @description
 * Read all databases
 * @param {Object=} options
 * @returns {Promise}
 */
function getAllDatabases(options) {
  return new Promise(function(resolve, reject) {
    clientDB.readDatabases(options).toArray(function(err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * Read database by name
 * @param name
 * @param {Object=} options
 * @returns {Promise}
 */
function getDatabaseByName(name, options) {
  return new Promise(function(resolve, reject) {
    clientDB.queryDatabases('SELECT * FROM root r WHERE r.id="' + name + '"', options)
      .toArray(function(err, results) {
        return err
          ? reject(new Error(err))
          : resolve(results);
      });
  });
}

/**
 * @description
 * Create database by name
 * @param name
 * @returns {Promise}
 */
function createDatabase(name) {
  return new Promise(function(resolve, reject) {
    clientDB.createDatabase({ id: name }, function(err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * search database by name, if it's not exist, create one.
 * @param name
 * @param {Object=} options
 * @returns {*}
 */
function findOrCreateDatabase(name, options) {
  return getDatabaseByName(name, options)
    .then(function(data) {
      return _.isEmpty(data)
        ? createDatabase(name)
        : data[0];
    });
}

/**
 * @description
 * get db object and collection name, and query the collection
 * @param db
 * @param name
 * @param {Object=} options
 * @returns {Promise}
 */
function getCollectionByName(db, name, options) {
  return new Promise(function(resolve, reject) {
    clientDB.queryCollections(db._self, 'SELECT * FROM root r WHERE r.id="' + name + '"', options)
      .toArray(function(err, results) {
        return err
          ? reject(new Error(err))
          : resolve(results);
      });
  });
}

/**
 * @description
 * get db object and collection name, create and return the new collection
 * @param db
 * @param name
 * @param {Object=} options
 * @returns {Promise}
 */
function createCollection(db, name, options) {
  return new Promise(function(resolve, reject) {
    clientDB.createCollection(db._self, { id: name }, options, function(err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * get database object and collection name,
 * find collection, if not exist create one.
 * @param db
 * @param name
 * @param {Object=} options
 * @returns {*}
 */
function findOrCreateCollection(db, name, options) {
  return getCollectionByName(db, name, options)
    .then(function(data) {
      return _.isEmpty(data)
        ? createCollection(db, name, options)
        : data[0];
    });
}

/**
 * @description
 * get all documents/collections by parent object
 * @param obj
 * @param {Object=} options
 * @returns {Promise}
 */
function getAll(obj, options) {
  var getMethod = _.isDataBase(obj) ? 'readCollections' : 'readDocuments';
  return new Promise(function(resolve, reject) {
    clientDB[getMethod](obj._self, options).toArray(function(err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * get collection object and name and create document, e.g: getItem
 * @param col - collection object
 * @param doc => e.g: { id: 'foo', phone: 'bar'}
 * @param {Object=} options
 * @returns {Promise}
 */
function createDocument(col, doc, options) {
  return new Promise(function(resolve, reject) {
    clientDB.createDocument(col._self, doc, options, function (err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * get document object by name
 * @param col
 * @param name
 * @param {Object=} options
 * @returns {Promise}
 */
function getDocumentByName(col, name, options) {
  return new Promise(function(resolve, reject) {
    clientDB.queryDocuments(col._self, 'SELECT * FROM root r WHERE r.id="' + name + '"', options)
      .toArray(function(err, results) {
        return err
          ? reject(new Error(err))
          : resolve(results);
      });
  });
}

/**
 * @description
 * `replace` document with new one.
 * @param oDoc
 * @param nDoc
 * @param {Object=} options
 * @returns {Promise}
 */
function replaceDocument(oDoc, nDoc, options) {
  return new Promise(function(resolve, reject) {
    clientDB.replaceDocument(oDoc._self, nDoc, options, function(err, results) {
      return err
        ? reject(new Error(err))
        : resolve(results);
    });
  });
}

/**
 * @description
 * get a collection and doc object,
 * if it not exist create it, else update it.
 * @param col
 * @param doc
 * @param {Object=} options
 * @returns {*}
 */
function saveDocument(col, doc, options) {
  return getDocumentByName(col, doc.id)
    .then(function(data) {
      return _.isEmpty(data)
        ? createDocument(col, doc, options)
        : replaceDocument(data[0], doc, options);
    });
}

/**
 * @description
 * get a document/collection/database object and remove it from DB
 * @param obj
 * @param {Object=} options
 * @returns {Promise}
 */
function remove(obj, options) {
  var removeMethod = _.isCollection(obj) ? 'deleteCollection'
    : _.isDataBase(obj) ? 'deleteDatabase' : 'deleteDocument';
  return new Promise(function(resolve, reject) {
    clientDB[removeMethod](obj._self, options, function(err, data) {
      return err
        ? reject(new Error(err))
        : resolve(data);
    });
  });
}

/**
 * @description
 * get collection and object param,
 * find a document by params and remove it from DB
 * @param col
 * @param params
 * @param {Object=} options
 * @returns {*}
 */
function findAndRemoveDocument(col, params, options) {
  return find(col, params, options)
    .then(function(data) {
      return _.isEmpty(data)
        ? new Error('Can\'t find document to remove')
        : removeDocument(data[0]); //TODO: if it's an array of results, remove them all ?
    });
}


/**
 * @description
 * find document/collection by given object params
 * @param parent => database or collection
 * @param params
 * @param {Object=} options
 * @returns {*} Array of results
 */
function find(parent, params, options) {

  var queryMethod = _.isDataBase(parent) ? 'queryCollections' : 'queryDocuments';
  return new Promise(function(resolve, reject) {
    clientDB[queryMethod](parent._self, _.queryBuilder(params), options)
      .toArray(function(err, results) {
        return err
          ? reject(new Error(err))
          : resolve(results);
      });
  });
}

/**
 * @expose
 */
module.exports = {
  createConnection: createConnection,
  getConnection: getConnection,
  getAllDatabases: getAllDatabases,
  getDatabaseByName: getDatabaseByName,
  createDatabase: createDatabase,
  removeDatabase: remove,
  findOrCreateDatabase: findOrCreateDatabase,
  getAllCollections: getAll,
  getCollectionByName: getCollectionByName,
  findCollection: find,
  findOrCreateCollection: findOrCreateCollection,
  createCollection: createCollection,
  removeCollection: remove,
  getAllDocuments: getAll,
  getDocumentByName: getDocumentByName,
  createDocument: createDocument,
  replaceDocument: replaceDocument,
  saveDocument: saveDocument,
  updateDocument: saveDocument,
  findDocument: find,
  removeDocument: remove,
  findAndRemoveDocument: findAndRemoveDocument,
  find: find,
  remove: remove,
  getAll: getAll
};