'use strict';
var QUERIES = require('./constant').QUERIES
  , _       = require('../utils')
  , filter  = require('./filter');

/**
 * @expose
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
      var value = object[key];
      if(key == '$not') return filter.wrap(query(value, true), 'NOT(', ')');
      if(key == '$nor') return query({ $not: { $or: value } });
      if(_.isObject(value)) {
        var fKey = _.first(_.keys(value));
        // if it's a condition operator || function
        if(QUERIES[fKey]) {
          var val = QUERIES[fKey]
            , op  = val.format || val;
          if(_.isObject(val)) udfArray.push({ id: val.name, body: val.func });
          return filter.format(op, key, filter.toString(value[fKey]));

          // if it's a conjunctive operator
        } else if(~['$or', '$and'].indexOf(key)) {
          var cQuery = conjunctive(value, key.replace('$', '').toUpperCase()); // .. OR ..
          // Wrap with `NOT`, or single condition
          return (value.length > 1) && !not
            ? filter.wrap(cQuery, '(', ')')
            : cQuery;
        } else throw Error('invalid operator');
      }
      return filter.format('r.{0}={1}', key, filter.toString(value));
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
