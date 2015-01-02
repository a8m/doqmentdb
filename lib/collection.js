'use strict';
var EventEmitter = require('events').EventEmitter
  , inherits     = require('util').inherits
  , Promise      = require('bluebird')
  , _            = require('./utils')
  , Manager      = require('./manager')
  , Schema       = require('./schema')
  , using        = Promise.using
  // Hooks events and aliases
  , HOOKS        = Schema.CONSTANT.HOOKS
  , ALIASES      = HOOKS.ALIASES
  , EVENTS       = HOOKS.NAMES;

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
  // pre/post hooks
  this._hooks = {
    pre: {},
    post: {}
  };
  EventEmitter.call(this);
}

/**
 * Inherit from EventEmitter.prototype
 */
inherits(Collection, EventEmitter);

/**
 * @description
 * define `pre` hooks for CollectionManager
 * @example
 *
 *  var users = db.use('users');
 *
 *  users.pre('save', function(next) {
 *    var user = this;
 *    // ...
 *    next();
 *  }, function(next) {
 *    // ...
 *  });
 *
 * @public
 */
Collection.prototype.pre = function() {
  this.hooks('pre', arguments);
};

/**
 * @description
 * define `post` hooks for CollectionManager
 * @example
 *
 *  var users = db.use('users');
 *
 *  users.post('save', function(user) {
 *    logger(user, 'saved!');
 *  });
 *
 * @public
 */
Collection.prototype.post = function() {
  this.hooks('post', arguments);
};

/**
 * @description
 * helper method for `pre`/`post` hooks
 * @param name - hook name
 * @param args - event-name, cb, ..., cb.
 * @private
 */
Collection.prototype.hooks = function(name, args) {
  var queue = this._hooks[name];
  var event = ALIASES[args[0]] || args[0];
  var fns = Array.prototype.slice.call(args, 1);
  queue[event] = (queue[event] || []).concat(fns);

  // Bind `.on` handler only for `post` hooks
  if(name === 'post') {
    fns.forEach(this.on.bind(this, event));
  }
};

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
 * get object properties, search for an object, if it exist - remove it,
 * else return false
 * @param object
 * @returns {*}
 */
Collection.prototype.findOneAndRemove = function(object) {
  var self = this;
  var pHooks = self._hooks.pre[EVENTS.DELETE] || [];
  // `Remove` operation
  function fn() {
    return using(_find.call(self, object), function(object) {
      return object ? self.manager.remove(object) : false;
    }).then(_.first);
  }

  return _callWithHooks.call(self, EVENTS.DELETE, object, pHooks, fn);
};

/**
 * @description
 * get object properties and modify the first matching.
 * @param sDoc
 * @param nDoc
 * @returns {*}
 */
Collection.prototype.findOneAndModify = function(sDoc, nDoc) {
  var self = this;
  var schema = self._schema;
  var pHooks = self._hooks.pre[EVENTS.UPDATE] || [];
  nDoc = schema ? schema.test.update(nDoc) : nDoc;

  // The `Update` operation
  function fn() {
    return using(_find.call(self, sDoc), nDoc, function(doc, nDoc) {
      return self.manager.update(doc, _.extend(doc, nDoc));
    }).then(_.first);
  }

  return _callWithHooks.call(self, EVENTS.UPDATE, nDoc, pHooks, fn);
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
  var self = this;
  var schema = self._schema;
  var pHooks = self._hooks.pre[EVENTS.CREATE] || [];
  doc = schema ? schema.test.create(doc) : doc;

  // The `Create` operation
  function fn() {
    return using(_getCollection.call(self), doc, function (coll, doc) {
      return self.manager.create(coll, doc || {});
    });
  }

  return _callWithHooks.call(self, EVENTS.CREATE, doc, pHooks, fn);
};

/**
 * @description
 * get object properties to search, find the equivalents
 * and remove them.
 * @param object
 * @returns {*}
 */
Collection.prototype.findAndRemove = function(object) {
  var self = this;
  var pHooks = self._hooks.pre[EVENTS.DELETE] || [];
  // Iterator
  function fn() {
    // The `Remove` operation
    function func(el) { return self.manager.remove(el); }
    return using(_find.call(self, object, true), func, _all);
  }

  return _callWithHooks.call(self, EVENTS.DELETE, object, pHooks, fn);
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
  var self = this;
  var schema = self._schema;
  var pHooks = self._hooks.pre[EVENTS.UPDATE] || [];
  nDoc = schema ? schema.test.update(nDoc) : nDoc;
  // Pass iterator to _all()
  function fn() {
    // The `Update` operation
    function func(doc) {
      return using(nDoc, function(nDoc) {
        return self.manager.update(doc, _.extend(doc, nDoc));
      });
    }
    return using(_find.call(self, sDoc, true), func, _all);
  }
  return _callWithHooks.call(self, EVENTS.UPDATE, nDoc, pHooks, fn);
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
 * return collection,
 * fetch from db on first time
 * @returns {*}
 * @private
 */
function _getCollection() {
  var ctx = this;
  var manager = ctx.manager;
  return new Promise(function(resolve, reject) {
    if(_.isCollection(ctx.coll)) {
      return resolve(ctx.coll)
    }
    using(manager.findOrCreate({ id: ctx.db }), function(database) {
      manager.findOrCreate(database, { id: ctx.coll })
        .then(function(collection) {
          ctx.coll = collection;
          resolve(collection);
        }, function(err) {
          reject(err);
        });
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
 * @param iterator
 * @returns {*}
 * @private
 */
function _all(arr, iterator) {
  var res = [];
  arr.forEach(function(i) {
    res.push(iterator(i).then(_.first));
  });
  return Promise.all(res);
}

/**
 * @description
 * pass the eventName, the document(for `post` hooks)
 * the `pre` hooks list and the last return function
 * @param event
 * @param doc
 * @param hooks
 * @param lastFn
 * @returns {Promise}
 * @private
 */
function _callWithHooks(event, doc, hooks, lastFn) {
  var self = this
    , fns = hooks.slice()
    , fn;
  return new Promise(function(resolve, reject) {
    (function __next() {
      if(_.isFunction(fn = fns.shift())) {
        return using(doc, function(doc) {
          fn.call(doc, __next);
        });
      }
      return lastFn().then(function(data) {
        resolve(data);
        self.emit(event, data);
      });
    })();
  });
}

/**
 * @exports
 */
module.exports = Collection;