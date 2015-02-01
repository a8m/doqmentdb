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
 */
function update(query, object) {
  var context = getContext()
    , manager = context.getCollection();

  // This function comes from utils.extend
  function extend(dst, obj) {
    var _keys = Object.keys(obj);
    for (var j = 0, jj = _keys.length; j < jj; j++) {
      var key = _keys[j]
        , val = obj[key];
      // maybe operation
      if(typeof val == 'object') {
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
          continue
        }
      }
      // common situation
      dst[key] = val;
    }
    return dst;
  }

  // Query Documents
  manager.queryDocuments(manager.getSelfLink(), query, function(err, docs) {
    if(err) throw new Error(err.message);

    // Extend operation
    docs.forEach(function(doc) {
      doc = extend(doc, object);
      manager.replaceDocument(doc._self, doc);
    });

    // Set response body
    context.getResponse().setBody(docs);
  });
}