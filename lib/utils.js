'use strict';

/**
 * @description
 * reference to .isArray function
 */
var isArray = Array.isArray;

/**
 * @description
 * reference to .keys function
 */
var keys = Object.keys;

/**
 * @description
 * test if given object is function
 * @param fn
 * @returns {boolean}
 */
function isFunction(fn) {
  return 'function' === typeof fn;
}

/**
 * @description
 * test if given object is documentDB database
 * @param obj
 * @returns {Boolean}
 */
function isDataBase(obj) {
  return obj && obj._self && obj._colls;
}

/**
 * @description
 * test if given object is documentDB collection
 * @param obj
 * @returns {Boolean}
 */
function isCollection(obj) {
  return obj && obj._self && obj._docs;
}

/**
 * @description
 * test if given object is documentDB document
 * @param obj
 * @returns {Boolean}
 */
function isDocument(obj) {
  return obj && obj._self && !obj._docs && !obj._colls;
}

/**
 * @description
 * get object, if it's documentdb object return it's type,
 * else return `typeof` result
 * @param obj
 * @returns {string}
 */
function type(obj) {
  if (isUndefined(obj._self)) return typeof obj;
  return isDataBase(obj) ? 'Database'
    : isCollection(obj) ? 'Collection' : 'Document';
}

/**
 * @description
 * test if given array is empty
 * @param obj
 * @returns {*|boolean}
 */
function isEmpty(obj) {
  return isArray(obj) ? !obj.length : !keys(obj).length;
}

/**
 * @description
 * test if given object is string
 * @param val
 * @returns {boolean}
 */
function isString(val) {
  return 'string' === typeof val;
}

/**
 * @description
 * create query based on the given object params
 * in the case where the value is an array, search for any of the given values
 * @param params => { id: 1, name: 'bar' }
 * @returns {string}
 */
function queryBuilder(params) {
  var baseQuery = 'SELECT * FROM root r WHERE';
  keys(params).forEach(function(key, index, self) {
    var isLast = index === (self.length - 1);
    var paramValue = params[key];
    var isMultiValue = isArray(paramValue);
    var wrap;
    var fieldEq;
    if (isMultiValue) {
      wrap = isString(paramValue[0]) ? '"' : '';
      fieldEq = 'r.' + key + '=' + wrap;
      baseQuery += ' ((' + fieldEq + paramValue.join(wrap + ') OR (' + fieldEq) + wrap + (isLast ? '))' : ')) AND');
    }
    else {
      wrap = isString(paramValue) ? '"' : '';
      baseQuery += ' r.' + key + '=' + wrap + paramValue + wrap + (isLast ? '' : ' AND');
    }
  });

  return baseQuery;
}

/**
 * @description
 * test if given object is undefined
 * @param val
 * @returns {boolean}
 */
function isUndefined(val) {
  return 'undefined' === typeof val;
}

/**
 * @description
 * test if given object is defined
 * @param val
 * @returns {boolean}
 */
function isDefined(val) {
  return 'undefined' !== typeof val;
}

/**
 * @description
 * return the first member in a given array
 * @param array
 * @returns {*}
 */
function first(array) {
  return isArray(array) ? array[0] : null;
}

/**
 * @description
 * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects.
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @returns {Object} Reference to `dst`.
 */
function extend(dst) {
  for (var i = 1, ii = arguments.length; i < ii; i++) {
    var obj = arguments[i];
    if (obj) {
      var keys = Object.keys(obj);
      for (var j = 0, jj = keys.length; j < jj; j++) {
        var key = keys[j];
        dst[key] = obj[key];
      }
    }
  }
  return dst;
}

/**
 * @description
 * flexible forEach function
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */
function forEach(obj, iterator, context) {
  var key, length;
  if (obj) {
    if (isFunction(obj)) {
      for (key in obj) {
        // Need to check if hasOwnProperty exists,
        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (isArray(obj)) {
      var isPrimitive = typeof obj !== 'object';
      for (key = 0, length = obj.length; key < length; key++) {
        if (isPrimitive || key in obj) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
      obj.forEach(iterator, context, obj);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    }
  }
  return obj;
}

/**
 * @expose
 */
module.exports = {
  extend: extend,
  forEach: forEach,
  isDataBase: isDataBase,
  isCollection: isCollection,
  isDocument: isDocument,
  isEmpty: isEmpty,
  isArray: isArray,
  isString: isString,
  isUndefined: isUndefined,
  isDefined: isDefined,
  first: first,
  keys: keys,
  type: type,
  queryBuilder: queryBuilder
};