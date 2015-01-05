/**
 * A set of helper stored procedures to allow server side multi-deletions and modifications
 *
 */

 var ERR_ALREADY_EXISTS = 409;
 var keys = Object.keys;

function findAndRemove(filterQuery) {
  var context = getContext();
  var collection = context.getCollection();

  var accept = collection.queryDocuments(collection.getSelfLink(), filterQuery, {}, function (err, documents) {
    if (err) {
      throw new Error('Error: ' + err.message);
    }

    documents.forEach(function(document) {
      collection.deleteDocument(document._self);
    });
  });

  if (!accept) throw new Error('Unable to execute query');  
}

function findAndModify(filterQuery, obj) {
  var context = getContext();
  var collection = context.getCollection();

  var accept = collection.queryDocuments(collection.getSelfLink(), filterQuery, {}, function (err, documents) {
    if (err) {
      throw new Error('Error: ' + err.message);
    }

    documents.forEach(function(document) {
      for(var key in obj) {
        document[key] = obj[key];
      }

      collection.replaceDocument(document._self, document);
    });
  });

  if (!accept) throw new Error('Unable to execute query');  
}

exports.findAndRemove = {
  id: 'findAndRemove',
  body: findAndRemove
};

exports.findAndModify = {
  id: 'findAndModify',
  body: findAndModify
};

exports.registerStoredProcedures = function(client, collectionSelfLink, forceUpdate, cb) {
  if (typeof forceUpdate === 'function') {
    cb = forceUpdate;
    forceUpdate = null;
  }

  cb = cb || Function();

  var sprocsMissing = {
    findAndRemove: true,
    findAndModify: true
  }

  var sprocs = {};

  return client.readStoredProcedures(collectionSelfLink).toArray(function(err, storedProcedures) {
    if (err) {
      return cb(err);
    }

    // find out which sprocs are already present and get their details
    storedProcedures.forEach(function(sproc) {
      if (sprocsMissing[sproc.id]) {
        sprocs[sproc.id] = sproc;
        if (!forceUpdate) {
          delete sprocsMissing[sproc.id];
        }        
      }
    });

    // register any missing sprocs
    var missing = keys(sprocsMissing);
    var count = missing.length;

    // no missing sprocs bail out
    if (count === 0) {
      return cb(null, sprocs);
    }

    function onRegisterComplete(err, sproc) {
      if (err) {
        return cb(err, sprocs);
      }

      count--;

      sprocs[sproc.id] = sproc;

      if (count === 0) {
        return cb(err, sprocs);
      }
    }

    missing.forEach(function(sprocName) {
      if (!sprocs[sprocName]) {
        return client.createStoredProcedure(collectionSelfLink, exports[sprocName], onRegisterComplete);
      }

      return client.replaceStoredProcedure(sprocs[sprocName]._self, exports[sprocName], onRegisterComplete);
    });
  });
};
