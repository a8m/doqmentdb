'use strict';
var  _ = require('../utils');

/**
 * @description
 * formatFilter
 * @example
 *
 *   formatFilter('{0}', 1)                         // '1'
 *   formatFilter('{1}, {0}', 'world', 'Hello')     // 'Hello world'
 *   formatFilter('r.{0} > {1}', 'id', 2)           // 'r.id > 2'
 *   formatFilter('r.{0} = {1}', 'name', '"foo"')   // 'r.name = "foo"'
 *
 * @param input
 * @returns {String}
 */
function formatFilter(input) {
  var args = Array.prototype.slice.call(arguments, 1);

  return input.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] === 'undefined' ? match : args[number];
  });
}

/**
 * @description
 * Wrap a string with another string
 * @example
 *
 *    wrapFilter('foo', 'bar')          // 'barfoobar'
 *    wrapFilter('foo', 'bar', 'baz')   // 'barfoobaz'
 *    wrapFilter(12, 'baz')             // 12
 *
 * @param input
 * @param {String=} wrap
 * @param {String=} ends
 * @returns {string}
 */
function wrapFilter(input, wrap, ends) {
  return _.isString(input)
    ? [wrap, input, ends || wrap].join('')
    : input;
}

/**
 * @description
 * toStringFilter
 * @example
 * @param obj
 * @returns {*}
 */
function toStringFilter(obj) {
  switch (_.type(obj)) {
    case 'regexp':
    case 'date':
    case 'function':
    case 'buffer':
      return obj.toString();
    default :
      return JSON.stringify(obj);
  }
}

/**
 @expose
 */
module.exports = {
  toString: toStringFilter,
  format: formatFilter,
  wrap: wrapFilter
};