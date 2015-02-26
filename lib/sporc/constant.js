'use strict';

/**
 * @expose
 */
module.exports = {
  $UPDATE: {
    id: 'findAndModify',
    body: update
  },
  $FIND_OR_CREATE: {
    id: 'findOrCreate',
    body: findOrCreate
  },
  $REMOVE: {
    id: 'findAndRemove',
    body: remove
  }
};

/**
 * @description
 * update/findAndModify stored procedure.
 * @example
 *
 *    update('SELECT * from root r', { active: true })
 *    update('SELECT * from root r WHERE r.name = "bar"', { name: 'foo' })
 *    update('SELECT * from root r WHERE inUDF(r.arr, 3)', { arr: { $concat: [4, 5] } })
 *
 * @param query
 * @param object
 * @param one     - indicate if to update only the first one
 */
function update(query, object, one) {
  var context = getContext()
    , manager = context.getCollection();

  // This function comes from utils.extend
  function extend(dst, obj) {
    var _keys = Object.keys(obj);
    for (var j = 0, jj = _keys.length; j < jj; j++) {
      var key = _keys[j]
        , val = obj[key];
      // maybe operation
      if(!Array.isArray(val) && typeof val == 'object') {
        var fKey = Object.keys(val)[0]
          , op = fKey.substr(1);
        // it's an operation
        if(fKey[0] == '$' && dst[key][op]) {
          var args =  Array.isArray(val[fKey]) ? val[fKey] : [val[fKey]]
            , res = dst[key][op].apply(dst[key], args);
          // e.g: [].pop/push/shift/...
          dst[key] = typeof dst[key] == 'object' && res.constructor != dst[key].constructor
            ? dst[key]
            : res;
          // if it's nested object
        } else if(typeof dst[key] == 'object' && dst[key] != null) {
          dst[key] = extend(dst[key], val);
        }
      } else dst[key] = val;
    }
    return dst;
  }

  // Query Documents
  manager.queryDocuments(manager.getSelfLink(), query, function(err, docs) {
    if(err) throw new Error(err.message);

    docs = docs.slice(0, one ? 1 : docs.length);
    // If it's wrap with promise
    object = object.fulfillmentValue || object;

    // Extend operation
    docs.forEach(function(doc) {
      doc = extend(doc, object);
      manager.replaceDocument(doc._self, doc);
    });

    // Set response body
    context.getResponse().setBody(one ? (docs[0] || typeof docs[0]) : docs);
  });
}



/**
 * @description
 * findOrCreated stored procedure.
 * @example
 *
 *    findOrCreate('SELECT * from root r WHERE r.name = "foo"', { name: 'foo' })
 *
 * @param query
 * @param object
 */
function findOrCreate(query, object) {
  var context = getContext()
    , manager = context.getCollection()
    , _self = manager.getSelfLink();

  // Query Documents
  manager.queryDocuments(_self, query, function(err, docs) {
    if(err) throw new Error(err.message);

    // If it exist, return the first result
    if(docs.length) {
      return context.getResponse().setBody(docs[0]);
    }
    manager.createDocument(_self, object, function(err, data) {
      if(err) throw new Error(err.message);
      return context.getResponse().setBody(data);
    });
  });
}


/**
 * @description
 * find[One]AndRemove stored procedure.
 * @example
 *
 *    findAndRemove('SELECT * from root r WHERE r.name = "foo"', true)
 *    findAndRemove('SELECT * from root r)
 *
 * @param query - query builder result
 * @param one   - indicate if to remove only the first one
 */
function remove(query, one) {
  var context = getContext()
    , manager = context.getCollection();

  // Query Documents
  manager.queryDocuments(manager.getSelfLink(), query, function(err, data) {
    if(err) throw new Error(err.message);

    // Response body
    var body = [];
    if(data.length) {
      var itr = data.slice(0, one ? 1 : data.length);
      itr.forEach(function(doc) {
        manager.deleteDocument(doc._self, push);
        function push(err, data) { body.push(data); }
      });
    }
    return context.getResponse().setBody(body);
  });
}