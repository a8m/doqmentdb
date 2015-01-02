'use strict';
var CONST   = require('./constant')
  , _       = require('../utils')
  , factory = require('./schema');

/**
 * @description
 * test the given schema based on the config file
 * @param schema
 * @returns {*}
 */
function isValidSchema(schema) {
  _.forEach(schema, function(val, key) {
    // Test required fields
    var reqErr = CONST.FIELDS.REQUIRED.filter(function(field) {
      return !(field.name in val);
    });
    if(reqErr.length) {
      var err = _.first(reqErr);
      throw new Error(err.type.name + ' is required in `' + err.name + '` field.');
    }
    // Tests type fields
    var fields = CONST.FIELDS.REQUIRED.concat(CONST.FIELDS.OPTIONAL);
    var typeErr = fields.filter(function(field) {
      if(_.isUndefined(val[field.name])) return false;
       // if the type based on the `type` field
      return _.isString(field.type)
        ? val[field.name].constructor !== val[field.type]
        : field.type !== val[field.name].constructor;
    });
    if(typeErr.length) {
      throw new Error('`' + _.first(typeErr).name + '` should be type: ' + _.first(typeErr).type.name);
    }
  });
  return schema;
}

/**
 * @expose
 */
module.exports = {
  isValidSchema: isValidSchema,
  factory: factory,
  CONSTANT: CONST
};