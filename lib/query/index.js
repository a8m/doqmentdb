'use strict';
var QUERIES = require('./constant').QUERIES
  , _       = require('../utils')
  , filter  = require('./filter');

/**
 UserDefinedFunctions:
 -query for fn:
 connection
   .queryUserDefinedFunctions('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE r.id=something')
   .toArray(console.log)

 - create user defined function:
 var inPre = {
   id: 'isIn',
   body: function(val, array) { return array.some(function(e) { return e == val  }) }
 }

 connection.createUserDefinedFunction('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', inPre, console.log)

 - use them:
 connection
   .queryDocuments('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE isIn(3, r.arr)')
   .toArray(console.log)

 Operators:
 connection
   .queryDocuments('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE r.age > 2', { enableScanInQuery: true })
   .toArray(console.log)
 */
module.exports = function(object) {
  /**
   * @description
   * The stored UDF function
   * TODO: should returns as a => { UDF: [...], query: '...' }, if this query contains
   * one or more UDF function. else, should returns as a query string.
   */
  var udfArray = [];
  /**
   * @description
   * query builder
   * @param {Object} object
   * @param {Boolean=} not
   * @returns {String}
   */
  function query(object, not) {
    return _.keys(object).map(function(key) {
      if(key == '$not') return 'NOT(' + query(object[key], true) + ')';
      if(key == '$nor') return query({ $not: { $or: object[key] } });

      var value = object[key];
      if(_.isObject(value)) {
        var fKey = _.first(_.keys(value)); // get the first key
        if(QUERIES[fKey]) {
          var val = QUERIES[fKey]
            , op  = _.isObject(val) ? val.format : val;

          if(_.isObject(val)) udfArray.push({ id: val.name, body: val.func });
          return filter.format(op, key, filter.toString(value[fKey]));

        } else if(~['$or', '$and'].indexOf(key)) { // if it's a conjunctive operator
          var cQuery = conjunctive(value, key.replace('$', '').toUpperCase()); // .. OR ..
          return (value.length > 1) && !not // Wrap with `NOT`, or single condition
            ? filter.wrap(cQuery, '(', ')')
            : cQuery;
        } else throw Error('invalid operator');
      } else {
        return filter.format('r.{0}={1}', key, filter.toString(value));
      }
    }).join(' AND ');
  }

  /**
   * @description
   *
   * @param array
   * @param operator
   * @returns {*}
   */
  function conjunctive(array, operator) {
    return array.map(function(el) {
      var qStr = query(el);
      return  _.keys(el).length > 1
        ? filter.wrap(qStr, '(', ')')
        : qStr;
    }).join(' '  + operator + ' ');
  }

  /**
   * @returns the query results
   */
  return query(object);
};










