'use strict';
var _ = require('../utils');

/**
 * @description
 * initialize schema service
 * with `test`, `validator`, `omiter` etc..
 * @param schema
 */
function schemaFactory(schema) {

  /**
   * @description
   * omit unexposed fields
   * @param model
   * @returns {*}
   */
  function omitUnexposed(model) {
    // If it's not found response
    if(!model) return model;
    _.forEach(schema, function(val, key) {
      return schema[key].expose
        ? true
        : delete model[key];
    });
    return model;
  }

  /**
   * @description
   * alidate fields, based on regex and type
   * @param model
   * @returns {boolean}
   */
  function testFields(model) {
    var fails;
    _.forEach(model, function(val, key) {
      var regex = schema[key].regex;
      var ctr = schema[key].type;
      // regex || type(constructor) validation
      var err = !regex.test(val) || ctr !== val.constructor;
      fails = ~~fails + (err ? 1 : 0);
    });
    return !fails;
  }

  /**
   * @description
   * complete unavailable fields,
   * and omit those are not in the schema
   * @param model
   * @returns {{}}
   */
  function fixFields(model) {
    var m = {};
    _.forEach(schema, function(val, key) {
      m[key] = !model[key] ? val.fixture : model[key];
    });
    return m;
  }

  /**
   * @expose
   */
  return {
    omit: omitUnexposed,
    test: testFields,
    fixture: fixFields
  };
}

/**
 * @expose
 */
module.exports = schemaFactory;