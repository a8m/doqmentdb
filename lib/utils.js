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
 * test if given array is empty
 * @param arr
 * @returns {*|boolean}
 */
function isEmpty(arr) {
  return isArray(arr) && !arr.length;
}

/**
 * @description
 * test if given object is string
 * @param val
 * @returns {boolean}
 */
function isString(val) {
  return"string"=== typeof val;
}

/**
 * @description
 * create query based on the given object params
 * @param params => { id: 1, name: 'bar' }
 * @returns {string}
 */
function queryBuilder(params) {
  var baseQuery = 'SELECT * FROM root r WHERE';
  keys(params).forEach(function(key, index, self) {
    var isLast = index === (self.length - 1);
    var wrap   = isString(params[key]) ? '"' : '';
    baseQuery += ' r.' + key + '=' + wrap + params[key] + wrap + (isLast ? '' : ' AND');
  });
  return baseQuery;
}

/**
 * @expose
 */
module.exports = {
  isDataBase: isDataBase,
  isCollection: isCollection,
  isDocument: isDocument,
  isEmpty: isEmpty,
  isArray: isArray,
  keys: keys,
  isString: isString,
  queryBuilder: queryBuilder
};