'use strict';

/**
 * @expose
 */
module.exports = {
  QUERIES: {
    // Comparison Operators
    $gt:  'r.{0} > {1}',
    $gte: 'r.{0} >= {1}',
    $lt:  'r.{0} < {1}',
    $lte: 'r.{0} <= {1}',
    $ne:  'r.{0} <> {1}', // !=

    // Pre Defined Functions
    $in:  {
      format: 'udf.inUDF(r.{0}, {1})',
      name: 'inUDF',
      func: function $in(arr, val) {
        return Array.isArray(arr)
          ? arr.some(function(e) { return e === val })
          : false;
      }
    },
    $all: {
      format: 'udf.allUDF(r.{0}, {1})',
      name: 'allUDF',
      func: function $all(arr, val) {
        return Array.isArray(arr)
          ? arr.every(function(e) { return e === val })
          : false;
      }
    },
    $size: {
      format: 'udf.sizeUDF(r.{0}, {1})',
      name: 'sizeUDF',
      func: function $size(arr, len) { return arr.length === len; }
    },
    $regex: {
      format: 'udf.regexUDF(r.{0}, {1})',
      name: 'regexUDF',
      func: function $regex(string, regex) { return new RegExp(regex).test(string); }
    },
    $type: {
      format: 'udf.typeUDF(r.{0}, {1})',
      name: 'typeUDF',
      func: function $type(object, type) { return typeof object === type; }
    }
  }
};