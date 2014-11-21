'use strict';
var _       = require('../utils');
var Promise = require('bluebird');
var using   = Promise.using;

function Collection(manager, coll) {
  this.manager = manager;
  this.coll = coll;
}

function _getCollection() {
  var ctx = this;
  var manager = ctx.manager;
  if(_.isCollection(ctx.coll)) {
    return ctx.coll;
  }
  return new Promise(function(resolve, reject) {
    using(manager.getDatabase(), ctx.coll, manager.getCollectionByName)
      .then(function(collection) {
        ctx.coll = collection;
        resolve(collection);
      });
  });
}

Collection.prototype.getAll = function(options) {
  var ctx = this;
  return using(_getCollection.call(this), function(coll) {
    return new Promise(function(resolve, reject) {
      console.log(ctx)
      ctx.manager.connection.readDocuments(coll._self, options)
        .toArray(function(err, results) {
          return resolve(results);
        });
    });
  });
};

module.exports = Collection;