'use strict';
var Promise = require('bluebird');
var using   = Promise.using;
var _       = require('./utils');
var Manager = require('./manager');
var Schema  = require('./schema');
var Sprocs  = require('./sprocs');

/**
 * @description
 * Collection constructor called gets from DoQmentDB.use()
 * @param conn
 * @param db
 * @param coll
 * @constructor
 */
function Collection(conn, db, coll) {
  this.manager = new Manager(conn);
  this.coll = coll;
  this.db = db;
  this._schema = undefined;
}

/**
 * @description
 * initialize schema service
 * @param schema
 */
Collection.prototype.schema = function(schema) {
  this._schema = Schema.isValidSchema(schema)
    ? Schema.factory(schema)
    : undefined;
};

/**
 * @description
 * return the used collection
 * @returns {*}
 */
Collection.prototype.getCollection = function() {
  return _getCollection.call(this);
};

/**
 * @description
 * get object properties and return array of results
 * @param object
 * @returns {*}
 */
Collection.prototype.find = function(object) {
  return _find.call(this, object, true);
};

/**
 * @description
 * get object properties and return the first matching result.
 * @param object
 * @returns {*}
 */
Collection.prototype.findOne = function(object) {
  return _find.call(this, object);
};

/**
 * @description
 * get string id and return single object result
 * @param {String} id
 * @returns {*}
 */
Collection.prototype.findById = function(id) {
  return _find.call(this, { id: id });
};

/**
 * @description
 * get self link and return single object result
 * @param {String} self link
 * @returns {*}
 */
Collection.prototype.read = function(selfLink) {
  var ctx = this;

  return using(_getCollection.call(ctx), function(coll) {
    return ctx.manager.read(coll, selfLink);
  });  
}

/**
 * @description
 * get self link and remove the matching document
 * @param {Object|String} in case of string we use the given value as the self link
 * @returns {*}
 */
Collection.prototype.remove = function(obj) {
  var ctx = this;

  if (typeof obj === 'string') {
    obj = { _self: obj };
  }

  return using(_getCollection.call(ctx), function(coll) {
    return ctx.manager.remove(coll, obj);
  });  
}

/**
 * @description
 * get object properties, search for an object, if it exist - remove it,
 * else return false
 * @param object
 * @returns {*}
 */
Collection.prototype.findOneAndRemove = function(object) {
  var manager = this.manager;
  return using(_find.call(this, object), function(object) {
    return object ? manager.remove(object) : false;
  }).then(_.first);
};

/**
 * @description
 * get object properties and modify the first matching.
 * @param sDoc
 * @param nDoc
 * @returns {*}
 */
Collection.prototype.findOneAndModify = function(sDoc, nDoc) {
  var manager = this.manager;
  var schema = this._schema;
  nDoc = schema ? schema.test.update(nDoc) : nDoc;
  return using(_find.call(this, sDoc), nDoc, function(doc, nDoc) {
    return manager.update(doc, _.extend(doc, nDoc));
  }).then(_.first);
};

/**
 * @description
 * get object properties, and create new document under the
 * current collection
 * @param object
 * @returns {*}
 */
Collection.prototype.insert =
Collection.prototype.create = function(doc) {
  var manager = this.manager;
  var schema = this._schema;
  doc = schema ? schema.test.create(doc) : doc;
  return using(_getCollection.call(this), doc, function(coll, doc) {
    return manager.create(coll, doc || {});
  });
};

/**
 * @description
 * get object properties to search, find the equivalents
 * and remove them.
 * @param object
 * @returns {*}
 */
Collection.prototype.findAndRemove = function(object) {
  var manager = this.manager;
  
  if (this.sprocs && this.sprocs.findAndRemove) {
    return this.manager.executeStoredProcedure(
      this.sprocs.findAndRemove,
      [_.queryBuilder(object)]);
  }

  function func(el) { return manager.remove(el); }
  return using(_find.call(this, object, true), func, _all);
};

/**
 * @description
 * get object properties to search, find the equivalents
 * and modify them.
 * @param object
 * @returns {*}
 */
Collection.prototype.findAndModify =
Collection.prototype.update = function(sDoc, nDoc) {
  var manager = this.manager;

  if (this.sprocs && this.sprocs.findAndModify) {
    return this.manager.executeStoredProcedure(
      this.sprocs.findAndModify,
      [_.queryBuilder(sDoc), nDoc]);
  }

  var schema = this._schema;
  function func(doc) {
    nDoc = schema ? schema.test.update(nDoc) : nDoc;
    return using(nDoc, function(nDoc) {
      return manager.update(doc, _.extend(doc, nDoc));
    });
  }
  return using(_find.call(this, sDoc, true), func, _all);
};

/**
 * @description
 * get object properties, search for document, if it not exist create it.
 * @param object
 * @returns {*}
 */
Collection.prototype.findOrCreate = function(object) {
  var ctx = this;
  return using(_find.call(this, object, true), function(result) {
    return _.isEmpty(result)
      ? ctx.create(object)
      : _.first(result);
  })
};

/**
 * @description
 * registers findAndRemove and findAndModify as stored procedures.
 * @returns {*}
 */
Collection.prototype.registerStoredProcedures = function(forceUpdate) {
  var ctx = this;

  return new Promise(function(resolve, reject) {
    using(_getCollection.call(ctx), function(coll) {
      Sprocs.registerStoredProcedures(ctx.manager.client, ctx.coll._self, forceUpdate, function(err, sprocs) {
        if (err) {
          return reject(err);
        }

        ctx.sprocs = sprocs;
        return resolve(sprocs);
      });
    });
  });
};

/**
 * @description
 * return collection,
 * fetch from db on first time
 * @returns {*}
 * @private
 */
function _getCollection() {
  var ctx = this;
  var manager = ctx.manager;
  var promise = new Promise(function(resolve, reject) {
    if(_.isCollection(ctx.coll)) {
      return resolve(ctx.coll)
    }
    using(manager.findOrCreate({ id: ctx.db }), function(database) {
      manager.findOrCreate(database, { id: ctx.coll })
        .then(function(collection) {
          ctx.coll = collection;
          // next time we will just return the resolved promise
          _getCollection = function() { return promise; };
          resolve(collection);
        }, function(err) {
          reject(err);
        });
    });
  });

  return promise;
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
  var schema = this._schema;
  var q = using(_getCollection.call(this), object, function(coll) {
    return manager.find(coll, object, many);
  });
  var fn = many ? 'map' : 'then';
  return schema ? q[fn](schema.omit) : q;
}

/**
 * @description
 * get an array of object and callback function(that return $q)
 * and return Promise.all after running this cb all over the objects.
 * @param arr
 * @param cb
 * @returns {*}
 * @private
 */
function _all(arr, cb) {
  var res = [];
  arr.forEach(function(i) {
    res.push(cb(i).then(_.first));
  });
  return Promise.all(res);
}

/**
 * @exports
 */
module.exports = Collection;